'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/toastContext';
import useTerms from '@/hooks/useTerms';
import { unitShortLabel } from '@/config/verticalProfiles';
import { restockProduct } from '@/lib/api/routes/inventory';

// Formatea la cantidad: entero si no tiene decimales (unidades), con decimales
// si es por peso (kg/lb).
function fmtQty(n) {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, '');
}

// Quita tildes/mayúsculas para buscar sin importar acentos.
function norm(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ¿Sigue estando "por agotarse" con este stock?
function stillLow(stock, min) {
  return (min > 0 && stock <= min) || stock <= 0;
}

// Una fila de la lista, con su control de reponer rápido.
function LowStockRow({ item, canEdit, onClose, onRestocked }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState('');
  const [saving, setSaving] = useState(false);

  const stock = Number(item.stock) || 0;
  const min = Number(item.minStock) || 0;
  const agotado = stock <= 0;
  const pct = min > 0 ? Math.min(100, (stock / min) * 100) : 0;
  const u = unitShortLabel(item.unit) || 'und';
  const single = item.variantsCount === 1; // reponer rápido solo si 1 presentación

  const doRestock = async () => {
    const amount = Number(qty);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.show({ type: 'warning', message: 'Escribe una cantidad válida.' });
      return;
    }
    setSaving(true);
    try {
      const res = await restockProduct(item.id, amount);
      const newStock = res?.data?.stock ?? stock + amount;
      toast.show({
        type: 'success',
        message: `${item.name}: +${fmtQty(amount)} ${u} (ahora ${fmtQty(newStock)}).`,
      });
      onRestocked(item.id, newStock);
    } catch (e) {
      toast.show({
        type: 'error',
        message: e.message || 'No se pudo reponer.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="px-5 py-3">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${
            agotado ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
          }`}
        >
          <CubeIcon className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-800">
            {item.name}
          </p>
          {item.local && (
            <p className="truncate text-[11px] text-gray-400">{item.local}</p>
          )}
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${
                agotado ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${agotado ? 100 : pct}%` }}
            />
          </div>
        </div>

        <div className="flex-none text-right">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
              agotado ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {agotado ? 'Agotado' : `${fmtQty(stock)} ${u}`}
          </span>
          <p className="mt-0.5 text-[11px] text-gray-400">
            mín: {fmtQty(min)} {u}
          </p>
        </div>
      </div>

      {/* Acciones */}
      {canEdit && (
        <div className="mt-2 flex items-center justify-end gap-2">
          {single ? (
            open ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  autoFocus
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doRestock()}
                  placeholder="Cant."
                  className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={doRestock}
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? '...' : 'Reponer'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpen(true);
                  setQty(min > stock ? String(fmtQty(min - stock)) : '');
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
              >
                <PlusIcon className="h-4 w-4" /> Reponer
              </button>
            )
          ) : (
            <Link
              href={`/dashboard/inventory/edit/${item.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50"
            >
              <PencilSquareIcon className="h-4 w-4" /> Editar para reponer
            </Link>
          )}
        </div>
      )}
    </li>
  );
}

// Detalle de productos por agotarse. Adaptado a cualquier negocio: usa el
// vocabulario del vertical (producto/plato/artículo…) y la unidad (und/kg/lb).
// Incluye buscador, filtros y reponer rápido.
export default function LowStockModal({ items = [], onClose }) {
  const { usuario } = useAuth();
  const t = useTerms();
  const canEdit = [
    'SUPER_ADMIN',
    'ADMIN',
    'RECEPCIONISTA',
    'BODEGUERO',
  ].includes(usuario?.role);

  const [list, setList] = useState(items);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all'); // 'all' | 'out' | 'low'
  const [local, setLocal] = useState('');

  // Al reponer: si el producto ya superó su mínimo (y no está en 0), sale de la
  // lista; si sigue bajo, se actualiza su stock.
  const handleRestocked = (id, newStock) => {
    setList((prev) =>
      prev.flatMap((it) => {
        if (it.id !== id) return [it];
        if (stillLow(newStock, Number(it.minStock) || 0))
          return [{ ...it, stock: newStock }];
        return []; // resuelto → se quita
      }),
    );
  };

  const locals = useMemo(
    () => [...new Set(list.map((i) => i.local).filter(Boolean))].sort(),
    [list],
  );
  const multiLocal = locals.length > 1;

  const agotados = list.filter((i) => (i.stock || 0) <= 0).length;
  const porAgotarse = list.length - agotados;

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return list.filter((it) => {
      if (status === 'out' && (it.stock || 0) > 0) return false;
      if (status === 'low' && (it.stock || 0) <= 0) return false;
      if (local && it.local !== local) return false;
      if (q && !norm(it.name).includes(q)) return false;
      return true;
    });
  }, [list, query, status, local]);

  const chip = (key, label) => (
    <button
      key={key}
      type="button"
      onClick={() => setStatus(key)}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        status === key
          ? 'bg-amber-500 text-white shadow-sm'
          : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3 bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-6 w-6 flex-none" />
            <div>
              <h3 className="text-base font-bold leading-tight">
                {t.productPlural} por agotarse
              </h3>
              <p className="text-xs text-white/85">
                {agotados > 0 && (
                  <>
                    <b>{agotados}</b> agotado{agotados === 1 ? '' : 's'}
                    {porAgotarse > 0 ? ' · ' : ''}
                  </>
                )}
                {porAgotarse > 0 && (
                  <>
                    <b>{porAgotarse}</b> bajo{porAgotarse === 1 ? '' : 's'} de
                    mínimo
                  </>
                )}
                {list.length === 0 && 'Todo en orden'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/80 hover:bg-white/15 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Buscador + filtros */}
        <div className="space-y-2.5 border-b border-gray-100 bg-gray-50 px-4 py-3">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Buscar ${t.productSingular.toLowerCase()}…`}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {chip('all', `Todos (${list.length})`)}
            {chip('out', `Agotados (${agotados})`)}
            {chip('low', `Bajos (${porAgotarse})`)}
            {multiLocal && (
              <select
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                className="ml-auto rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600"
              >
                <option value="">Todas las sedes</option>
                {locals.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {filtered.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-gray-400">
              {list.length === 0
                ? `No hay ${t.productPlural.toLowerCase()} por agotarse. 🎉`
                : 'Nada coincide con la búsqueda.'}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((it) => (
                <LowStockRow
                  key={it.id}
                  item={it}
                  canEdit={canEdit}
                  onClose={onClose}
                  onRestocked={handleRestocked}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-400">
            {filtered.length} de {list.length}
          </p>
          <Link
            href="/dashboard/inventory"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg bg-gray-800 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700"
          >
            Ir al inventario <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
