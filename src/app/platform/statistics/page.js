'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ShieldExclamationIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

import RoleGuard from '@/auth/roleGuard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import {
  getPlatformOverview,
  getPlatformAudit,
  getPlatformActivity,
} from '@/lib/api/routes/companies';
import { formatDateOnly } from '@/lib/api/utils/utils';

const cop = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

function Card({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`rounded-xl p-2 ${accent}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="truncate text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// Barras horizontales para desgloses (un solo tono; el valor va como etiqueta).
function BreakdownBars({ title, rows, labelKey, max }) {
  const top = max || Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-800">{title}</h2>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">Sin datos.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div key={r[labelKey]} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs font-medium text-gray-600">
                {r[labelKey]}
              </span>
              <div className="h-5 flex-1 overflow-hidden rounded-md bg-gray-100">
                <div
                  className="flex h-full items-center justify-end rounded-md bg-orange-400 px-2 text-[11px] font-semibold text-white"
                  style={{ width: `${Math.max(8, (r.count / top) * 100)}%` }}
                >
                  {r.count}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlatformStatistics() {
  const [data, setData] = useState(null);
  const [audit, setAudit] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, au, act] = await Promise.all([
        getPlatformOverview(),
        getPlatformAudit(30).catch(() => ({ data: [] })),
        getPlatformActivity(40).catch(() => ({ data: [] })),
      ]);
      setData(ov?.data || null);
      setAudit(au?.data || []);
      setActivity(act?.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const t = data?.totals;
  const growth = data?.growth || [];
  const maxGrowth = Math.max(1, ...growth.map((g) => g.count));

  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <div className="relative w-full p-4">
        <LoadingOverlay show={loading} text="Cargando resumen..." />

        <h1 className="mb-1 text-2xl font-semibold">Estadísticas Globales</h1>
        <p className="mb-6 text-sm text-gray-500">
          Visión general de toda la plataforma.
        </p>

        {/* Ingresos */}
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Ingresos
        </h2>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card
            icon={BanknotesIcon}
            label="MRR (mes)"
            value={cop(t?.mrr)}
            accent="bg-emerald-50 text-emerald-600"
            sub="Ingreso recurrente de empresas activas"
          />
          <Card
            icon={ArrowTrendingUpIcon}
            label="ARR (año)"
            value={cop(t?.arr)}
            accent="bg-emerald-50 text-emerald-600"
            sub="Proyección anual (MRR × 12)"
          />
          <Card
            icon={ShieldExclamationIcon}
            label="Ingreso en riesgo"
            value={cop(t?.revenueAtRisk)}
            accent="bg-red-50 text-red-600"
            sub="De empresas vencidas por pagar"
          />
        </div>

        {/* Portafolio */}
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Portafolio
        </h2>
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Card
            icon={BuildingOffice2Icon}
            label="Empresas"
            value={t?.companies ?? '—'}
            accent="bg-orange-50 text-orange-600"
          />
          <Card
            icon={CheckCircleIcon}
            label="Activas"
            value={t?.active ?? '—'}
            accent="bg-green-50 text-green-600"
          />
          <Card
            icon={NoSymbolIcon}
            label="Suspendidas"
            value={t?.suspended ?? '—'}
            accent="bg-gray-100 text-gray-600"
          />
          <Card
            icon={ExclamationTriangleIcon}
            label="Vencidas"
            value={t?.overdue ?? '—'}
            accent="bg-red-50 text-red-600"
          />
          <Card
            icon={UsersIcon}
            label="Usuarios"
            value={t?.users ?? '—'}
            accent="bg-orange-50 text-orange-600"
          />
          <Card
            icon={BuildingStorefrontIcon}
            label="Locales"
            value={t?.locals ?? '—'}
            accent="bg-teal-50 text-teal-600"
          />
        </div>

        {/* Crecimiento */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">
            Nuevas empresas (últimos 6 meses)
          </h2>
          <div className="flex items-end gap-3" style={{ height: 160 }}>
            {growth.map((g, i) => {
              const last = i === growth.length - 1;
              return (
                <div key={g.key} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">
                    {g.count}
                  </span>
                  <div
                    className={`w-full rounded-t-md ${
                      last ? 'bg-orange-500' : 'bg-orange-200'
                    }`}
                    style={{
                      height: `${Math.max(4, (g.count / maxGrowth) * 120)}px`,
                    }}
                    title={`${g.count} altas`}
                  />
                  <span className="text-[11px] text-gray-400">{g.label}</span>
                </div>
              );
            })}
            {growth.length === 0 && (
              <p className="w-full py-4 text-center text-sm text-gray-400">
                Sin datos de crecimiento.
              </p>
            )}
          </div>
        </div>

        {/* Desgloses */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BreakdownBars
            title="Empresas por tipo de negocio"
            rows={data?.byType || []}
            labelKey="type"
          />
          <BreakdownBars
            title="Empresas por plan"
            rows={data?.byPlan || []}
            labelKey="plan"
          />
        </div>

        {/* Próximas a vencer */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">
            Próximas a vencer (7 días)
          </h2>
          {data?.expiringSoon?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr className="border-b border-gray-100">
                    <th className="py-2 pr-4">Empresa</th>
                    <th className="py-2 pr-4">Vence</th>
                    <th className="py-2 pr-4">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.expiringSoon.map((c) => (
                    <tr key={c.id} className="text-gray-700">
                      <td className="py-2 pr-4 font-medium">{c.name}</td>
                      <td className="py-2 pr-4 text-amber-600">
                        {formatDateOnly(c.paidUntil)}
                      </td>
                      <td className="py-2 pr-4">
                        <Link
                          href={`/platform/companies/edit/${c.id}`}
                          className="text-orange-600 hover:underline"
                        >
                          Gestionar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-gray-400">
              Ninguna empresa vence en los próximos 7 días.
            </p>
          )}
        </div>

        {/* Auditoría de accesos de soporte */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <EyeIcon className="h-4 w-4 text-gray-400" />
            Accesos de soporte recientes
          </h2>
          <p className="mb-4 text-xs text-gray-400">
            Cada vez que la plataforma entra como una empresa queda registrado
            aquí.
          </p>
          {audit.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr className="border-b border-gray-100">
                    <th className="py-2 pr-4">Fecha</th>
                    <th className="py-2 pr-4">Empresa</th>
                    <th className="py-2 pr-4">Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {audit.map((a) => (
                    <tr key={a.id} className="text-gray-700">
                      <td className="py-2 pr-4 whitespace-nowrap text-gray-500">
                        {new Date(a.createdAt).toLocaleString('es-CO')}
                      </td>
                      <td className="py-2 pr-4 font-medium">{a.companyName}</td>
                      <td className="py-2 pr-4 text-gray-500">
                        {a.actorEmail || `#${a.actorId}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-gray-400">
              Aún no hay accesos de soporte registrados.
            </p>
          )}
        </div>

        {/* Actividad reciente de todas las empresas */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-800">
            Actividad reciente
          </h2>
          <p className="mb-4 text-xs text-gray-400">
            Últimos movimientos (creado / editado / eliminado) en todas las
            empresas.
          </p>
          {activity.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr className="border-b border-gray-100">
                    <th className="py-2 pr-4">Fecha</th>
                    <th className="py-2 pr-4">Empresa</th>
                    <th className="py-2 pr-4">Acción</th>
                    <th className="py-2 pr-4">Qué</th>
                    <th className="py-2 pr-4">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activity.map((a) => (
                    <tr key={a.id} className="text-gray-700">
                      <td className="py-2 pr-4 whitespace-nowrap text-gray-500">
                        {new Date(a.createdAt).toLocaleString('es-CO')}
                      </td>
                      <td className="py-2 pr-4 font-medium">{a.companyName}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            ACTION_STYLE[a.action] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {ACTION_LABEL[a.action] || a.action}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-500">
                        {a.entity} #{a.entityId}
                      </td>
                      <td className="py-2 pr-4 text-gray-500">{a.userName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-gray-400">
              Sin actividad registrada todavía.
            </p>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}

const ACTION_LABEL = {
  CREATE: 'Creó',
  UPDATE: 'Editó',
  DELETE: 'Eliminó',
};
const ACTION_STYLE = {
  CREATE: 'bg-emerald-50 text-emerald-600',
  UPDATE: 'bg-blue-50 text-blue-600',
  DELETE: 'bg-red-50 text-red-600',
};
