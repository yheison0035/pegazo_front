import { useAuth } from '@/context/authContext';
import usePermissions from '@/hooks/usePermissions';
import {
  EyeIcon,
  TrashIcon,
  PencilIcon,
  Squares2X2Icon,
  PrinterIcon,
  PowerIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { sendInvoiceWhatsapp } from '@/utils/invoiceWhatsapp';

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
  const auth = useAuth();
  const companyName = auth?.usuario?.company?.name;
  const businessType = auth?.usuario?.company?.type;

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
          className="p-2 rounded-lg hover:bg-orange-50 text-orange-600 transition cursor-pointer"
        >
          <EyeIcon className="w-5 h-5" />
        </button>
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
          className="p-2 rounded-lg hover:bg-orange-50 text-orange-600 transition cursor-pointer"
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

      {view === 'delivered_sales' &&
        canView &&
        info?.customer?.phone &&
        info?.customer?.document !== '222222222222' && (
          <button
            onClick={() => sendInvoiceWhatsapp(info, companyName, businessType)}
            disabled={isLocked}
            title="Enviar factura por WhatsApp"
            className="p-2 rounded-lg text-green-600 transition hover:bg-green-50 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M12 2C6.48 2 2 6.24 2 11.5c0 1.98.64 3.81 1.73 5.34L2 22l5.34-1.7c1.5.9 3.2 1.4 4.99 1.4 5.52 0 10-4.24 10-9.5S17.52 2 12 2zm4.7 11.93c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.57.12-.17.25-.65.8-.8.97-.15.17-.3.19-.55.06-.25-.12-1.04-.38-1.98-1.22-.73-.64-1.22-1.43-1.37-1.68-.15-.25-.02-.39.11-.51.12-.12.25-.3.37-.45.12-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.12-.57-1.38-.78-1.88-.2-.48-.4-.42-.57-.43h-.48c-.17 0-.45.06-.68.32-.23.25-.9.88-.9 2.15s.92 2.5 1.05 2.67c.12.17 1.8 2.76 4.36 3.87 2.56 1.11 2.56.74 3.02.7.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z" />
            </svg>
          </button>
        )}

      {canEdit && (
        <Link
          href={
            isLocked
              ? '#'
              : `/${['companies'].includes(view) ? 'platform' : 'dashboard'}/${view}/edit/${info.id}`
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
