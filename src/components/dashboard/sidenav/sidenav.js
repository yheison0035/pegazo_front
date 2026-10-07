'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
  MoonIcon,
  SunIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import NavLinks from './nav-links';
import { useAuth } from '@/context/authContext';
import Avatar from '../profile/avatar';
import NotificationBell from './NotificationBell';
import { isDark, toggleDark, DARK_EVENT } from '@/lib/darkMode';

export default function SideNavigation() {
  const [isOpen, setIsOpen] = useState(false); // drawer en móvil
  const [hovered, setHovered] = useState(false); // hover/enfoque en escritorio
  const [dark, setDark] = useState(false);
  const auth = useAuth();
  const usuario = auth?.usuario;
  const logout = auth?.logout;
  const pathname = usePathname();
  // ¿Estamos en "Editar mi perfil"? (para marcarlo como activo).
  const onProfile =
    !!usuario?.id && pathname === `/dashboard/users/edit/${usuario.id}`;

  useEffect(() => {
    const sync = () => setDark(isDark());
    sync();
    window.addEventListener(DARK_EVENT, sync);
    return () => window.removeEventListener(DARK_EVENT, sync);
  }, []);

  // En escritorio el menú vive colapsado (solo iconos) y se despliega al pasar
  // el mouse o al enfocar con teclado. En móvil se ve completo con el drawer.
  const expanded = isOpen || hovered;

  const isPlatform = usuario?.role === 'SUPER_PLATFORM_ADMIN';

  return (
    <>
      {/* Botón hamburguesa (solo móvil) */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú"
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[var(--color-white)] backdrop-blur border border-[var(--color-gray-200)] shadow-lg"
      >
        <Bars3Icon className="w-6 h-6 text-[color:var(--color-orange-500)]" />
      </button>

      {/* Fondo oscuro del drawer (solo móvil): siempre montado para poder
          hacer FADE suave al abrir/cerrar (antes aparecía/desaparecía de golpe). */}
      <div
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setHovered(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false);
        }}
        className={`
          pos-sidenav
          fixed top-0 left-0 z-50 h-full
          w-72 ${expanded ? 'md:w-72' : 'md:w-20'}
          overflow-hidden
          bg-gradient-to-b from-[var(--sb-bg)] to-[var(--sb-bg-2)]
          text-[color:var(--sb-fg)] flex flex-col
          border-r border-[var(--sb-border)]
          shadow-xl
          transition-[width,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          [will-change:width,transform]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Cabecera: logo + nombre de la empresa */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--sb-border)] min-h-[72px]">
          <img
            src={
              isPlatform
                ? '/images/logo_pegazo_icon.png'
                : usuario?.company?.logo || '/images/no-image.png'
            }
            alt={isPlatform ? 'Pegazo' : 'Company'}
            className="w-12 h-12 rounded-xl object-contain border border-[var(--sb-border)] bg-[var(--sb-bg)] shadow-sm flex-none"
          />

          <div
            className={`flex flex-col leading-tight min-w-0 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              expanded ? 'opacity-100 max-w-[12rem]' : 'opacity-0 max-w-0'
            }`}
          >
            <span className="text-sm font-semibold tracking-wide truncate">
              {isPlatform ? 'Pegazo' : usuario?.company?.name || 'Pegazo'}
            </span>
            <span className="text-[11px] text-[color:var(--sb-fg-faint)]">
              {isPlatform ? 'Plataforma' : 'Workspace'}
            </span>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú"
            className="md:hidden ml-auto text-[color:var(--sb-fg-muted)] hover:text-[color:var(--sb-fg)] transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Perfil del usuario: solo visible con el menú desplegado. Colapsado
            se muestra únicamente el logo para mantener el rail limpio. */}
        <div
          className={`items-center gap-3 px-4 py-3 border-b border-[var(--sb-border)] transition ${
            expanded ? 'flex' : 'hidden'
          } ${onProfile ? 'bg-[var(--sb-hover)]' : ''}`}
        >
          <div className="flex-none">
            <Avatar perfil={usuario} setPerfil={() => {}} size="w-11 h-11" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate text-[color:var(--sb-fg)]">
              {usuario?.name}
            </span>
            <Link
              href={'/dashboard/users/edit/' + usuario?.id}
              aria-current={onProfile ? 'page' : undefined}
              className={`whitespace-nowrap text-xs transition text-[color:var(--sb-active-fg)] ${
                onProfile ? 'font-semibold' : 'opacity-90 hover:opacity-100'
              }`}
            >
              {onProfile ? '● Editando tu perfil' : 'Editar perfil'}
            </Link>
          </div>
        </div>

        {/* Navegación */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 custom-scroll">
          <NavLinks expanded={expanded} />
        </div>

        {/* Barra FIJA del pie: Alertas · Tema · Salir. Siempre visible (no entra
            en el scroll) y compacta, para no quitarle espacio al menú. */}
        <div className="flex-none border-t border-[var(--sb-border)] px-2 py-2">
          <div
            className={
              expanded
                ? 'grid grid-cols-3 gap-1'
                : 'flex flex-col items-center gap-1'
            }
          >
            <NotificationBell iconOnly expanded={expanded} />

            <button
              type="button"
              onClick={() => toggleDark()}
              title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label={dark ? 'Modo claro' : 'Modo oscuro'}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[color:var(--sb-fg-muted)] transition hover:bg-[var(--sb-hover)] hover:text-[color:var(--sb-fg)]"
            >
              {dark ? (
                <SunIcon className="h-6 w-6 flex-none text-[color:var(--color-amber-500)]" />
              ) : (
                <MoonIcon className="h-6 w-6 flex-none text-[color:var(--color-orange-500)]" />
              )}
              {expanded && (
                <span className="text-[10px] font-medium leading-none">
                  {dark ? 'Claro' : 'Oscuro'}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => logout?.()}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[color:var(--sb-fg-muted)] transition hover:bg-red-500/10 hover:text-[color:var(--color-red-600)]"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6 flex-none" />
              {expanded && (
                <span className="text-[10px] font-medium leading-none">
                  Salir
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
