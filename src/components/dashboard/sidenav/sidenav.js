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
        className="md:hidden p-2 m-2 text-white bg-gray-900 rounded cursor-pointer"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-gray-900 text-white flex flex-col items-center py-8 space-y-3 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:flex`}
      >
        <div className="w-full flex justify-end px-4 md:hidden">
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-red-400 cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <Avatar perfil={usuario} setPerfil={() => {}} />
        <Link
          href="/CRM/dashboard/profile/edit"
          className="text-sm text-white font-semibold underline hover:underline"
        >
          Editar perfil
        </Link>
        <h6 className="text-sm text-orange-400 font-semibold text-center">
          {usuario?.role} - {usuario?.name}
        </h6>
        <div className="w-full border-t border-gray-700 my-4"></div>
        <NavLinks />
      </aside>
    </>
  );
}
