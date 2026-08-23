'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftOnRectangleIcon,
  LockClosedIcon,
  RocketLaunchIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import useNavigation from '@/hooks/useNavigation';
import { openPlanUpgrade } from '@/lib/planUpgrade';
import { PLAN_ORDER } from '@/lib/plans';

// Clases de la etiqueta de texto: se colapsa (ancho 0 + transparente) cuando el
// menú está plegado y aparece al expandirlo. Así la transición es suave.
const labelCls = (expanded) =>
  `whitespace-nowrap overflow-hidden transition-all duration-200 ${
    expanded ? 'opacity-100 max-w-[12rem] ml-0' : 'opacity-0 max-w-0'
  }`;

export default function NavLinks({ expanded = true }) {
  const { usuario, loading, logout } = useAuth();
  const pathname = usePathname();

  // El acceso al plan es del DUEÑO del negocio (SUPER_ADMIN): solo él gestiona
  // la suscripción. Los demás roles (recepción, cajero, barbero, admin
  // secundario) no lo ven. Si ya está en el plan más alto, en vez de "Mejorar"
  // se ofrece "Cambiar mi plan".
  const plan = usuario?.company?.plan;
  const topPlan = PLAN_ORDER[PLAN_ORDER.length - 1];
  const showPlanLink = usuario?.role === 'SUPER_ADMIN';
  const canUpgrade = plan !== topPlan;
  const sections = useNavigation();

  if (loading || !usuario) return null;

  // En modo plegado el icono se centra; expandido se alinea a la izquierda.
  const rowBase = `group/link relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
    expanded ? '' : 'md:justify-center'
  }`;

  return (
    <div className="flex flex-col w-full h-full">
      <nav className="flex flex-col">
        {sections.length === 0 && (
          <p className="text-white/40 text-sm px-4">Sin módulos disponibles</p>
        )}

        {sections.map((section) => (
          <div key={section.section} className="mb-3">
            <p
              className={`text-[11px] uppercase text-white/30 px-3 tracking-wider overflow-hidden transition-all duration-200 ${
                expanded ? 'opacity-100 h-4 mb-2' : 'opacity-0 h-0 mb-0'
              }`}
            >
              {section.section}
            </p>

            <div className="flex flex-col space-y-1">
              {section.items.map((link) => {
                const LinkIcon = link.icon;
                // El Inicio (/dashboard) solo se marca activo en su ruta exacta;
                // los demás módulos aceptan subrutas (ej. /inventory/new).
                const isActive =
                  link.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(link.href);

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
                      title={link.name}
                      className={`${rowBase} text-white/35 hover:text-white/70 hover:bg-white/5`}
                    >
                      <LinkIcon className="w-5 h-5 flex-none text-white/25" />
                      <span className={`flex-1 text-left ${labelCls(expanded)}`}>
                        {link.name}
                      </span>
                      {expanded && (
                        <LockClosedIcon className="w-4 h-4 flex-none text-amber-400/70" />
                      )}
                    </button>
                  );
                }

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    title={link.name}
                    className={`${rowBase} ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500/25 to-amber-500/10 text-white shadow-inner'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-orange-400 rounded-r-full" />
                    )}

                    <LinkIcon
                      className={`w-5 h-5 flex-none transition ${
                        isActive
                          ? 'text-orange-400'
                          : 'text-white/50 group-hover/link:text-white'
                      }`}
                    />

                    <span className={labelCls(expanded)}>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {showPlanLink && (
        <div className="mt-4 border-t border-orange-500/10 pt-3 px-1">
          <Link
            href="/dashboard/upgrade"
            title={canUpgrade ? 'Mejorar mi plan' : 'Cambiar mi plan'}
            className={`relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-amber-300 transition hover:bg-amber-500/10 ${
              expanded ? '' : 'md:justify-center'
            }`}
          >
            {canUpgrade ? (
              <RocketLaunchIcon className="w-5 h-5 flex-none" />
            ) : (
              <ArrowsRightLeftIcon className="w-5 h-5 flex-none" />
            )}
            <span className={labelCls(expanded)}>
              {canUpgrade ? 'Mejorar mi plan' : 'Cambiar mi plan'}
            </span>
          </Link>
        </div>
      )}

      <div className="pb-9 pt-2 px-1">
        <button
          onClick={logout}
          title="Cerrar Sesión"
          className={`flex items-center w-full gap-3 rounded-xl px-3 py-3 transition text-white/60 hover:text-white hover:bg-red-500/10 cursor-pointer ${
            expanded ? '' : 'md:justify-center'
          }`}
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-none" />
          <span className={labelCls(expanded)}>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
