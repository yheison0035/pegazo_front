import { Roles } from '@/config/roles';
import usePermissions from '@/hooks/usePermissions';

export default function Thead({ rol, view }) {
  return (
    <thead className="bg-gray-100 border-b border-gray-200">
      <tr>
        <th className="px-4 py-3">Código</th>
        <th className="px-4 py-3">Nombre Producto</th>
        <th className="px-4 py-3">Color</th>
        <th className="px-4 py-3">Proveedor</th>
        <th className="px-4 py-3">Cantidad</th>
        <th className="px-4 py-3">Precio</th>
        <th className="px-4 py-3">Punto</th>
        <th className="px-4 py-3 text-center">Acciones</th>
      </tr>
    </thead>
  );
}
