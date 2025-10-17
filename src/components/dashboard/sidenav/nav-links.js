'use client';

import { useAuth } from '@/context/authContext';
import {
  ArchiveBoxIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLinks() {
  const { usuario, loading, logout } = useAuth();
  const pathname = usePathname();

  if (loading) return null;
  if (!usuario) return null;

  const links = [
    {
      name: 'Estadísticas',
      href: '/CRM/dashboard/statistics',
      icon: AdjustmentsHorizontalIcon,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      name: 'Locales',
      href: '/CRM/dashboard/locals',
      icon: BuildingOfficeIcon,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      name: 'Inventario',
      href: '/CRM/dashboard/inventory',
      icon: ArchiveBoxIcon,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      name: 'Proveedores',
      href: '/CRM/dashboard/providers',
      icon: BuildingStorefrontIcon,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      name: 'Realizar Venta',
      href: '/CRM/dashboard/sales',
      icon: BanknotesIcon,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR'],
    },
    {
      name: 'Ventas Realizadas',
      href: '/CRM/dashboard/delivered_sales',
      icon: ClipboardDocumentCheckIcon,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR'],
    },
    {
      name: 'Gastos',
      href: '/CRM/dashboard/expenses',
      icon: ChartBarIcon,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR'],
    },
    {
      name: 'Usuarios / Roles',
      href: '/CRM/dashboard/users',
      icon: Cog6ToothIcon,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      name: 'Configuraciones',
      href: '/CRM/dashboard/settings',
      icon: AdjustmentsHorizontalIcon,
      roles: ['SUPER_ADMIN'],
    },
  ];

  return (
    <nav className="flex flex-col w-full px-6 space-y-4">
      {links
        .filter((link) => link.roles.includes(usuario.role))
        .map((link) => {
          const LinkIcon = link.icon;
          const isActive = pathname.startsWith(link.href);

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-sky-100 text-gray-800'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <LinkIcon className="w-5 h-5 min-w-[20px]" />
              <p>{link.name}</p>
            </Link>
          );
        })}

      <button
        onClick={logout}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg transition text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
      >
        <ArrowLeftOnRectangleIcon className="w-5 h-5 min-w-[20px]" />
        <p>Cerrar Sesión</p>
      </button>
    </nav>
  );
}
