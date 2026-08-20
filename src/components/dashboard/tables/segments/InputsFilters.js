import SearchFilter from './inputSearch/searchFilter';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function InputFilters({
  allFilters,
  filters,
  handleFilterChange,
}) {
  return (
    <tr className="crm-filters border-b border-gray-100 bg-gray-50">
      <th className="sticky left-0 z-[5] bg-gray-50 shadow-[inset_-10px_0_8px_-8px_rgba(0,0,0,0.05)]"></th>
      {allFilters
        .filter((f) => f.show)
        .map(({ name, title, showInput }) => (
          <th key={name} className="px-4 py-2.5">
            {showInput && (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <SearchFilter
                  name={name}
                  title={title}
                  value={filters[name] || ''}
                  showInput={showInput}
                  handleFilterChange={handleFilterChange}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm transition focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
                />
              </div>
            )}
          </th>
        ))}
    </tr>
  );
}
