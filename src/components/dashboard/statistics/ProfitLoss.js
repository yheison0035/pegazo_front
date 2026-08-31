'use client';

import { ChartCard, formatMoney } from './statsUI';
import { EXPENSE_TYPE_LABELS } from './ExpensesDetail';

// Estado de Resultados (P&G) del periodo, formato contable tipo Alegra/Siigo.
export default function ProfitLoss({ data }) {
  const s = data?.summary;
  if (!s) return null;

  const ventas = s.totalSales || 0;
  const costo = s.costOfGoods || 0;
  const utilidadBruta = s.grossMargin ?? ventas - costo;
  const margenBruto = ventas ? Math.round((utilidadBruta / ventas) * 100) : 0;
  const gastos = s.totalExpenses || 0;
  const utilidadNeta = s.profit ?? ventas - gastos;
  const margenNeto = ventas ? Math.round((utilidadNeta / ventas) * 100) : 0;
  const byType = data?.expensesByType || [];

  return (
    <ChartCard
      title="Estado de resultados"
      subtitle="Ingresos, costos y utilidad del periodo"
    >
      <div className="text-sm">
        <Row label="Ingresos operacionales (ventas cobradas)" value={ventas} strong />
        <Row label="(−) Costo de mercancía vendida" value={-costo} muted />
        <Row
          label={`= Utilidad bruta (margen ${margenBruto}%)`}
          value={utilidadBruta}
          strong
          divider
        />

        {byType.length > 0 && (
          <div className="mt-1">
            <p className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Gastos operativos
            </p>
            {byType.map((e) => (
              <Row
                key={e.type}
                label={EXPENSE_TYPE_LABELS[e.type] || e.type}
                value={-e.total}
                nested
              />
            ))}
          </div>
        )}
        <Row label="(−) Total gastos operativos" value={-gastos} muted divider />

        <Row
          label={`= Utilidad neta (margen ${margenNeto}%)`}
          value={utilidadNeta}
          result
        />
      </div>
    </ChartCard>
  );
}

function Row({ label, value, strong, muted, nested, result, divider }) {
  const neg = value < 0;
  return (
    <div
      className={`flex items-center justify-between gap-4 py-1.5 ${
        divider ? 'border-t border-gray-100' : ''
      } ${result ? 'mt-1 rounded-xl bg-orange-50 px-3 py-3' : ''}`}
    >
      <span
        className={`${nested ? 'pl-4 text-gray-500' : ''} ${
          strong || result ? 'font-semibold text-gray-800' : 'text-gray-600'
        } ${result ? 'text-base' : ''}`}
      >
        {label}
      </span>
      <span
        className={`whitespace-nowrap tabular-nums ${
          result
            ? `text-lg font-extrabold ${value >= 0 ? 'text-emerald-600' : 'text-red-600'}`
            : strong
              ? 'font-bold text-gray-900'
              : muted || nested
                ? 'text-gray-500'
                : 'text-gray-700'
        }`}
      >
        {neg ? '(' : ''}
        {formatMoney(Math.abs(value))}
        {neg ? ')' : ''}
      </span>
    </div>
  );
}
