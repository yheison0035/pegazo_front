import { useAuth } from '@/context/authContext';
import usePermissions from '@/hooks/usePermissions';
import {
  EyeIcon,
  TrashIcon,
  PencilIcon,
  Squares2X2Icon,
  PrinterIcon,
  PowerIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Actions({
  isLocked,
  info,
  view,
  setSelected,
  setSelectedVariants,
  handleDelete,
  handleToggle,
  setPrinterInvoice,
}) {
  const { can } = usePermissions();

  const canView = can(view, 'view');
  const canEdit = can(view, 'edit');
  const canDelete = can(view, 'delete');

  return (
    <div className="flex justify-center items-center gap-2 opacity-70 group-hover:opacity-100 transition">
      {canView && (
        <button
          onClick={() => setSelected(info)}
          disabled={isLocked}
          title="Ver"
          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition cursor-pointer"
        >
          <EyeIcon className="w-5 h-5" />
        </button>
      )}

      {view === 'companies' && (
        <Link
          href={`/CRM/platform/companies/${info.id}/locals`}
          title="Gestionar locales"
          className="p-2 rounded-lg hover:bg-teal-50 text-teal-600 transition cursor-pointer"
        >
          <BuildingStorefrontIcon className="w-5 h-5" />
        </Link>
      )}

      {view === 'companies' && (
        <button
          onClick={handleToggle}
          disabled={isLocked}
          title={
            info.status === 'ACTIVO' ? 'Desactivar (suspender)' : 'Activar'
          }
          className={`p-2 rounded-lg transition cursor-pointer ${
            info.status === 'ACTIVO'
              ? 'hover:bg-red-50 text-red-600'
              : 'hover:bg-green-50 text-green-600'
          }`}
        >
          <PowerIcon className="w-5 h-5" />
        </button>
      )}

      {(view === 'inventory' || view === 'services') && canView && (
        <button
          onClick={() => setSelectedVariants(info)}
          disabled={isLocked}
          title="Variantes"
          className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition cursor-pointer"
        >
          <Squares2X2Icon className="w-5 h-5" />
        </button>
      )}

      {view === 'delivered_sales' && canView && (
        <button
          onClick={() => setPrinterInvoice(info)}
          disabled={isLocked}
          title="Imprimir"
          className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition cursor-pointer"
        >
          <PrinterIcon className="w-5 h-5" />
        </button>
      )}

      {canEdit && (
        <Link
          href={
            isLocked
              ? '#'
              : `/CRM/${view === 'platform' ? 'platform' : 'dashboard'}/${view}/edit/${info.id}`
          }
          title="Editar"
          className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition cursor-pointer"
        >
          <PencilIcon className="w-5 h-5" />
        </Link>
      )}

      {canDelete && (
        <button
          onClick={() => handleDelete()}
          disabled={isLocked}
          title="Eliminar"
          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition cursor-pointer"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
