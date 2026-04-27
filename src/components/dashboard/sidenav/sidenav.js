'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import NavLinks from './nav-links';
import { useAuth } from '@/context/authContext';
import Avatar from '../profile/avatar';

export default function SideNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const auth = useAuth();
  const usuario = auth?.usuario;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 b-4 rounded-xl bg-[#0B0F19]/90 backdrop-blur border border-cyan-500/20 shadow-lg"
      >
        <Bars3Icon className="w-6 h-6 text-cyan-400" />
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 
          bg-gradient-to-b from-[#0B0F19] to-[#05070d]
          text-white flex flex-col
          border-r border-cyan-500/10
          shadow-2xl
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static
        `}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-cyan-500/10">
          <div className="flex items-center gap-3">
            <img
              src={usuario?.company?.logo || '/images/logo_europeatvstore.png'}
              alt="Company"
              className="w-12 h-12 rounded-xl object-cover border border-cyan-400/20 shadow"
            />

            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-wide">
                {usuario?.company?.name || 'Zorvex'}
              </span>
              <span className="text-[11px] text-cyan-400/60">Workspace</span>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-white/60 hover:text-white transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-5 border-b border-cyan-500/10">
          <div className="flex items-center gap-3">
            <Avatar perfil={usuario} setPerfil={() => {}} />

            <div className="flex flex-col">
              <span className="text-sm font-medium">{usuario?.name}</span>
              <Link
                href={'/CRM/dashboard/users/edit/' + usuario?.id}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Editar perfil
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 custom-scroll">
          <NavLinks />
        </div>
      </aside>
    </>
  );
}
