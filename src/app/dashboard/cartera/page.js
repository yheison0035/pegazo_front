'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CreditCardIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import { getReceivables } from '@/lib/api/routes/sales';
import { formatCOP, formatDateOnly } from '@/lib/api/utils/utils';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import AbonoModal from '@/components/cartera/AbonoModal';

// Semáforo de mora por días de vencimiento.
function OverdueBadge({ days, dueDate }) {
  if (!dueDate) return <span className="text-gray-400">—</span>;
  if (days <= 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        Al día
      </span>
    );
  const cls =
    days > 30
      ? 'bg-red-50 text-red-700 ring-red-600/20'
      : days > 8
        ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
        : 'bg-orange-50 text-orange-700 ring-orange-600/20';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {days} {days === 1 ? 'día' : 'días'} de mora
    </span>
  );
}

export default function CarteraPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ totalSaldo: 0, count: 0, rows: [] });
  const [search, setSearch] = useState('');
  const [abonoSale, setAbonoSale] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReceivables();
      setData(res?.data || { totalSaldo: 0, count: 0, rows: [] });
    } catch (_) {
      setData({ totalSaldo: 0, count: 0, rows: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = data.rows.filter((r) => {
    const t = search.trim().toLowerCase();
    if (!t) return true;
    return (
      r.code?.toLowerCase().includes(t) ||
      r.customer?.name?.toLowerCase().includes(t) ||
      r.customer?.document?.includes(t)
    );
  });

  const overdueTotal = data.rows
    .filter((r) => r.overdueDays > 0)
    .reduce((a, r) => a + r.saldo, 0);

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        {loading && <LoadingOverlay />}

        <div className="mb-5">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
            <CreditCardIcon className="h-7 w-7 text-orange-500" />
            Cartera
          </h1>
          <p className="text-sm text-gray-500">
            Ventas a crédito (fiado) con saldo pendiente. Registra abonos y
            controla la mora.
          </p>
        </div>

        {/* Resumen */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Total por cobrar
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCOP(data.totalSaldo)}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Cuentas abiertas
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {data.count}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              En mora
            </p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {formatCOP(overdueTotal)}
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="mb-3 relative max-w-sm">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, documento o factura…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-5 py-3">Factura</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Vence</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Abonado</th>
                  <th className="px-5 py-3 text-right">Saldo</th>
                  <th className="px-5 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-4">
                      <EmptyState
                        icon={BanknotesIcon}
                        title="No hay cuentas por cobrar"
                        subtitle="Cuando hagas una venta a crédito (fiado), aparecerá aquí."
                      />
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-orange-50">
                    <td className="px-5 py-3 font-medium text-gray-700 whitespace-nowrap">
                      {r.code}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {r.customer?.name || 'Consumidor final'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-500">
                      {formatDateOnly(r.saleDate)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-500">
                      {r.dueDate ? formatDateOnly(r.dueDate) : '—'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <OverdueBadge days={r.overdueDays} dueDate={r.dueDate} />
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap text-gray-600">
                      {formatCOP(r.total)}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap text-emerald-600">
                      {formatCOP(r.paid)}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap font-bold text-gray-900">
                      {formatCOP(r.saldo)}
                    </td>
                    <td className="px-5 py-3 text-center whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setAbonoSale(r)}
                      >
                        Abonar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {abonoSale && (
          <AbonoModal
            sale={abonoSale}
            onClose={() => setAbonoSale(null)}
            onSaved={() => load()}
          />
        )}
      </div>
    </RoleGuard>
  );
}
