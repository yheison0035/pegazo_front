'use client';

import { useState } from 'react';
import { useAuth } from '@/context/authContext';
import AuditHistoryModal from '@/components/dashboard/audit/AuditHistoryModal';

export const ACTION_LABEL = {
  CREATE: 'Creó',
  UPDATE: 'Editó',
  DELETE: 'Eliminó',
};

export const ACTION_COLOR = {
  CREATE: 'text-emerald-600',
  UPDATE: 'text-orange-600',
  DELETE: 'text-red-600',
};

// Nombres de campo -> etiqueta legible (compartido entre módulos).
export const FIELD_LABELS = {
  type_document: 'Tipo doc.',
  document: 'Documento',
  name: 'Nombre',
  email: 'Correo',
  phone: 'Teléfono',
  department: 'Departamento',
  city: 'Ciudad',
  address: 'Dirección',
  status: 'Estado',
  localId: 'Local',
  description: 'Descripción',
  concept: 'Concepto',
  amount: 'Monto',
  type: 'Tipo',
  paidTo: 'Pagado a',
  paymentMethod: 'Método de pago',
  purchasePrice: 'Precio compra',
  salePrice: 'Precio venta',
  oldPrice: 'Precio anterior',
  stock: 'Stock',
  barcode: 'Código de barras',
  providerId: 'Proveedor',
  categoryId: 'Categoría',
  brandId: 'Marca',
  duration: 'Duración',
  role: 'Rol',
  contactName: 'Contacto',
  productType: 'Tipo de producto',
  expenseDate: 'Fecha',
  date: 'Fecha',
  startTime: 'Hora',
  notes: 'Notas',
  serviceId: 'Servicio',
  barberId: 'Barbero',
  customerId: 'Cliente',
  userId: 'Vendedor',
  paymentStatus: 'Estado de pago',
  saleStatus: 'Estado de venta',
  totalAmount: 'Total',
  clientConfirmed: 'Cliente confirmó',
  saleDate: 'Fecha de venta',
  discount: 'Descuento',
  price: 'Precio',
  subtotal: 'Subtotal',
  size: 'Talla',
  color: 'Color',
  minStock: 'Stock mínimo',
  endTime: 'Hora fin',
};

// Mapea el "view" de la tabla al nombre de entidad que usa la auditoría.
export const VIEW_TO_ENTITY = {
  inventory: 'inventory',
  customers: 'customer',
  providers: 'provider',
  expenses: 'expense',
  services: 'service',
  appointments: 'appointment',
  brands: 'brand',
  categories: 'category',
  delivered_sales: 'sale',
};

export default function LastAudit({ audit, entity, id }) {
  const { usuario } = useAuth();
  const [open, setOpen] = useState(false);

  if (!audit) return <span className="text-gray-400">—</span>;

  const label = ACTION_LABEL[audit.action] || audit.action;
  const color = ACTION_COLOR[audit.action] || 'text-gray-600';
  const fields = (audit.fields || []).map((f) => FIELD_LABELS[f] || f);

  // Solo dueño/admin pueden consultar el historial detallado (el backend lo
  // restringe); para el resto se muestra el resumen sin poder abrir el detalle.
  const canView =
    ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role) &&
    entity &&
    id != null;

  const body = (
    <div className="text-xs leading-tight">
      <span className={`font-semibold ${color}`}>{label}</span>{' '}
      <span className="text-gray-700">{audit.userName}</span>
      {fields.length > 0 && (
        <div className="mt-0.5 text-gray-500">{fields.join(', ')}</div>
      )}
    </div>
  );

  if (!canView) return body;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Ver detalle del cambio"
        className="group/audit -m-1 rounded-lg p-1 text-left transition hover:bg-orange-50"
      >
        {body}
        <span className="mt-0.5 flex items-center gap-0.5 text-[10px] font-medium text-orange-600 opacity-0 transition group-hover/audit:opacity-100">
          Ver detalle
        </span>
      </button>
      {open && (
        <AuditHistoryModal
          entity={entity}
          id={id}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
