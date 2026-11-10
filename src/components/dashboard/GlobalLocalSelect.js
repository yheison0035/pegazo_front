'use client';

import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { useLocalScope } from '@/context/localScopeContext';

// Selector GLOBAL de sede (parte superior del panel). Solo aparece para quien
// ve más de una sede (el dueño). Al elegir una, todos los módulos muestran solo
// esa sede; "Todas las sedes" muestra el consolidado.
export default function GlobalLocalSelect() {
  const { activeLocal, setActiveLocal, locals, multi } = useLocalScope();
  if (!multi) return null;

  return (
    <div className="mb-5 flex items-center gap-2">
      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
        <BuildingStorefrontIcon className="h-5 w-5 text-orange-500" />
        Sede:
      </span>
      <select
        value={activeLocal}
        onChange={(e) => setActiveLocal(e.target.value)}
        aria-label="Sede activa"
        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        <option value="">Todas las sedes</option>
        {locals.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    </div>
  );
}
