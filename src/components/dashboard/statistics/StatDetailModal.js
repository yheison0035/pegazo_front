'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatMoney, shortDate } from './statsUI';
import { EXPENSE_TYPE_LABELS } from './ExpensesDetail';

// Modal de detalle al hacer clic en un valor/tarjeta.
// kind: 'expenses' -> listado de gastos | 'sales' -> desglose de ventas.
export default function StatDetailModal({ title, subtitle, kind, data, onClose }) {
  const expenses = [...(data?.expensesDetail || [])].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  const expTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {kind === 'expenses' ? (
            expenses.length ? (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Concepto</th>
                    <th className="py-2 pr-3">Categoría</th>
                    <th className="py-2 pr-3">Método</th>
                    <th className="py-2 pl-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses.map((e) => (
                    <tr key={e.id} className="text-gray-700">
                      <td className="whitespace-nowrap py-2 pr-3 text-gray-400">
                        {shortDate(String(e.date).slice(0, 10))}
                      </td>
                      <td className="py-2 pr-3 font-medium text-gray-800">
                        {e.concept}
                      </td>
                      <td className="py-2 pr-3">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {EXPENSE_TYPE_LABELS[e.type] || e.type}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-gray-500">
                        {e.paymentMethod || '—'}
                      </td>
                      <td className="py-2 pl-3 text-right font-semibold text-gray-900">
                        {formatMoney(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 font-bold text-gray-900">
                    <td className="py-3 pr-3" colSpan={4}>
                      Total
                    </td>
                    <td className="py-3 pl-3 text-right">
                      {formatMoney(expTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">
                Sin gastos en este periodo
              </p>
            )
          ) : (
            <div className="space-y-6">
              <DetailList title="Top productos" rows={data?.topProducts} nameKey="name" />
              <DetailList title="Top servicios" rows={data?.topServices} nameKey="name" />
              <DetailList title="Métodos de pago" rows={data?.paymentMethods} nameKey="method" />
              <DetailList title="Mejores clientes" rows={data?.topCustomers} nameKey="name" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailList({ title, rows, nameKey }) {
  const list = rows || [];
  if (!list.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </p>
      <div className="space-y-1">
        {list.map((r, i) => (
          <div
            key={r[nameKey] || i}
            className="flex items-center justify-between gap-4 border-b border-gray-50 py-1.5 text-sm"
          >
            <span className="truncate text-gray-700">{r[nameKey]}</span>
            <span className="whitespace-nowrap font-semibold text-gray-900">
              {formatMoney(r.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
