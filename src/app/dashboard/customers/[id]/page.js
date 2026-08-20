'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  BanknotesIcon,
  ArrowPathRoundedSquareIcon,
  TicketIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  MapPinIcon,
  EnvelopeIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import WhatsappLink from '@/components/dashboard/tables/segments/contentData/whatsappLink';
import { getCustomerSummary } from '@/lib/api/routes/customers';
import { formatCOP, formatDateOnly } from '@/lib/api/utils/utils';
import { segmentMeta } from '@/lib/customerSegment';
import { statusMeta } from '@/lib/appointmentStatus';

function Kpi({ icon: Icon, label, value, accent = 'text-gray-900' }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className={`mt-1 text-xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default function CustomerProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getCustomerSummary(id);
        if (alive) setData(res?.data || null);
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-400">Cargando ficha del cliente…</div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">No se pudo cargar el cliente.</p>
        <Button
          variant="secondary"
          icon={ArrowLeftIcon}
          href="/dashboard/customers"
          className="mt-3"
        >
          Volver a clientes
        </Button>
      </div>
    );
  }

  const { customer, metrics, topItems, sales, appointments } = data;
  const seg = segmentMeta(metrics.segment);
  const maxQty = topItems?.[0]?.qty || 1;

  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button variant="secondary" icon={ArrowLeftIcon} href="/dashboard/customers">
          Volver
        </Button>
        <Button
          variant="outline"
          icon={PencilSquareIcon}
          href={`/dashboard/customers/edit/${customer.id}`}
        >
          Editar
        </Button>
      </div>

      {/* Identidad */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">
                {customer.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${seg.chip}`}
              >
                {seg.label}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              {customer.document && (
                <span className="inline-flex items-center gap-1">
                  <IdentificationIcon className="h-4 w-4" />
                  {customer.document}
                </span>
              )}
              {customer.email && (
                <span className="inline-flex items-center gap-1">
                  <EnvelopeIcon className="h-4 w-4" />
                  {customer.email}
                </span>
              )}
              {customer.local?.name && (
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  {customer.local.name}
                </span>
              )}
            </div>
          </div>
          {customer.phone && (
            <div className="flex-none">
              <WhatsappLink phone={customer.phone} />
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={BanknotesIcon}
          label="Total gastado"
          value={formatCOP(metrics.ltv)}
          accent="text-emerald-600"
        />
        <Kpi
          icon={ArrowPathRoundedSquareIcon}
          label="Visitas"
          value={metrics.visits}
        />
        <Kpi
          icon={TicketIcon}
          label="Ticket promedio"
          value={formatCOP(metrics.avgTicket)}
        />
        <Kpi
          icon={CalendarDaysIcon}
          label="Última visita"
          value={metrics.lastVisit ? formatDateOnly(metrics.lastVisit) : '—'}
        />
      </div>

      {metrics.pendingFiado > 0 && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Tiene {formatCOP(metrics.pendingFiado)} pendientes por cobrar (fiado).
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Lo que suele consumir */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700">
            Lo que suele consumir
          </h2>
          {topItems.length === 0 ? (
            <p className="mt-3 text-xs text-gray-400">Aún sin consumos.</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {topItems.map((it) => (
                <div key={it.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate text-gray-700">{it.name}</span>
                    <span className="flex-none font-semibold text-gray-500">
                      {it.qty}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-orange-400"
                      style={{ width: `${(it.qty / maxQty) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Citas recientes */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700">Citas recientes</h2>
          {appointments.length === 0 ? (
            <p className="mt-3 text-xs text-gray-400">Sin citas registradas.</p>
          ) : (
            <div className="mt-3 divide-y divide-gray-100">
              {appointments.slice(0, 6).map((a) => {
                const s = statusMeta(a.status);
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-2 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-gray-700">
                        {a.service?.name || 'Servicio'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDateOnly(a.date)} · {a.startTime}
                        {a.barber?.name ? ` · ${a.barber.name}` : ''}
                      </p>
                    </div>
                    <span
                      className={`flex-none rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.chip}`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Historial de compras */}
      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700">Historial de compras</h2>
        {sales.length === 0 ? (
          <p className="mt-3 text-xs text-gray-400">Sin compras registradas.</p>
        ) : (
          <div className="mt-3 divide-y divide-gray-100">
            {sales.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {formatDateOnly(s.saleDate)}
                    {s.paymentStatus === 'FIADO' && (
                      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                        Fiado
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {s.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
                  </p>
                </div>
                <span className="flex-none text-sm font-bold text-gray-900">
                  {formatCOP(s.totalAmount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
