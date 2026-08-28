'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  BanknotesIcon,
  PaperAirplaneIcon,
  PrinterIcon,
  TrashIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  MapIcon,
  ArrowsPointingOutIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import ProductSelector from '@/components/dashboard/form/fields/ProductSelectField/productSelector';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import { formatCOP } from '@/lib/api/utils/utils';
import { printComanda } from '@/utils/printComanda';
import {
  getMesas,
  createMesa,
  deleteMesa,
  updateMesa,
} from '@/lib/api/routes/mesas';
import {
  getComandasByMesa,
  createComanda,
  chargeMesa,
  setComandaStatus,
} from '@/lib/api/routes/comandas';
import { getLocals } from '@/lib/api/routes/locals';

// Roles que pueden cobrar la mesa (caja/recepción). El mesero solo toma pedidos.
const CHARGE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA', 'CAJA', 'ASESOR'];
const ORDER_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'RECEPCIONISTA',
  'CAJA',
  'ASESOR',
  'MESERO',
];

// Colores y etiqueta por estado del pedido.
const STATUS_META = {
  PENDIENTE: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-800' },
  PREPARANDO: { label: 'Preparando', cls: 'bg-blue-100 text-blue-800' },
  LISTO: { label: 'Listo', cls: 'bg-green-100 text-green-800' },
  ENTREGADO: { label: 'Entregado', cls: 'bg-emerald-100 text-emerald-800' },
};

// Mapea los ítems del ProductSelector al formato de comanda.
function toComandaItems(items) {
  return (items || []).map((p) => {
    const notes = (p.notes || '').trim() || undefined;
    return p.type === 'service'
      ? { serviceId: p.inventoryVariantId, quantity: p.quantity, notes }
      : { inventoryVariantId: p.inventoryVariantId, quantity: p.quantity, notes };
  });
}

