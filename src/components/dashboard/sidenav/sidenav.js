'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bars3Icon,
  XMarkIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import NavLinks from './nav-links';
import { useAuth } from '@/context/authContext';
import Avatar from '../profile/avatar';
import { isDark, toggleDark, DARK_EVENT } from '@/lib/darkMode';

export default function SideNavigation() {
  const [isOpen, setIsOpen] = useState(false); // drawer en móvil
  const [hovered, setHovered] = useState(false); // hover/enfoque en escritorio
  const [dark, setDark] = useState(false);
  const auth = useAuth();
  const usuario = auth?.usuario;

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
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#0B0F19]/90 backdrop-blur border border-orange-500/20 shadow-lg"
      >
        <Bars3Icon className="w-6 h-6 text-orange-400" />
      </button>

      {/* Fondo oscuro del drawer (solo móvil) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

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
          bg-gradient-to-b from-[#0B0F19] to-[#05070d]
          text-white flex flex-col
          border-r border-orange-500/10
          shadow-2xl
          transition-[width,transform] duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Cabecera: logo + nombre de la empresa */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-orange-500/10 min-h-[72px]">
          <img
            src={
              isPlatform
                ? '/images/logo_pegazo_icon.png'
                : usuario?.company?.logo || '/images/no-image.png'
            }
            alt={isPlatform ? 'Pegazo' : 'Company'}
            className="w-12 h-12 rounded-xl object-contain border border-orange-400/20 shadow flex-none"
          />

          <div
            className={`flex flex-col leading-tight min-w-0 transition-all duration-200 ${
              expanded ? 'opacity-100 max-w-[12rem]' : 'opacity-0 max-w-0'
            }`}
          >
            <span className="text-sm font-semibold tracking-wide truncate">
              {isPlatform ? 'Pegazo' : usuario?.company?.name || 'Pegazo'}
            </span>
            <span className="text-[11px] text-orange-400/60">
              {isPlatform ? 'Plataforma' : 'Workspace'}
            </span>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden ml-auto text-white/60 hover:text-white transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Perfil del usuario: solo visible con el menú desplegado. Colapsado
            se muestra únicamente el logo para mantener el rail limpio. */}
        <div
          className={`items-center gap-3 px-4 py-3 border-b border-orange-500/10 ${
            expanded ? 'flex' : 'hidden'
          }`}
        >
          <div className="flex-none">
            <Avatar perfil={usuario} setPerfil={() => {}} size="w-11 h-11" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{usuario?.name}</span>
            <Link
              href={'/dashboard/users/edit/' + usuario?.id}
              className="text-xs text-orange-400 hover:text-orange-300 whitespace-nowrap"
            >
              Editar perfil
            </Link>
          </div>
        </div>

        {/* Navegación */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 custom-scroll">
          <NavLinks expanded={expanded} />
        </div>

        {/* Modo oscuro (preferencia personal) */}
        <div className="border-t border-white/10 px-2 py-3">
          <button
            onClick={() => toggleDark()}
            title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-gray-300 transition hover:bg-white/10"
          >
            {dark ? (
              <SunIcon className="h-6 w-6 flex-none text-amber-300" />
            ) : (
              <MoonIcon className="h-6 w-6 flex-none text-orange-300" />
            )}
            {expanded && (
              <span className="whitespace-nowrap text-sm font-medium">
                {dark ? 'Modo claro' : 'Modo oscuro'}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
