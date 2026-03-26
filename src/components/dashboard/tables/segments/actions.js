import usePermissions from '@/hooks/usePermissions';
import {
  EyeIcon,
  TrashIcon,
  PencilIcon,
  Squares2X2Icon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Actions({
  isLocked,
  info,
  view,
  setSelected,
  setSelectedVariants,
  handleDelete,
  setPrinterInvoice,
}) {
  const { canDelete } = usePermissions();

  return (
    <div className="flex justify-center items-center gap-2 opacity-70 group-hover:opacity-100 transition">
      <button
        onClick={() => setSelected(info)}
        disabled={isLocked}
        title="Ver"
        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition cursor-pointer"
      >
        <EyeIcon className="w-5 h-5" />
      </button>

      {view === 'inventory' && (
        <button
          onClick={() => setSelectedVariants(info)}
          disabled={isLocked}
          title="Variantes"
          className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition cursor-pointer"
        >
          <Squares2X2Icon className="w-5 h-5" />
        </button>
      )}

      {view === 'delivered_sales' && (
        <button
          onClick={() => setPrinterInvoice(info)}
          disabled={isLocked}
          title="Imprimir"
          className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition cursor-pointer"
        >
          <PrinterIcon className="w-5 h-5" />
        </button>
      )}

      <Link
        href={isLocked ? '#' : `/CRM/dashboard/${view}/edit/${info.id}`}
        title="Editar"
        className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition cursor-pointer"
      >
        <PencilIcon className="w-5 h-5" />
      </Link>

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
