'use client';

import Link from 'next/link';
import {
  BuildingOffice2Icon,
  UsersIcon,
  ChartBarIcon,
  TicketIcon,
  MegaphoneIcon,
  CheckCircleIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/outline';

import RoleGuard from '@/auth/roleGuard';

const CARDS = [
  {
    href: '/platform/companies',
    icon: BuildingOffice2Icon,
    title: 'Empresas',
    desc: 'Crear, ver el panel 360°, renovar, suspender e impersonar negocios.',
    accent: 'text-orange-600',
  },
  {
    href: '/platform/users',
    icon: UsersIcon,
    title: 'Usuarios Globales',
    desc: 'Ver todos los usuarios, resetear contraseñas y activar/desactivar.',
    accent: 'text-orange-600',
  },
  {
    href: '/platform/plans',
    icon: Square3Stack3DIcon,
    title: 'Planes y funciones',
    desc: 'Precios, límites y qué módulo desbloquea cada plan. Configurable.',
    accent: 'text-indigo-600',
  },
  {
    href: '/platform/coupons',
    icon: TicketIcon,
    title: 'Cupones',
    desc: 'Códigos de descuento para el registro de nuevos negocios.',
    accent: 'text-pink-600',
  },
  {
    href: '/platform/announcements',
    icon: MegaphoneIcon,
    title: 'Comunicados',
    desc: 'Mensajes a los negocios, segmentados por tipo o plan.',
    accent: 'text-amber-600',
  },
  {
    href: '/platform/statistics',
    icon: ChartBarIcon,
    title: 'Estadísticas Globales',
    desc: 'MRR, crecimiento, desgloses, accesos de soporte y actividad.',
    accent: 'text-teal-600',
  },
];

export default function PlatformSettings() {
  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <div className="w-full p-4">
        <h1 className="mb-1 text-2xl font-semibold">Configuración</h1>
        <p className="mb-6 text-sm text-gray-500">
          Panel de administración de la plataforma.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-orange-300"
            >
              <c.icon className={`mb-2 h-6 w-6 ${c.accent}`} />
              <p className="font-semibold text-gray-800">{c.title}</p>
              <p className="text-sm text-gray-500">{c.desc}</p>
            </Link>
          ))}
        </div>

        {/* Estado de suscripción / pagos */}
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="mt-0.5 h-6 w-6 flex-none text-emerald-600" />
            <div>
              <p className="font-semibold text-gray-800">
                Suscripción y auto-registro activos
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Los negocios pueden auto-registrarse y pagar su plan en línea
                (Wompi). Al aprobarse el pago, el plan y la fecha de vencimiento
                se actualizan solos, y las empresas vencidas se suspenden
                automáticamente. Las llaves de Wompi de la plataforma se
                configuran en las variables de entorno del servidor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
