'use client';

import { formatCOP, formatDateOnly } from '@/lib/api/utils/utils';

const STATUS_CLS = {
  PAGADA: 'bg-emerald-100 text-emerald-700',
  PARCIAL: 'bg-amber-100 text-amber-700',
  VENCIDA: 'bg-red-100 text-red-700',
  PENDIENTE: 'bg-gray-100 text-gray-500',
};
const STATUS_LABEL = { PAGADA: 'Pagada', PARCIAL: 'Parcial', VENCIDA: 'Vencida', PENDIENTE: 'Pendiente' };

// Tabla de cuotas. Sirve para el plan simulado (sin estado) y para el préstamo
// real (con pagado/pendiente/mora/estado por cuota).
export default function AmortizationTable({ installments = [], withStatus = false, compact = false }) {
  if (!installments.length) return null;
  const totals = installments.reduce(
    (a, i) => ({
      capital: a.capital + (Number(i.capital) || 0),
      interest: a.interest + (Number(i.interest) || 0),
      total: a.total + (Number(i.total) || 0),
      pending: a.pending + (Number(i.pendingTotal) || 0),
    }),
    { capital: 0, interest: 0, total: 0, pending: 0 },
  );
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 ${compact ? 'max-h-72 overflow-y-auto' : ''}`}>
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Vence</th>
            <th className="px-3 py-2 text-right">Capital</th>
            <th className="px-3 py-2 text-right">Interés</th>
            <th className="px-3 py-2 text-right">Cuota</th>
            {withStatus ? (
              <>
                <th className="px-3 py-2 text-right">Mora</th>
                <th className="px-3 py-2 text-right">Pendiente</th>
                <th className="px-3 py-2">Estado</th>
              </>
            ) : (
              <th className="px-3 py-2 text-right">Saldo</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {installments.map((i) => (
            <tr key={i.number} className={i.status === 'VENCIDA' ? 'bg-red-50/40' : ''}>
              <td className="px-3 py-1.5 font-medium text-gray-700">{i.number}</td>
              <td className="px-3 py-1.5 text-gray-600">{formatDateOnly(i.dueDate)}</td>
              <td className="px-3 py-1.5 text-right text-gray-700">{formatCOP(i.capital)}</td>
              <td className="px-3 py-1.5 text-right text-gray-700">{formatCOP(i.interest)}</td>
              <td className="px-3 py-1.5 text-right font-semibold text-gray-900">{formatCOP(i.total)}</td>
              {withStatus ? (
                <>
                  <td className="px-3 py-1.5 text-right text-red-600">{i.moraAccrued ? formatCOP(i.moraAccrued) : '—'}</td>
                  <td className="px-3 py-1.5 text-right text-gray-900">{formatCOP(i.pendingTotal || 0)}</td>
                  <td className="px-3 py-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[i.status] || STATUS_CLS.PENDIENTE}`}>
                      {STATUS_LABEL[i.status] || i.status}
                      {i.status === 'VENCIDA' && i.daysLate ? ` · ${i.daysLate}d` : ''}
                    </span>
                  </td>
                </>
              ) : (
                <td className="px-3 py-1.5 text-right text-gray-500">{formatCOP(i.balanceAfter ?? 0)}</td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 text-xs font-semibold text-gray-700">
          <tr>
            <td className="px-3 py-2" colSpan={2}>Totales</td>
            <td className="px-3 py-2 text-right">{formatCOP(totals.capital)}</td>
            <td className="px-3 py-2 text-right">{formatCOP(totals.interest)}</td>
            <td className="px-3 py-2 text-right">{formatCOP(totals.total)}</td>
            {withStatus ? (
              <>
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-right">{formatCOP(totals.pending)}</td>
                <td className="px-3 py-2" />
              </>
            ) : (
              <td className="px-3 py-2" />
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