export default function Mesas() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const canCharge = CHARGE_ROLES.includes(usuario?.role);
  const canOrder = ORDER_ROLES.includes(usuario?.role);
  // Crear/eliminar mesas es solo del dueño/admin (el backend lo restringe igual).
  const canManageMesas = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);

  const [mesas, setMesas] = useState([]);
  const [locals, setLocals] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocal, setNewLocal] = useState('');
  const [selected, setSelected] = useState(null); // mesa abierta
  const [comandas, setComandas] = useState([]); // pedidos abiertos de la mesa
  const [newItems, setNewItems] = useState([]);
  const [selKey, setSelKey] = useState(0); // para resetear el selector
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});

  // Buscador + vista (cuadrícula / plano) + modo organizar (arrastrar).
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'plano'
  const [arrange, setArrange] = useState(false);
  // Posiciones "en vivo" mientras se arrastra (id -> {x, y}).
  const [posOverride, setPosOverride] = useState({});
  const canvasRef = useRef(null);
  const dragRef = useRef(null); // {id, offX, offY, moved}

  // Medidas de la ficha y del lienzo.
  const TOKEN_W = 150;
  const TOKEN_H = 104;
  const FALL_COLS = 5;

  // Posición efectiva de una mesa: override en vivo > guardada > cuadrícula.
  const effPos = (m, i) => {
    if (posOverride[m.id]) return posOverride[m.id];
    if (m.posX != null && m.posY != null) return { x: m.posX, y: m.posY };
    return {
      x: 16 + (i % FALL_COLS) * (TOKEN_W + 16),
      y: 16 + Math.floor(i / FALL_COLS) * (TOKEN_H + 16),
    };
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const onTokenPointerDown = (e, mesa) => {
    if (!arrange || !canvasRef.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const canvas = canvasRef.current.getBoundingClientRect();
    const idx = mesas.findIndex((x) => x.id === mesa.id);
    const cur = effPos(mesa, idx);
    dragRef.current = {
      id: mesa.id,
      offX: e.clientX - canvas.left - cur.x,
      offY: e.clientY - canvas.top - cur.y,
      moved: false,
    };
  };

  const onTokenPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || !canvasRef.current) return;
    const canvas = canvasRef.current.getBoundingClientRect();
    const x = clamp(
      e.clientX - canvas.left - d.offX,
      0,
      canvas.width - TOKEN_W,
    );
    const y = clamp(e.clientY - canvas.top - d.offY, 0, 4000);
    d.moved = true;
    setPosOverride((p) => ({ ...p, [d.id]: { x: Math.round(x), y: Math.round(y) } }));
  };

  const onTokenPointerUp = async (e, mesa) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (!d.moved) return; // fue un toque, no un arrastre
    const pos = posOverride[d.id];
    if (!pos) return;
    // Optimista: fija la posición en la lista local y persiste.
    setMesas((list) =>
      list.map((x) => (x.id === d.id ? { ...x, posX: pos.x, posY: pos.y } : x)),
    );
    try {
      await updateMesa(d.id, { posX: pos.x, posY: pos.y });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo guardar la posición.' });
    }
  };

  const load = useCallback(async () => {
    try {
      const res = await getMesas();
      setMesas(res?.data || []);
    } catch {
      setMesas([]);
    }
  }, []);

  useEffect(() => {
    load();
    getLocals({ all: true })
      .then((r) => {
        const list = r?.data || [];
        setLocals(list);
        setNewLocal(String(usuario?.localId || list[0]?.id || ''));
      })
      .catch(() => setLocals([]));
  }, [load, usuario]);

  const loadComandas = async (mesaId) => {
    try {
      const res = await getComandasByMesa(mesaId);
      setComandas(res?.data || []);
    } catch {
      setComandas([]);
    }
  };

  const openMesa = async (mesa) => {
    setSelected(mesa);
    setNewItems([]);
    setSelKey((k) => k + 1);
    await loadComandas(mesa.id);
  };

  const closePanel = () => {
    setSelected(null);
    setComandas([]);
    setNewItems([]);
  };

  const handleCreateMesa = async () => {
    if (!newName.trim() || !newLocal) return;
    setBusy(true);
    try {
      await createMesa({ name: newName.trim(), localId: Number(newLocal) });
      setNewName('');
      setCreating(false);
      load();
    } finally {
      setBusy(false);
    }
  };

  // Cada "Enviar a cocina" es un pedido NUEVO: aparece como su propia tarjeta
  // con su estado. La cuenta de la mesa es la suma de todos sus pedidos.
  const sendToKitchen = async () => {
    const items = toComandaItems(newItems);
    if (!items.length) return;
    setBusy(true);
    try {
      await createComanda({
        mesaId: selected.id,
        localId: selected.localId,
        items,
      });
      setAlert({ type: 'success', message: 'Pedido enviado a cocina.' });
      setNewItems([]);
      setSelKey((k) => k + 1);
      await loadComandas(selected.id);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo enviar.' });
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (comanda, status) => {
    setBusy(true);
    try {
      await setComandaStatus(comanda.id, status);
      await loadComandas(selected.id);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo actualizar.' });
    } finally {
      setBusy(false);
    }
  };

  // Cobra TODA la mesa: junta todos los pedidos abiertos en una sola venta.
  const charge = async () => {
    if (!comandas.length) return;
    setBusy(true);
    try {
      await chargeMesa(selected.id, { paymentMethod: 'EFECTIVO' });
      setAlert({ type: 'success', message: 'Mesa cobrada. Venta registrada.' });
      closePanel();
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo cobrar.' });
    } finally {
      setBusy(false);
    }
  };

  const removeMesa = async (mesa) => {
    if (mesa.status === 'OCUPADA') return;
    await deleteMesa(mesa.id);
    load();
  };

  const grandTotal = comandas.reduce((s, c) => s + (c.total || 0), 0);

  const norm = (s) => (s || '').toString().toLowerCase();
  const filteredMesas = query.trim()
    ? mesas.filter((m) => norm(m.name).includes(norm(query)))
    : mesas;
  const canvasHeight = mesas.reduce(
    (h, m, i) => Math.max(h, effPos(m, i).y + TOKEN_H + 24),
    420,
  );

  return (
    <div className="w-full p-4">
      {/* Encabezado + herramientas */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">Mesas</h1>
          {canManageMesas && (
            <Button
              variant="add"
              icon={PlusIcon}
              onClick={() => setCreating(true)}
            >
              Nueva mesa
            </Button>
          )}
        </div>

        {mesas.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Buscador */}
            <div className="relative w-full sm:max-w-xs">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar mesa..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Vista: cuadrícula / plano */}
              <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('grid');
                    setArrange(false);
                  }}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    viewMode === 'grid'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Squares2X2Icon className="h-4 w-4" /> Cuadrícula
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('plano')}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    viewMode === 'plano'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MapIcon className="h-4 w-4" /> Plano
                </button>
              </div>

              {/* Organizar (arrastrar) — solo dueño/admin y en vista plano */}
              {viewMode === 'plano' && canManageMesas && (
                <button
                  type="button"
                  onClick={() => setArrange((v) => !v)}
                  className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${
                    arrange
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {arrange ? (
                    <>
                      <CheckIcon className="h-4 w-4" /> Listo
                    </>
                  ) : (
                    <>
                      <ArrowsPointingOutIcon className="h-4 w-4" /> Organizar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {mesas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
          Aún no tienes mesas. Crea la primera para empezar a tomar pedidos.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {filteredMesas.map((m) => {
            const ocupada = m.status === 'OCUPADA';
            return (
              <button
                key={m.id}
                onClick={() => openMesa(m)}
                className={`relative flex flex-col items-center justify-center rounded-2xl border p-5 text-center shadow-sm transition ${
                  ocupada
                    ? 'border-orange-300 bg-orange-50 hover:bg-orange-100'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-base font-bold text-gray-800">
                  {m.name}
                </span>
                <span
                  className={`mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    ocupada
                      ? 'bg-orange-200 text-orange-800'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {ocupada ? 'Ocupada' : 'Libre'}
                </span>
                {ocupada && m.openTotal > 0 && (
                  <span className="mt-1 text-sm font-bold text-gray-700">
                    {formatCOP(m.openTotal)}
                  </span>
                )}
                {ocupada && m.openCount > 0 && (
                  <span className="text-[11px] text-gray-500">
                    {m.openCount} pedido{m.openCount > 1 ? 's' : ''}
                  </span>
                )}
                {!ocupada && canManageMesas && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMesa(m);
                    }}
                    className="absolute right-1.5 top-1.5 text-gray-300 hover:text-red-500"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </span>
                )}
              </button>
            );
          })}
          {filteredMesas.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-gray-400">
              No hay mesas que coincidan con “{query}”.
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-gray-500">
            {arrange
              ? 'Arrastra las mesas para ubicarlas como en tu salón. Se guarda automáticamente.'
              : 'Vista del salón. Toca una mesa para tomar pedido o cobrar.'}
          </p>
          <div
            ref={canvasRef}
            onPointerMove={onTokenPointerMove}
            style={{ height: canvasHeight }}
            className="relative w-full overflow-auto rounded-2xl border border-gray-200 bg-gray-50 [background-image:linear-gradient(to_right,#eef0f3_1px,transparent_1px),linear-gradient(to_bottom,#eef0f3_1px,transparent_1px)] [background-size:24px_24px]"
          >
            {mesas.map((m, i) => {
              const pos = effPos(m, i);
              const ocupada = m.status === 'OCUPADA';
              const q = query.trim();
              const match = q && norm(m.name).includes(norm(q));
              const dim = q && !match;
              return (
                <div
                  key={m.id}
                  onPointerDown={(e) => onTokenPointerDown(e, m)}
                  onPointerUp={(e) => onTokenPointerUp(e, m)}
                  onClick={() => {
                    if (!arrange) openMesa(m);
                  }}
                  style={{ left: pos.x, top: pos.y, width: TOKEN_W, height: TOKEN_H }}
                  className={`absolute flex select-none flex-col items-center justify-center rounded-2xl border p-2 text-center shadow-sm transition ${
                    arrange ? 'cursor-move touch-none' : 'cursor-pointer'
                  } ${
                    ocupada
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-gray-200 bg-white'
                  } ${dim ? 'opacity-25' : ''} ${
                    match ? 'ring-2 ring-orange-400' : ''
                  }`}
                >
                  <span className="text-base font-bold text-gray-800">
                    {m.name}
                  </span>
                  <span
                    className={`mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      ocupada
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {ocupada ? 'Ocupada' : 'Libre'}
                  </span>
                  {ocupada && m.openTotal > 0 && (
                    <span className="mt-0.5 text-xs font-bold text-gray-700">
                      {formatCOP(m.openTotal)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Crear mesa */}
      {creating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setCreating(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-800">Nueva mesa</h2>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre (ej: Mesa 1)"
              className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            {locals.length > 1 && (
              <select
                value={newLocal}
                onChange={(e) => setNewLocal(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
              >
                {locals.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleCreateMesa} loading={busy}>
                Crear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Panel de la mesa: pedidos como tarjetas con estado + cuenta total */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closePanel}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {selected.name}
                </h2>
                {comandas.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {comandas.length} pedido{comandas.length > 1 ? 's' : ''} ·
                    cuenta {formatCOP(grandTotal)}
                  </p>
                )}
              </div>
              <button
                onClick={closePanel}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* Tarjetas de pedidos */}
              {comandas.length > 0 && (
                <div className="space-y-3">
                  {comandas.map((c) => {
                    const meta = STATUS_META[c.status] || {
                      label: c.status,
                      cls: 'bg-gray-100 text-gray-700',
                    };
                    return (
                      <div
                        key={c.id}
                        className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-800">
                              Pedido #{c.id}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => printComanda(c, selected.name)}
                            className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-100"
                          >
                            <PrinterIcon className="h-3.5 w-3.5" />
                            Imprimir
                          </button>
                        </div>
                        {c.user?.name && (
                          <p className="mb-1 text-[11px] text-gray-400">
                            Mesero: {c.user.name}
                          </p>
                        )}
                        {c.items?.map((it) => (
                          <div key={it.id} className="text-sm text-gray-700">
                            <div className="flex justify-between">
                              <span>
                                {it.quantity}× {it.name}
                              </span>
                              <span>{formatCOP(it.subtotal)}</span>
                            </div>
                            {it.notes && (
                              <p className="text-[11px] italic text-orange-600">
                                📝 {it.notes}
                              </p>
                            )}
                          </div>
                        ))}
                        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                          <span className="text-sm font-bold text-gray-900">
                            {formatCOP(c.total)}
                          </span>
                          <div className="flex gap-2">
                            {c.status === 'LISTO' && (
                              <button
                                type="button"
                                onClick={() => changeStatus(c, 'ENTREGADO')}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                              >
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                Entregado
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => changeStatus(c, 'CANCELADA')}
                              disabled={busy}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tomar un pedido nuevo */}
              {canOrder && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Nuevo pedido
                  </p>
                  <ProductSelector
                    key={selKey}
                    value={[]}
                    onChange={setNewItems}
                    inlineResults
                    allowNotes
                  />
                </div>
              )}
            </div>

            <div className="flex flex-none gap-2 border-t border-gray-100 bg-white p-4">
              {canOrder && (
                <Button
                  variant="add"
                  icon={PaperAirplaneIcon}
                  onClick={sendToKitchen}
                  loading={busy}
                  disabled={newItems.length === 0}
                  className="flex-1"
                >
                  Enviar a cocina
                </Button>
              )}
              {canCharge && comandas.length > 0 && (
                <Button
                  variant="primary"
                  icon={BanknotesIcon}
                  onClick={charge}
                  loading={busy}
                  className="flex-1"
                >
                  Cobrar mesa {formatCOP(grandTotal)}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({})}
      />
    </div>
  );
}
