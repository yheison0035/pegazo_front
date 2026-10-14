'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CreditCardIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import Button from '@/components/ui/Button';
import PayModal from '@/components/billing/PayModal';
import { useAuth } from '@/context/authContext';
import { getOwnSubscription } from '@/lib/api/routes/company';
import { formatCOP, formatDateOnly } from '@/lib/api/utils/utils';

function Stat({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`rounded-xl p-2 ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="truncate text-xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function BillingInner() {
  const { usuario } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOwnSubscription();
      setData(res?.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const d = data || {};
  const dias = d.daysLeft;

  const estado = () => {
    if (dias === null || dias === undefined)
      return { text: 'Sin fecha de cobro', cls: 'bg-gray-100 text-gray-600' };
    if (d.overdue)
      return {
        text: `Vencida hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`,
        cls: 'bg-red-50 text-red-600',
      };
    if (dias <= 7)
      return {
        text: `Vence en ${dias} día${dias === 1 ? '' : 's'}`,
        cls: 'bg-amber-50 text-amber-600',
      };
    return { text: `Al día · ${dias} días`, cls: 'bg-emerald-50 text-emerald-600' };
  };
  const e = estado();

  return (
    <div className="w-full max-w-4xl p-4">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-800 sm:text-2xl">
        <CreditCardIcon className="h-6 w-6 text-orange-500" />
        Facturación
      </h1>
      <p className="mb-5 mt-1 text-sm text-gray-500">
        Estado de tu suscripción a Pegazo y los meses que has pagado.
      </p>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Cargando…</p>
      ) : (
        <div className="space-y-5">
          {/* Estado de la suscripción */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Estado de la suscripción
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${e.cls}`}
                >
                  {e.text}
                </span>
              </div>
              <Button variant="primary" onClick={() => setPayOpen(true)}>
                <BanknotesIcon className="mr-1.5 h-4 w-4" /> Cómo pagar
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-400">Próximo pago</p>
                <p className="font-semibold text-gray-800">
                  {d.paidUntil ? formatDateOnly(d.paidUntil) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Valor</p>
                <p className="font-semibold text-gray-800">
                  {d.monthlyPrice != null
                    ? formatCOP(d.monthlyPrice)
                    : 'Por definir'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Modo</p>
                <p className="font-semibold text-gray-800">
                  {d.billingMode === 'paquete' ? 'Paquete' : 'Mensual'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Cliente desde</p>
                <p className="font-semibold text-gray-800">
                  {d.startDate ? formatDateOnly(d.startDate) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Resumen de meses pagados */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              icon={CheckBadgeIcon}
              label="Meses pagados"
              value={d.totalMonths || 0}
              accent="bg-emerald-50 text-emerald-600"
            />
            <Stat
              icon={BanknotesIcon}
              label="Total pagado"
              value={formatCOP(d.totalPaid || 0)}
              accent="bg-orange-50 text-orange-600"
            />
            <Stat
              icon={CalendarDaysIcon}
              label="Pagos registrados"
              value={d.count || 0}
              accent="bg-indigo-50 text-indigo-600"
            />
          </div>

          {/* Historial de pagos */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-800">
              Historial de pagos
            </h2>
            {d.payments?.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr className="border-b border-gray-100">
                      <th className="py-2 pr-4">Fecha</th>
                      <th className="py-2 pr-4">Meses</th>
                      <th className="py-2 pr-4">Período cubierto</th>
                      <th className="py-2 pr-4 text-right">Pagado</th>
                      <th className="py-2 pr-4">Medio</th>
                      <th className="py-2 pr-4">Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {d.payments.map((p) => (
                      <tr key={p.id} className="text-gray-700">
                        <td className="py-2 pr-4 font-medium">
                          {formatDateOnly(p.paidAt)}
                        </td>
                        <td className="py-2 pr-4">{p.months}</td>
                        <td className="py-2 pr-4 text-gray-500">
                          {p.periodFrom
                            ? `${formatDateOnly(p.periodFrom)} → `
                            : '→ '}
                          {formatDateOnly(p.periodTo)}
                        </td>
                        <td className="py-2 pr-4 text-right font-semibold tabular-nums text-gray-900">
                          {formatCOP(p.amount)}
                        </td>
                        <td className="py-2 pr-4">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                            {p.method === 'EFECTIVO'
                              ? 'Efectivo'
                              : 'Transferencia'}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-gray-500">
                          {p.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-gray-400">
                Aún no hay pagos registrados.
              </p>
            )}
          </div>
        </div>
      )}

      <PayModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        company={usuario?.company}
      />
    </div>
  );
}

export default function BillingPage() {
  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN]}>
      <BillingInner />
    </RoleGuard>
  );
}
