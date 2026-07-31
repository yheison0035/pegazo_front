'use client';

import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';

export default function Settings() {
  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
            Configuraciones
          </h1>
        </div>
      </div>
    </RoleGuard>
  );
}
