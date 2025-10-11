'use client';

import { useAuth } from '@/context/authContext';
import {
  UserGroupIcon,
  UsersIcon,
  ArrowLeftOnRectangleIcon,
  ClipboardDocumentCheckIcon,
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
      name: 'Clientes',
      href: '/CRM/dashboard/customers',
      icon: UsersIcon,
      roles: ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR', 'ASESOR'],
    },
    {
      name: 'Asesores',
      href: '/CRM/dashboard/advisors',
      icon: UserGroupIcon,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      name: 'Entregados',
      href: '/CRM/dashboard/delivered',
      icon: ClipboardDocumentCheckIcon,
      roles: ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR', 'ASESOR'],
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
              <LinkIcon className="w-6 h-6" />
              <p>{link.name}</p>
            </Link>
          );
        })}

      <button
        onClick={logout}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg transition text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
      >
        <ArrowLeftOnRectangleIcon className="w-6 h-6" />
        <p>Cerrar Sesión</p>
      </button>
    </nav>
  );
}
