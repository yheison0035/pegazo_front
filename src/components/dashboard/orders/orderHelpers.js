// Estados de envío (coinciden con el enum ShippingStatus del backend).
export const SHIPPING_STATUS_OPTIONS = [
  { id: 'PENDIENTE', name: 'Pendiente' },
  { id: 'ASIGNADO_TRANSPORTADORA', name: 'Asignado a transportadora' },
  { id: 'EN_CAMINO', name: 'En camino' },
  { id: 'ENTREGADO', name: 'Entregado' },
  { id: 'DEVUELTO', name: 'Devuelto' },
  { id: 'FALLIDO', name: 'Fallido' },
];

const SHIPPING_STYLES = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  ASIGNADO_TRANSPORTADORA: 'bg-blue-100 text-blue-700',
  EN_CAMINO: 'bg-indigo-100 text-indigo-700',
  ENTREGADO: 'bg-green-100 text-green-700',
  DEVUELTO: 'bg-red-100 text-red-700',
  FALLIDO: 'bg-red-100 text-red-700',
};

export function shippingLabel(status) {
  return (
    SHIPPING_STATUS_OPTIONS.find((o) => o.id === status)?.name || status || '—'
  );
}

function Badge({ children, cls }) {
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

export function shippingBadge(status) {
  return (
    <Badge cls={SHIPPING_STYLES[status] || 'bg-gray-100 text-gray-600'}>
      {shippingLabel(status)}
    </Badge>
  );
}

const PAYMENT_STYLES = {
  PAGADA: 'bg-green-100 text-green-700',
  PENDIENTE: 'bg-amber-100 text-amber-700',
  EN_VALIDACION: 'bg-blue-100 text-blue-700',
  PLAN_SEPARE: 'bg-blue-100 text-blue-700',
  FIADO: 'bg-purple-100 text-purple-700',
  RECHAZADA: 'bg-red-100 text-red-700',
  VENCIDO: 'bg-red-100 text-red-700',
  ANULADO: 'bg-gray-200 text-gray-600',
  REEMBOLSADO: 'bg-gray-200 text-gray-600',
};

export function paymentBadge(status) {
  return (
    <Badge cls={PAYMENT_STYLES[status] || 'bg-gray-100 text-gray-600'}>
      {status || '—'}
    </Badge>
  );
}

// El pedido puede traer cliente de ecommerce (tienda online) o cliente del CRM.
export function orderCustomerName(order) {
  const e = order?.ecommerceCustomer;
  if (e) return `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Cliente';
  return order?.customer?.name || 'Cliente';
}

export function orderCustomerPhone(order) {
  return order?.ecommerceCustomer?.phone || order?.customer?.phone || '';
}

export function orderShippingAddress(order) {
  const e = order?.ecommerceCustomer;
  if (!e) return '';
  return [e.address, e.addressDetail, e.neighborhood, e.city, e.department]
    .filter(Boolean)
    .join(', ');
}
