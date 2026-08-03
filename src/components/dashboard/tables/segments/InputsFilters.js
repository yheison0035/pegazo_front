import SearchFilter from './inputSearch/searchFilter';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function InputFilters({
  allFilters,
  filters,
  handleFilterChange,
}) {
  return (
    <tr className="crm-filters bg-white">
      <th className="sticky left-0 z-[5] bg-white shadow-[inset_-10px_0_8px_-8px_rgba(0,0,0,0.06)]"></th>
      {allFilters
        .filter((f) => f.show)
        .map(({ name, title, showInput }) => (
          <th key={name} className="px-4 py-2">
            {showInput && (
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <SearchFilter
                  name={name}
                  title={title}
                  value={filters[name] || ''}
                  showInput={showInput}
                  handleFilterChange={handleFilterChange}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black/5 focus:outline-none transition"
                />
              </div>
            )}
          </th>
        ))}
      <th />
    </tr>
  );
}
