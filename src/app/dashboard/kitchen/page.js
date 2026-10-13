'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FireIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/authContext';
import { getKitchen, setComandaStatus } from '@/lib/api/routes/comandas';
import {
  getMenuAvailability,
  setProductAvailability,
} from '@/lib/api/routes/inventory';

const NEXT = {
  PENDIENTE: { to: 'PREPARANDO', label: 'Empezar a preparar' },
  PREPARANDO: { to: 'LISTO', label: 'Marcar listo' },
  LISTO: { to: 'ENTREGADO', label: 'Entregar' },
};

const STATUS_META = {
  PENDIENTE: { label: 'Pendiente', chip: 'bg-orange-100 text-orange-700' },
  PREPARANDO: { label: 'Preparando', chip: 'bg-blue-100 text-blue-700' },
  LISTO: { label: 'Listo', chip: 'bg-green-100 text-green-700' },
};

// Minutos transcurridos desde que entró el pedido (para priorizar por espera).
function minutesSince(dateStr, now) {
  const ms = now - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / 60000));
}
function elapsedLabel(min) {
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  return `hace ${h} h ${min % 60} min`;
}

export default function Kitchen() {
  const auth = useAuth();
  // La cocina marca Preparando/Listo; "Entregar" es acción del mesero.
  const isCocinero = auth?.usuario?.role === 'COCINERO';
  const [comandas, setComandas] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Disponibilidad de la carta (platos que cocina enciende/apaga).
  const [menu, setMenu] = useState([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getKitchen();
      setComandas(res?.data || []);
    } catch {
      setComandas([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  const loadMenu = useCallback(async () => {
    try {
      const res = await getMenuAvailability();
      setMenu(res?.data || []);
    } catch {
      setMenu([]);
    }
  }, []);

  const toggleAvailability = async (p) => {
    setTogglingId(p.id);
    // Optimista: refleja el cambio al instante.
    setMenu((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, available: !p.available } : x)),
    );
    try {
      await setProductAvailability(p.id, !p.available);
    } catch {
      // Revertir si falla.
      setMenu((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, available: p.available } : x)),
      );
    } finally {
      setTogglingId(null);
    }
  };

  const menuFiltered = menu.filter((p) =>
    p.name.toLowerCase().includes(menuSearch.trim().toLowerCase()),
  );
  const unavailableCount = menu.filter((p) => p.available === false).length;

  useEffect(() => {
    load();
    loadMenu();
    // Casi en tiempo real: refresca datos cada 12s.
    const t = setInterval(load, 12000);
    // El reloj de espera avanza cada 20s aunque no haya recarga.
    const clock = setInterval(() => setNow(Date.now()), 20000);
    return () => {
      clearInterval(t);
      clearInterval(clock);
    };
  }, [load, loadMenu]);

  const advance = async (c) => {
    const next = NEXT[c.status]?.to;
    if (!next) return;
    await setComandaStatus(c.id, next);
    load();
  };

  const columns = ['PENDIENTE', 'PREPARANDO', 'LISTO'];

  return (
    <div className="w-full p-4">
      <h1 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-gray-800">
        <FireIcon className="h-6 w-6 text-orange-500" />
        Cocina
      </h1>

      {/* Disponibilidad de la carta: cocina enciende/apaga platos. Al apagar uno
          se avisa a los meseros y les sale "No disponible" al instante. */}
      {menu.length > 0 && (
        <details className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700">
            <span>Disponibilidad de la carta</span>
            <span className="text-xs font-medium text-gray-400">
              {unavailableCount > 0
                ? `${unavailableCount} no disponible(s)`
                : 'Todo disponible'}
            </span>
          </summary>
          <div className="border-t border-gray-100 p-3">
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Buscar plato…"
                className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div className="grid max-h-72 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
              {menuFiltered.map((p) => {
                const ok = p.available !== false;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={togglingId === p.id}
                    onClick={() => toggleAvailability(p)}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition disabled:opacity-50 ${
                      ok
                        ? 'border-gray-200 bg-white hover:bg-gray-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <span
                      className={`min-w-0 truncate font-medium ${
                        ok ? 'text-gray-800' : 'text-red-600 line-through'
                      }`}
                    >
                      {p.name}
                    </span>
                    <span
                      className={`inline-flex flex-none items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        ok
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {ok ? (
                        <>
                          <CheckCircleIcon className="h-3.5 w-3.5" /> Disponible
                        </>
                      ) : (
                        <>
                          <NoSymbolIcon className="h-3.5 w-3.5" /> No disp.
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
              {menuFiltered.length === 0 && (
                <p className="col-span-full py-3 text-center text-xs text-gray-400">
                  Sin platos.
                </p>
              )}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">
              Toca un plato para cambiar su disponibilidad. Los meseros lo ven al
              instante.
            </p>
          </div>
        </details>
      )}

      {loaded && comandas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
          No hay comandas en cocina.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {columns.map((col) => {
            const list = comandas.filter((c) => c.status === col);
            const meta = STATUS_META[col];
            return (
              <div key={col} className="rounded-2xl bg-gray-50 p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.chip}`}
                  >
                    {meta.label}
                  </span>
                  <span className="text-xs font-semibold text-gray-400">
                    {list.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {list.map((c) => {
                    const min = minutesSince(c.createdAt, now);
                    // Prioridad por espera: >15 min urgente, 8–15 min atención.
                    const urgent = col !== 'LISTO' && min >= 15;
                    const warn = col !== 'LISTO' && min >= 8 && min < 15;
                    return (
                    <div
                      key={c.id}
                      className={`rounded-xl border bg-white p-3 shadow-sm ${
                        urgent
                          ? 'border-red-300 ring-1 ring-red-200'
                          : warn
                            ? 'border-amber-300'
                            : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-800">
                          {c.mesa?.name || 'Para llevar'}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            urgent
                              ? 'text-red-600'
                              : warn
                                ? 'text-amber-600'
                                : 'text-gray-400'
                          }`}
                        >
                          {elapsedLabel(min)}
                        </span>
                      </div>
                      {c.user?.name && (
                        <p className="text-[11px] text-gray-400">
                          Mesero: {c.user.name} · #{c.id}
                        </p>
                      )}
                      <ul className="mt-2 space-y-0.5">
                        {c.items.map((it) => (
                          <li key={it.id} className="text-xs text-gray-600">
                            <span className="font-medium">
                              {it.quantity}× {it.name}
                            </span>
                            {it.notes && (
                              <span className="mt-0.5 block font-semibold text-orange-600">
                                📝 {it.notes}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      {c.notes && (
                        <p className="mt-1 text-[11px] italic text-gray-400">
                          {c.notes}
                        </p>
                      )}
                      {NEXT[c.status] &&
                        !(isCocinero && c.status === 'LISTO') && (
                          <Button
                            variant="add"
                            size="sm"
                            iconRight={ArrowRightIcon}
                            onClick={() => advance(c)}
                            className="mt-2 w-full"
                          >
                            {NEXT[c.status].label}
                          </Button>
                        )}
                    </div>
                    );
                  })}
                  {list.length === 0 && (
                    <p className="py-4 text-center text-[11px] text-gray-300">
                      —
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
