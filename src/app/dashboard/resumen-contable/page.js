'use client';

import { useCallback, useEffect, useState } from 'react';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import {
  ChartPieIcon,
  BanknotesIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { getFinancials } from '@/lib/api/routes/accounting';
import { getTaxCalendar } from '@/lib/api/routes/tax';

function cop(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}
function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      timeZone: 'UTC',
    });
  } catch {
    return '';
  }
}
function daysLabel(n) {
  if (n < 0) return `Venció hace ${Math.abs(n)}d`;
  if (n === 0) return 'Hoy';
  if (n === 1) return 'Mañana';
  return `${n} días`;
}
const val = (arr, code) => (arr || []).find((a) => a.code === code)?.value || 0;

export default function ResumenContablePage() {
  const [fin, setFin] = useState(null);
  const [cal, setCal] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, c] = await Promise.all([
        getFinancials(), // mes actual por defecto
        getTaxCalendar(),
      ]);
      setFin(f?.data || null);
      setCal(c?.data || null);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useLiveRefresh(load);

  const pyg = fin?.incomeStatement;
  const bal = fin?.balanceSheet;
  const porCobrar = val(bal?.assets, '1305'); // Clientes
  const porPagar = val(bal?.liabilities, '2205'); // Proveedores
  const utilidad = pyg?.netProfit || 0;

  const alertas = (cal?.deadlines || [])
    .filter((d) => d.status === 'PROXIMO' || d.status === 'VENCIDO')
    .slice(0, 5);

  const cards = [
    {
      label: 'Utilidad del mes',
      value: cop(utilidad),
      icon: ChartPieIcon,
      cls: utilidad >= 0 ? 'text-emerald-600' : 'text-red-500',
    },
    { label: 'Te deben (cartera)', value: cop(porCobrar), icon: CreditCardIcon, cls: 'text-orange-600' },
    { label: 'Debes a proveedores', value: cop(porPagar), icon: BanknotesIcon, cls: 'text-gray-700' },
  ];

  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN]}>
      <div className="relative mx-auto w-full max-w-3xl p-4">
        <LoadingOverlay show={loading} text="Cargando resumen..." />

        <div className="mb-4">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
            <ChartPieIcon className="h-6 w-6 text-orange-500" /> Resumen contable
          </h1>
          <p className="text-sm text-gray-500">
            Lo esencial de tus números. El detalle (libros, plan de cuentas,
            declaraciones) lo lleva tu contador.
          </p>
        </div>

        {/* Tarjetas */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center gap-1.5 text-gray-400">
                <c.icon className="h-4 w-4" />
                <p className="text-[10px] font-semibold uppercase tracking-wide">{c.label}</p>
              </div>
              <p className={`text-xl font-bold tabular-nums ${c.cls}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Próximos vencimientos */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-orange-500" />
            <h2 className="text-sm font-bold text-gray-800">Próximos vencimientos</h2>
          </div>
          {alertas.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              Nada urgente por ahora.
            </p>
          ) : (
            <ul className="space-y-2">
              {alertas.map((d) => (
                <li
                  key={d.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                    d.status === 'VENCIDO' ? 'border-red-200 bg-red-50/40' : 'border-amber-200 bg-amber-50/40'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    {d.status === 'VENCIDO' && (
                      <ExclamationTriangleIcon className="h-4 w-4 flex-none text-red-500" />
                    )}
                    <span>{d.title}</span>
                    <span className="text-[11px] text-gray-400">· {fmtDate(d.dueDate)}</span>
                  </div>
                  <span
                    className={`flex-none rounded-lg px-2.5 py-1 text-xs font-bold ${
                      d.status === 'VENCIDO' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {daysLabel(d.daysLeft)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-4 rounded-2xl bg-orange-50/60 px-4 py-3 text-center text-xs text-orange-700">
          Tu contador ya está enlazado y lleva tu contabilidad al día. Si
          necesitas algo puntual, escríbele.
        </p>
      </div>
    </RoleGuard>
  );
}
