'use client';

import { ChartCard, formatMoney } from './statsUI';
import { EXPENSE_TYPE_LABELS } from './ExpensesDetail';

function prettyMethod(m) {
  if (!m) return 'Otro';
  return String(m)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Flujo de caja del periodo: entradas (ventas cobradas por método) vs salidas
// (gastos por categoría) → flujo neto.
export default function CashFlow({ data }) {
  const s = data?.summary;
  if (!s) return null;

  const entradas = data?.paymentMethods || [];
  const salidas = data?.expensesByType || [];
  const totalIn = s.totalSales || 0;
  const totalOut = s.totalExpenses || 0;
  const neto = totalIn - totalOut;

  return (
    <ChartCard
      title="Flujo de caja"
      subtitle="Entradas y salidas de dinero del periodo"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Entradas */}
        <div>
          <div className="mb-2 flex items-center justify-between border-b border-emerald-100 pb-2">
            <span className="text-sm font-semibold text-emerald-700">
              Entradas (cobrado)
            </span>
            <span className="text-sm font-bold text-emerald-700">
              {formatMoney(totalIn)}
            </span>
          </div>
          {entradas.length ? (
            entradas.map((e) => (
              <Row key={e.method} label={prettyMethod(e.method)} value={e.total} />
            ))
          ) : (
            <p className="py-3 text-sm text-gray-400">Sin ingresos</p>
          )}
        </div>

        {/* Salidas */}
        <div>
          <div className="mb-2 flex items-center justify-between border-b border-orange-100 pb-2">
            <span className="text-sm font-semibold text-orange-700">Salidas (gastos)</span>
            <span className="text-sm font-bold text-orange-700">
              {formatMoney(totalOut)}
            </span>
          </div>
          {salidas.length ? (
            salidas.map((e) => (
              <Row
                key={e.type}
                label={EXPENSE_TYPE_LABELS[e.type] || e.type}
                value={e.total}
              />
            ))
          ) : (
            <p className="py-3 text-sm text-gray-400">Sin gastos</p>
          )}
        </div>
      </div>

      {/* Flujo neto */}
      <div
        className={`mt-5 flex items-center justify-between rounded-xl px-4 py-3 ${
          neto >= 0 ? 'bg-emerald-50' : 'bg-red-50'
        }`}
      >
        <span className="font-semibold text-gray-700">Flujo neto de caja</span>
        <span
          className={`text-lg font-extrabold ${
            neto >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {formatMoney(neto)}
        </span>
      </div>
    </ChartCard>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-50 py-1.5 text-sm">
      <span className="truncate text-gray-600">{label}</span>
      <span className="whitespace-nowrap font-medium text-gray-800">
        {formatMoney(value)}
      </span>
    </div>
  );
}
