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
} from '@heroicons/react/24/outline';

import RoleGuard from '@/auth/roleGuard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { getPlatformOverview } from '@/lib/api/routes/companies';
import { formatDateOnly } from '@/lib/api/utils/utils';

function Card({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`rounded-xl p-2 ${accent}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function PlatformStatistics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPlatformOverview();
      setData(res?.data || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const t = data?.totals;

  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <div className="relative w-full p-4">
        <LoadingOverlay show={loading} text="Cargando resumen..." />

        <h1 className="mb-1 text-2xl font-semibold">Estadísticas Globales</h1>
        <p className="mb-6 text-sm text-gray-500">
          Visión general de toda la plataforma.
        </p>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Card
            icon={BuildingOffice2Icon}
            label="Empresas"
            value={t?.companies ?? '—'}
            accent="bg-blue-50 text-blue-600"
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
            accent="bg-indigo-50 text-indigo-600"
          />
          <Card
            icon={BuildingStorefrontIcon}
            label="Locales"
            value={t?.locals ?? '—'}
            accent="bg-teal-50 text-teal-600"
          />
        </div>

        {/* Próximas a vencer */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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
                          className="text-blue-600 hover:underline"
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
      </div>
    </RoleGuard>
  );
}
