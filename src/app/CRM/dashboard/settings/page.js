'use client';

import { useState } from 'react';
import RoleGuard from '@/auth/roleGuard';
import MessageEditorModal from '@/components/dashboard/modals/messageEditorModal';
import { Roles } from '@/config/roles';

export default function Settings() {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
            Configuraciones
          </h1>

          <div className="flex gap-2">
            <button
              onClick={() => setShowEditor(true)}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition cursor-pointer"
            >
              Contenedor Mensajes Bienvenida
            </button>
          </div>
        </div>
      </div>

      {showEditor && (
        <MessageEditorModal onClose={() => setShowEditor(false)} />
      )}
    </RoleGuard>
  );
}
