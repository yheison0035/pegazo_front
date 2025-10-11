'use client';

import { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ViewModal from '../../viewModal';
import Table from '@/components/dashboard/tables/table';
import Link from 'next/link';
import RoleGuard from '@/auth/roleGuard';
import { useAuth } from '@/context/authContext';
import MessageEditorModal from '@/components/dashboard/modals/messageEditorModal';
import { getUsers } from '@/lib/api/users';
import { Roles } from '@/config/roles';

export default function Advisors() {
  const [advisors, setAdvisors] = useState([]);
  const [selectedAdvisors, setSelectedAdvisors] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const { usuario } = useAuth();

  const fetchAdvisors = async () => {
    try {
      const { data } = await getUsers();
      setAdvisors(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdvisors();
  }, []);

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
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
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition cursor-pointer"
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
            rol={usuario?.role}
            fetchData={fetchAdvisors}
            loading={false}
            error={null}
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
        <MessageEditorModal onClose={() => setShowEditor(false)} />
      )}
    </RoleGuard>
  );
}
