'use client';

import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ViewModal from '../../viewModal';
import Table from '@/components/dashboard/tables/table';
import Link from 'next/link';
import RoleGuard from '@/components/auth/roleGuard';
import { advisors } from '@/api/advisors';
import { useAuth } from '@/context/authContext';
import MessageEditorModal from '@/components/dashboard/modals/messageEditorModal';
import { dataMotivation } from '@/api/messageMotivation';

export default function Advisors() {
  const [selectedAdvisors, setSelectedAdvisors] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState(dataMotivation);
  const { usuario } = useAuth();

  return (
    <RoleGuard allowedRoles={['Administrador']}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
            Listado de Asesores
          </h1>

          <div className="flex gap-2">
            <Link
              href="/CRM/dashboard/advisors/new"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              <PlusIcon className="w-4 h-4" />
              Agregar asesor
            </Link>

            <button
              onClick={() => setShowEditor(true)}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              Contenedor mensaje
            </button>
          </div>
        </div>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <Table
            info={advisors}
            view="advisors"
            setSelected={setSelectedAdvisors}
            rol={usuario?.rol}
          />
          {selectedAdvisors && (
            <ViewModal
              data={selectedAdvisors}
              type="advisor"
              onClose={() => setSelectedAdvisors(null)}
            />
          )}
        </div>
      </div>

      {showEditor && (
        <MessageEditorModal
          initialMessage={motivationMessage}
          onSave={setMotivationMessage}
          onClose={() => setShowEditor(false)}
        />
      )}
    </RoleGuard>
  );
}
