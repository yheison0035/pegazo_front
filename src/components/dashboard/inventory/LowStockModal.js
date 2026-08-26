'use client';

import Link from 'next/link';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import useTerms from '@/hooks/useTerms';
import { unitShortLabel } from '@/config/verticalProfiles';

// Formatea la cantidad: entero si no tiene decimales (unidades), con decimales
// si es por peso (kg/lb).
function fmtQty(n) {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, '');
}

// Detalle de productos por agotarse. Adaptado a cualquier negocio: usa el
// vocabulario del vertical (producto/plato/artículo…) y la unidad (und/kg/lb).
export default function LowStockModal({ items = [], onClose }) {
  const { usuario } = useAuth();
  const t = useTerms();
  const canEdit = ['SUPER_ADMIN', 'ADMIN', 'BODEGUERO', 'COORDINADOR'].includes(
    usuario?.role,
  );
  // Si la empresa tiene varias sedes, mostramos el local de cada producto.
  const multiLocal = new Set(items.map((i) => i.local).filter(Boolean)).size > 1;

  const agotados = items.filter((i) => (i.stock || 0) <= 0).length;
  const porAgotarse = items.length - agotados;

  const unitOf = (u) => unitShortLabel(u) || 'und';

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

        {/* Lista */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {items.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-gray-400">
              No hay {t.productPlural.toLowerCase()} por agotarse. 🎉
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((it) => {
                const stock = Number(it.stock) || 0;
                const min = Number(it.minStock) || 0;
                const agotado = stock <= 0;
                const pct = min > 0 ? Math.min(100, (stock / min) * 100) : 0;
                const u = unitOf(it.unit);
                const Row = canEdit ? Link : 'div';
                const rowProps = canEdit
                  ? { href: `/dashboard/inventory/edit/${it.id}`, onClick: onClose }
                  : {};
                return (
                  <li key={it.id}>
                    <Row
                      {...rowProps}
                      className={`flex items-center gap-3 px-5 py-3 ${
                        canEdit ? 'transition hover:bg-white' : ''
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${
                          agotado
                            ? 'bg-red-100 text-red-600'
                            : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        <CubeIcon className="h-5 w-5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {it.name}
                        </p>
                        {multiLocal && it.local && (
                          <p className="truncate text-[11px] text-gray-400">
                            {it.local}
                          </p>
                        )}
                        {/* Barra de nivel de stock vs mínimo */}
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
                            agotado
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {agotado ? 'Agotado' : `${fmtQty(stock)} ${u}`}
                        </span>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          mín: {fmtQty(min)} {u}
                        </p>
                      </div>

                      {canEdit && (
                        <ArrowRightIcon className="h-4 w-4 flex-none text-gray-300" />
                      )}
                    </Row>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-400">
            {canEdit
              ? 'Toca un producto para reponer su stock.'
              : 'Avísale al encargado para reponer.'}
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
