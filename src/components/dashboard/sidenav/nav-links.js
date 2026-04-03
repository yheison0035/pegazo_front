'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import useNavigation from '@/hooks/useNavigation';

export default function NavLinks() {
  const { usuario, loading, logout } = useAuth();
  const pathname = usePathname();
  const links = useNavigation();

  if (loading || !usuario) return null;

  return (
    <div className="flex flex-col w-full h-[calc(100vh-80px)] overflow-y-auto px-6 pb-6 custom-scroll">
      <nav className="flex flex-col space-y-2">
        {links.length === 0 && (
          <p className="text-white/50 text-sm px-3">Sin módulos disponibles</p>
        )}

        {links.map((link) => {
          const LinkIcon = link.icon;
          const isActive = pathname.startsWith(link.href);

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-white/5 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-0 h-full w-[3px] bg-cyan-400 rounded-r-full" />
              )}

              <LinkIcon className="w-5 h-5 shrink-0" />

              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-gray-700 pt-4">
        <button
          onClick={logout}
          className="flex items-center w-full space-x-3 px-3 py-2 rounded-lg transition text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 min-w-[20px]" />
          <p>Cerrar Sesión</p>
        </button>
      </div>
    </div>
  );
}
