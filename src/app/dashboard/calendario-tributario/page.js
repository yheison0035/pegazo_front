'use client';

import { useCallback, useEffect, useState } from 'react';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import {
  CalendarDaysIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { getTaxCalendar } from '@/lib/api/routes/tax';

const OBLIGATION_LABEL = {
  IVA: 'IVA',
  RENTA: 'Renta',
  RETEFUENTE: 'Retención',
  ICA: 'ICA',
  OTRO: 'Otro',
};
const OBLIGATION_COLOR = {
  IVA: 'bg-orange-50 text-orange-600',
  RENTA: 'bg-purple-50 text-purple-600',
  RETEFUENTE: 'bg-blue-50 text-blue-600',
  ICA: 'bg-teal-50 text-teal-600',
  OTRO: 'bg-gray-100 text-gray-500',
};

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return '';
  }
}
function cop(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}
function daysLabel(n) {
  if (n < 0) return `Venció hace ${Math.abs(n)} día${Math.abs(n) !== 1 ? 's' : ''}`;
  if (n === 0) return 'Vence hoy';
  if (n === 1) return 'Vence mañana';
  return `Faltan ${n} días`;
}

export default function CalendarioTributarioPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTaxCalendar();
      setData(res?.data || null);
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

  const deadlines = data?.deadlines || [];
  const proximos = deadlines.filter((d) => d.status === 'PROXIMO');
  const vencidos = deadlines.filter((d) => d.status === 'VENCIDO');
  const pendientes = deadlines.filter((d) => d.status === 'PENDIENTE');
  const alerta = proximos.length + vencidos.length;

  const Card = ({ d }) => (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm ${
        d.status === 'VENCIDO'
          ? 'border-red-200'
          : d.status === 'PROXIMO'
            ? 'border-amber-200'
            : 'border-gray-100'
      }`}
    >
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              OBLIGATION_COLOR[d.obligation] || 'bg-gray-100 text-gray-500'
            }`}
          >
            {OBLIGATION_LABEL[d.obligation] || d.obligation}
          </span>
          {d.period && (
            <span className="text-[11px] text-gray-400">{d.period}</span>
          )}
        </div>
        <p className="truncate text-sm font-semibold text-gray-800">{d.title}</p>
        <p className="text-xs text-gray-500">{fmtDate(d.dueDate)}</p>
        {d.notes && <p className="mt-0.5 text-[11px] text-gray-400">{d.notes}</p>}
      </div>
      <span
        className={`flex-none rounded-lg px-3 py-1.5 text-xs font-bold ${
          d.status === 'VENCIDO'
            ? 'bg-red-50 text-red-600'
            : d.status === 'PROXIMO'
              ? 'bg-amber-50 text-amber-600'
              : 'bg-gray-50 text-gray-500'
        }`}
      >
        {daysLabel(d.daysLeft)}
      </span>
    </div>
  );

  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN, Roles.CONTADOR]}>
      <div className="relative mx-auto w-full max-w-3xl p-4">
        <LoadingOverlay show={loading} text="Cargando calendario..." />

        <div className="mb-4">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
            <CalendarDaysIcon className="h-6 w-6 text-orange-500" /> Calendario
            tributario
          </h1>
          <p className="text-sm text-gray-500">
            Tus vencimientos según el último dígito de tu NIT
            {data?.nitDigit ? ` (${data.nitDigit})` : ''} y tu régimen. Te
            avisamos cuando se acercan.
          </p>
        </div>

        {/* Resumen */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {data?.uvt ? (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              UVT {data.year}: {cop(data.uvt)}
            </span>
          ) : null}
          {data?.regime && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              Régimen: {data.regime}
            </span>
          )}
        </div>

        {/* Aviso */}
        {alerta > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-none" />
            <span>
              Tienes {alerta} obligación{alerta !== 1 ? 'es' : ''} que requieren
              atención pronto. Revisa las de abajo para no pasarte de la fecha.
            </span>
          </div>
        )}

        {!loading && deadlines.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-gray-400">
            No hay vencimientos cargados para tu empresa todavía.
            {!data?.nitDigit && (
              <p className="mt-1 text-xs">
                Tip: registra el NIT de tu empresa en Configuración para ver el
                calendario que te aplica.
              </p>
            )}
          </div>
        )}

        <div className="space-y-5">
          {vencidos.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-red-500">
                Vencidos
              </h2>
              <div className="space-y-2">
                {vencidos.map((d) => (
                  <Card key={d.id} d={d} />
                ))}
              </div>
            </section>
          )}
          {proximos.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-600">
                Próximos (8 días o menos)
              </h2>
              <div className="space-y-2">
                {proximos.map((d) => (
                  <Card key={d.id} d={d} />
                ))}
              </div>
            </section>
          )}
          {pendientes.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                Más adelante
              </h2>
              <div className="space-y-2">
                {pendientes.map((d) => (
                  <Card key={d.id} d={d} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
