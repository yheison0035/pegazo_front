'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import NavLinks from './nav-links';
import { useAuth } from '@/context/authContext';
import Avatar from '../profile/avatar';

export default function SideNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { usuario } = useAuth();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-black/80 backdrop-blur border border-white/10"
      >
        <Bars3Icon className="w-6 h-6 text-white" />
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 
          bg-[#0B0F19] text-white flex flex-col
          border-r border-white/5
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static
        `}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <img
                src={
                  usuario?.company?.logo || '/images/logo_europeatvstore.png'
                }
                alt="Company"
                className="w-19 h-19 rounded-lg p-1 object-cover"
              />

              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold">
                  {usuario?.company?.name || 'Europeatvstore'}
                </span>
                <span className="text-[11px] text-white/50">Workspace</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-white/70 hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Avatar perfil={usuario} setPerfil={() => {}} />

            <div className="flex flex-col">
              <span className="text-sm font-medium">{usuario?.name}</span>
              <Link
                href={'/CRM/dashboard/users/edit/' + usuario?.id}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Editar perfil
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4">
          <NavLinks />
        </div>
      </aside>
    </>
  );
}
