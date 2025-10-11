import { Roles } from '@/config/roles';
import usePermissions from '@/hooks/usePermissions';

export default function Thead({ rol, view }) {
  const { canViewAll } = usePermissions();

  return (
    <thead className="bg-gray-100 border-b border-gray-200">
      <tr>
        {view === 'advisors' && canViewAll && (
          <>
            <th className="px-4 py-3">Rol</th>
          </>
        )}
        {view === 'customers' && canViewAll && (
          <>
            <th className="px-4 py-3 text-center">Asignar</th>
            <th className="px-4 py-3">Asesor</th>
          </>
        )}
        {view === 'delivered' && rol !== Roles.ASESOR && (
          <>
            <th className="px-4 py-3">Asesor</th>
          </>
        )}
        <th className="px-4 py-3">Nombre</th>
        {view === 'delivered' && (
          <>
            <th className="px-4 py-3">Fecha Entrega</th>
            <th className="px-4 py-3">Placa</th>
          </>
        )}

        <th className="px-4 py-3">Correo</th>
        <th className="px-4 py-3">Teléfono</th>

        {view === 'customers' && <th className="px-4 py-3">Estado Actual</th>}

        <th className="px-4 py-3 text-center">Acciones</th>
      </tr>
    </thead>
  );
}
