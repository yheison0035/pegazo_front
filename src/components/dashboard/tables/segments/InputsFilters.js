import usePermissions from '@/hooks/usePermissions';
import SearchFilter from './inputSearch/searchFilter';
import { Roles } from '@/config/roles';

export default function InputFilters({
  rol,
  view,
  filters,
  handleFilterChange,
}) {
  const { canViewAll } = usePermissions();

  const allFilters = [
    {
      name: 'advisor',
      title: 'Asesor',
      show:
        (canViewAll && view === 'customers') ||
        (view === 'delivered' && rol !== Roles.ASESOR),
    },
    { name: 'role', title: 'Rol', show: view === 'advisors' },
    { name: 'name', title: 'Nombre', show: true },
    {
      name: 'deliveryDate',
      title: 'Fecha de Entrega',
      show: view === 'delivered',
    },
    { name: 'plateNumber', title: 'Placa', show: view === 'delivered' },
    { name: 'email', title: 'Correo', show: true },
    { name: 'phone', title: 'Teléfono', show: true },
    { name: 'state', title: 'Estado', show: view === 'customers' },
  ];

  return (
    <tr>
      {canViewAll && view === 'customers' && <th></th>}

      {allFilters
        .filter((f) => f.show)
        .map(({ name, title }) => (
          <th key={name} className="px-4 py-2">
            <SearchFilter
              name={name}
              title={title}
              value={filters[name] || ''}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              handleFilterChange={handleFilterChange}
            />
          </th>
        ))}

      <th className="px-4 py-2"></th>
    </tr>
  );
}
