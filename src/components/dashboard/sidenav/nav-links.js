'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftOnRectangleIcon,
  LockClosedIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import useNavigation from '@/hooks/useNavigation';
import { openPlanUpgrade } from '@/lib/planUpgrade';

export default function NavLinks() {
  const { usuario, loading, logout } = useAuth();
  const pathname = usePathname();
  const sections = useNavigation();

  if (loading || !usuario) return null;

  return (
    <div className="flex flex-col w-full h-full">
      <nav className="flex flex-col">
        {sections.length === 0 && (
          <p className="text-white/40 text-sm px-4">Sin módulos disponibles</p>
        )}

        {sections.map((section) => (
          <div key={section.section} className="mb-4">
            <p className="text-[11px] uppercase text-white/30 px-4 mb-2 tracking-wider">
              {section.section}
            </p>

            <div className="flex flex-col space-y-1">
              {section.items.map((link) => {
                const LinkIcon = link.icon;
                const isActive = pathname.startsWith(link.href);

                // Módulo bloqueado por plan: no navega, ofrece mejorar el plan.
                if (link.locked) {
                  return (
                    <button
                      key={link.name}
                      onClick={() =>
                        openPlanUpgrade({
                          requiredPlan: link.requiredPlan,
                          featureName: link.name,
                          reason: 'feature',
                        })
                      }
                      title={`Disponible desde el plan ${link.requiredPlan}`}
                      className="group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/35 hover:text-white/70 hover:bg-white/5 transition-all"
                    >
                      <LinkIcon className="w-5 h-5 text-white/25" />
                      <span className="flex-1 text-left">{link.name}</span>
                      <LockClosedIcon className="w-4 h-4 text-amber-400/70" />
                    </button>
                  );
                }

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`
                      group relative flex items-center gap-3 px-4 py-3 rounded-xl
                      text-sm font-medium transition-all duration-200
                      ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-500/25 to-amber-500/10 text-white shadow-inner'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-orange-400 rounded-r-full" />
                    )}

                    <LinkIcon
                      className={`w-5 h-5 transition ${
                        isActive
                          ? 'text-orange-400'
                          : 'text-white/50 group-hover:text-white'
                      }`}
                    />

                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 border-t border-orange-500/10 pt-4 px-2">
        <Link
          href="/dashboard/upgrade"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-amber-300 transition hover:bg-amber-500/10"
        >
          <RocketLaunchIcon className="w-5 h-5" />
          <span>Mejorar mi plan</span>
        </Link>
      </div>

      <div className="pb-9 pt-2 px-2">
        <button
          onClick={logout}
          className="flex items-center w-full gap-3 px-4 py-3 rounded-xl transition
          text-white/60 hover:text-white hover:bg-red-500/10 cursor-pointer"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          <p>Cerrar Sesión</p>
        </button>
      </div>
    </div>
  );
}
