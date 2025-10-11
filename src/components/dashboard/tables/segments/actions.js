import usePermissions from '@/hooks/usePermissions';
import {
  EyeIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Actions({
  isLocked,
  rol,
  info,
  view,
  setSelected,
  handleDelete,
  setShowModalChangeAdvisor,
}) {
  const { canAssign, canEdit, canDelete } = usePermissions();
  return (
    <div className="flex justify-center space-x-3">
      {canAssign && view === 'customers' && (
        <div className="relative group flex items-center">
          <button
            onClick={() => setShowModalChangeAdvisor(info)}
            disabled={isLocked}
            className={`${
              isLocked
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-500 hover:text-blue-700'
            } cursor-pointer`}
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
          <span className="absolute -top-15 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition bg-black text-white text-xs rounded px-2 py-1 cursor-pointer">
            Cambiar de Asesor
          </span>
        </div>
      )}

      <div className="relative group flex items-center">
        <button
          onClick={() => setSelected(info)}
          disabled={isLocked}
          className={`${
            isLocked
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-500 hover:text-blue-700'
          } cursor-pointer`}
        >
          <EyeIcon className="w-5 h-5" />
        </button>
        <span className="absolute -top-11 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition bg-black text-white text-xs rounded px-2 py-1">
          Ver detalles
        </span>
      </div>

      {canEdit && view !== 'delivered' && (
        <div className="relative group flex items-center">
          <Link
            href={isLocked ? '#' : `/CRM/dashboard/${view}/edit/${info.id}`}
            className={`${
              isLocked
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-green-500 hover:text-green-700'
            }`}
          >
            <PencilIcon className="w-5 h-5" />
          </Link>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition bg-black text-white text-xs rounded px-2 py-1">
            Editar
          </span>
        </div>
      )}

      {canDelete && (
        <div className="relative group flex items-center">
          <button
            onClick={() => handleDelete(info.id, info.name, view)}
            disabled={isLocked}
            className="text-red-500 hover:text-red-700 cursor-pointer"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition bg-black text-white text-xs rounded px-2 py-1">
            Eliminar
          </span>
        </div>
      )}
    </div>
  );
}
