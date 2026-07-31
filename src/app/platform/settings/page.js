'use client';

import Link from 'next/link';
import {
  BuildingOffice2Icon,
  UsersIcon,
  ChartBarIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

import RoleGuard from '@/auth/roleGuard';

export default function PlatformSettings() {
  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <div className="w-full p-4">
        <h1 className="mb-1 text-2xl font-semibold">Configuración</h1>
        <p className="mb-6 text-sm text-gray-500">
          Panel de administración de la plataforma.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/platform/companies"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-orange-300"
          >
            <BuildingOffice2Icon className="mb-2 h-6 w-6 text-orange-600" />
            <p className="font-semibold text-gray-800">Empresas</p>
            <p className="text-sm text-gray-500">
              Crear, suspender y gestionar los negocios y sus locales.
            </p>
          </Link>

          <Link
            href="/platform/users"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-orange-300"
          >
            <UsersIcon className="mb-2 h-6 w-6 text-orange-600" />
            <p className="font-semibold text-gray-800">Usuarios Globales</p>
            <p className="text-sm text-gray-500">
              Ver todos los usuarios de todas las empresas.
            </p>
          </Link>

          <Link
            href="/platform/statistics"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-orange-300"
          >
            <ChartBarIcon className="mb-2 h-6 w-6 text-teal-600" />
            <p className="font-semibold text-gray-800">Estadísticas Globales</p>
            <p className="text-sm text-gray-500">
              Resumen general de toda la plataforma.
            </p>
          </Link>
        </div>

        {/* Roadmap: suscripción / auto-registro */}
        <div className="mt-6 rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-5">
          <div className="flex items-start gap-3">
            <CreditCardIcon className="mt-0.5 h-6 w-6 flex-none text-amber-600" />
            <div>
              <p className="font-semibold text-gray-800">
                Suscripción y auto-registro (próximamente)
              </p>
              <p className="mt-1 text-sm text-gray-600">
                La base ya está lista: cada empresa tiene un plan y una fecha de
                pago (<span className="font-medium">vencimiento</span>), y el
                sistema la suspende automáticamente al vencer. El siguiente paso
                será que el cliente se registre y pague por sí mismo, y que un
                webhook de la pasarela extienda la fecha de pago y cree la
                empresa automáticamente, sin gestión manual.
              </p>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
