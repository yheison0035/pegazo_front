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
    { name: 'sku', title: 'Código', show: true },
    { name: 'name', title: 'Nombre Producto', show: true },
    { name: 'color', title: 'Color', show: true },
    { name: 'provider', title: 'Proveedor', show: true },
    { name: 'quantity', title: 'Cantidad', show: true },
    { name: 'price', title: 'Precio', show: true },
    { name: 'point', title: 'Punto', show: true },
  ];

  return (
    <tr>
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
