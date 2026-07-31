const ACTION_LABEL = {
  CREATE: 'Creó',
  UPDATE: 'Editó',
  DELETE: 'Eliminó',
};

const ACTION_COLOR = {
  CREATE: 'text-emerald-600',
  UPDATE: 'text-orange-600',
  DELETE: 'text-red-600',
};

// Nombres de campo -> etiqueta legible (compartido entre módulos).
const FIELD_LABELS = {
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
};

export default function LastAudit({ audit }) {
  if (!audit) return <span className="text-gray-400">—</span>;

  const label = ACTION_LABEL[audit.action] || audit.action;
  const color = ACTION_COLOR[audit.action] || 'text-gray-600';
  const fields = (audit.fields || []).map((f) => FIELD_LABELS[f] || f);

  return (
    <div className="text-xs leading-tight">
      <span className={`font-semibold ${color}`}>{label}</span>{' '}
      <span className="text-gray-700">{audit.userName}</span>
      {fields.length > 0 && (
        <div className="mt-0.5 text-gray-500">{fields.join(', ')}</div>
      )}
    </div>
  );
}
