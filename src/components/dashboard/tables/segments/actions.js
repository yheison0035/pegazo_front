import { useState } from 'react';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/toastContext';
import usePermissions from '@/hooks/usePermissions';
import {
  EyeIcon,
  TrashIcon,
  PencilSquareIcon,
  RectangleGroupIcon,
  PrinterIcon,
  PowerIcon,
  ArrowRightEndOnRectangleIcon,
  DocumentTextIcon,
  ArrowPathRoundedSquareIcon,
} from '@heroicons/react/24/outline';
import TableActionButton from '@/components/ui/TableActionButton';
import { sendInvoiceWhatsapp } from '@/utils/invoiceWhatsapp';
import { emitFiscalInvoice, reissueFiscalInvoice } from '@/lib/api/routes/fiscal';
import { printFiscalInvoice } from '@/utils/printFiscalInvoice';
import { effectiveModules } from '@/lib/appointmentsAccess';
import { enterAsCompany } from '@/lib/impersonation';

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
  const toast = useToast();
  const companyName = auth?.usuario?.company?.name;
  const companyModules = effectiveModules(auth?.usuario);
  // La factura electrónica solo se ofrece si la empresa la tiene habilitada o ya
  // está vinculada al servicio fiscal (no aparece en negocios que no la usan).
  const fiscalEnabled =
    !!auth?.usuario?.company?.electronicInvoicingEnabled ||
    !!auth?.usuario?.company?.fiscalCompanyId;
  const [emitting, setEmitting] = useState(false);

  // Emite (o reutiliza, es idempotente por venta) la factura electrónica DIAN
  // y la imprime en formato térmico con su CUFE + QR de la DIAN.
  const emitAndPrintFiscal = async () => {
    if (emitting) return;
    setEmitting(true);
    try {
      const doc = await emitFiscalInvoice(info.id);
      toast.show({
        type: 'success',
        message: `Factura electrónica ${doc?.number || ''} lista (${doc?.status || ''}).`,
      });
      printFiscalInvoice(info, doc, auth?.usuario);
    } catch (e) {
      toast.show({ type: 'error', message: e.message });
    } finally {
      setEmitting(false);
    }
  };

  // Corrige la factura de la venta: anula la anterior y reemite una corregida
  // (con los datos actuales del cliente/venta), y la imprime.
  const correctAndPrintFiscal = async () => {
    if (emitting) return;
    if (
      !window.confirm(
        'Se anulará la factura actual de esta venta y se reemitirá corregida con los datos actuales del cliente. ¿Continuar?',
      )
    )
      return;
    setEmitting(true);
    try {
      const doc = await reissueFiscalInvoice(info.id);
      toast.show({
        type: 'success',
        message: `Factura corregida ${doc?.number || ''} emitida.`,
      });
      printFiscalInvoice(info, doc, auth?.usuario);
    } catch (e) {
      toast.show({ type: 'error', message: e.message });
    } finally {
      setEmitting(false);
    }
  };

  const canView = can(view, 'view');
  const canEdit = can(view, 'edit');
  const canDelete = can(view, 'delete');

  const isActive = info.status === 'ACTIVO';

  return (
    <div className="flex items-center justify-center gap-1 opacity-80 transition group-hover:opacity-100">
      {canView && view === 'companies' && (
        <TableActionButton
          icon={EyeIcon}
          label="Ver panel de la empresa"
          variant="view"
          disabled={isLocked}
          href={isLocked ? undefined : `/platform/companies/${info.id}`}
        />
      )}

      {canView && view !== 'companies' && (
        <TableActionButton
          icon={EyeIcon}
          label="Ver detalle"
          variant="view"
          disabled={isLocked}
          onClick={() => setSelected(info)}
        />
      )}

      {view === 'companies' && (
        <TableActionButton
          icon={PowerIcon}
          label={isActive ? 'Desactivar (suspender)' : 'Activar'}
          variant={isActive ? 'danger' : 'success'}
          disabled={isLocked}
          onClick={handleToggle}
        />
      )}

      {view === 'companies' && isActive && (
        <TableActionButton
          icon={ArrowRightEndOnRectangleIcon}
          label="Entrar como esta empresa"
          variant="info"
          disabled={isLocked}
          onClick={async () => {
            try {
              await enterAsCompany(info.id);
              window.location.href = '/dashboard';
            } catch (e) {
              alert(e?.message || 'No se pudo entrar como la empresa.');
            }
          }}
        />
      )}

      {(view === 'inventory' || view === 'services') && canView && (
        <TableActionButton
          icon={RectangleGroupIcon}
          label="Variantes"
          variant="view"
          disabled={isLocked}
          onClick={() => setSelectedVariants(info)}
        />
      )}

      {view === 'delivered_sales' && canView && (
        <TableActionButton
          icon={PrinterIcon}
          label="Imprimir tiquete"
          variant="info"
          disabled={isLocked}
          onClick={() => setPrinterInvoice(info)}
        />
      )}

      {view === 'delivered_sales' && canView && fiscalEnabled && (
        <TableActionButton
          icon={DocumentTextIcon}
          label={
            info?.eInvoiceStatus
              ? `Factura electrónica: ${info.eInvoiceStatus}`
              : 'Factura electrónica DIAN'
          }
          variant="success"
          disabled={isLocked || emitting}
          onClick={emitAndPrintFiscal}
        />
      )}

      {view === 'delivered_sales' &&
        canView &&
        fiscalEnabled &&
        info?.eInvoiceStatus &&
        info?.eInvoiceStatus !== 'ANULADA' && (
          <TableActionButton
            icon={ArrowPathRoundedSquareIcon}
            label="Corregir factura (anular + reemitir)"
            variant="edit"
            disabled={isLocked || emitting}
            onClick={correctAndPrintFiscal}
          />
        )}

      {view === 'delivered_sales' &&
        canView &&
        info?.customer?.phone &&
        info?.customer?.document !== '222222222222' && (
          <TableActionButton
            label="Enviar factura por WhatsApp"
            variant="whatsapp"
            disabled={isLocked}
            onClick={() => sendInvoiceWhatsapp(info, companyName, companyModules)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-[18px] w-[18px]"
            >
              <path d="M12 2C6.48 2 2 6.24 2 11.5c0 1.98.64 3.81 1.73 5.34L2 22l5.34-1.7c1.5.9 3.2 1.4 4.99 1.4 5.52 0 10-4.24 10-9.5S17.52 2 12 2zm4.7 11.93c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.57.12-.17.25-.65.8-.8.97-.15.17-.3.19-.55.06-.25-.12-1.04-.38-1.98-1.22-.73-.64-1.22-1.43-1.37-1.68-.15-.25-.02-.39.11-.51.12-.12.25-.3.37-.45.12-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.12-.57-1.38-.78-1.88-.2-.48-.4-.42-.57-.43h-.48c-.17 0-.45.06-.68.32-.23.25-.9.88-.9 2.15s.92 2.5 1.05 2.67c.12.17 1.8 2.76 4.36 3.87 2.56 1.11 2.56.74 3.02.7.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z" />
            </svg>
          </TableActionButton>
        )}

      {canEdit && (
        <TableActionButton
          icon={PencilSquareIcon}
          label="Editar"
          variant="edit"
          disabled={isLocked}
          href={
            isLocked
              ? undefined
              : `/${['companies'].includes(view) ? 'platform' : 'dashboard'}/${view}/edit/${info.id}`
          }
        />
      )}

      {canDelete && (
        <TableActionButton
          icon={TrashIcon}
          label="Eliminar"
          variant="delete"
          disabled={isLocked}
          onClick={() => handleDelete()}
        />
      )}
    </div>
  );
}
