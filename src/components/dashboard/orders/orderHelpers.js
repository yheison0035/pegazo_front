// Estados de envío (coinciden con el enum ShippingStatus del backend). Las
// etiquetas siguen el flujo del negocio: confirmado → empacando → despachado →
// en camino → entregado / no entregado.
export const SHIPPING_STATUS_OPTIONS = [
  { id: 'PENDIENTE', name: 'Confirmado · Empacando' },
  { id: 'ASIGNADO_TRANSPORTADORA', name: 'Despachado' },
  { id: 'EN_CAMINO', name: 'En camino' },
  { id: 'ENTREGADO', name: 'Entregado' },
  { id: 'FALLIDO', name: 'No entregado' },
  { id: 'DEVUELTO', name: 'Devuelto' },
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

// Ícono de WhatsApp (SVG inline; el CRM no usa react-icons).
export function WhatsappIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
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

// --- WhatsApp: el dueño notifica al cliente con un clic ---------------------

// Construye el enlace wa.me con el número del cliente (Colombia por defecto) y
// un mensaje ya redactado. Devuelve null si el pedido no tiene teléfono.
export function orderWhatsappUrl(order, message) {
  const raw = String(orderCustomerPhone(order) || '').replace(/\D/g, '');
  if (!raw) return null;
  const phone = raw.length === 10 ? `57${raw}` : raw; // CO si viene sin indicativo
  return `https://wa.me/${phone}?text=${encodeURIComponent(message || '')}`;
}

function firstName(order) {
  return (orderCustomerName(order) || 'Hola').split(/\s+/)[0];
}

function itemsList(order) {
  return (order?.items || [])
    .map(
      (it) =>
        `• ${it.variant?.inventory?.name || it.service?.name || 'Producto'} x${it.quantity}`,
    )
    .join('\n');
}

// Mensaje de confirmación del pedido (para el clic en la columna Contacto).
export function orderConfirmMessage(order) {
  const total =
    typeof order?.totalAmount === 'number'
      ? `$${order.totalAmount.toLocaleString('es-CO')}`
      : '';
  const addr = orderShippingAddress(order);
  return [
    `¡Hola ${firstName(order)}! 👋`,
    ``,
    `Confirmamos tu pedido *${order?.code || ''}*:`,
    itemsList(order),
    total ? `\nTotal: *${total}*` : '',
    addr ? `Envío a: ${addr}` : '',
    ``,
    `¿Confirmas estos datos para empezar a prepararlo? 🙌`,
  ]
    .filter((l) => l !== undefined && l !== '')
    .join('\n');
}

// Mensajes por cada cambio de estado del envío.
export const SHIPPING_MESSAGES = {
  PENDIENTE: (o) =>
    `¡Hola ${firstName(o)}! Estamos *empacando* tu pedido ${o?.code || ''}. Te avisamos cuando salga. 📦`,
  ASIGNADO_TRANSPORTADORA: (o) =>
    `¡Buenas noticias ${firstName(o)}! Tu pedido ${o?.code || ''} ya fue *despachado*. 🚚`,
  EN_CAMINO: (o) =>
    `${firstName(o)}, tu pedido ${o?.code || ''} va *en camino* y llegará pronto. 🛵`,
  ENTREGADO: (o) =>
    `${firstName(o)}, tu pedido ${o?.code || ''} fue *entregado*. ¡Gracias por tu compra! 🙏`,
  FALLIDO: (o) =>
    `${firstName(o)}, no pudimos *entregar* tu pedido ${o?.code || ''}. Te contactamos para reprogramar la entrega. 🙏`,
  DEVUELTO: (o) =>
    `${firstName(o)}, tu pedido ${o?.code || ''} fue registrado como *devuelto*. Cualquier duda, escríbenos.`,
};

export function shippingMessage(status, order) {
  const fn = SHIPPING_MESSAGES[status];
  return fn ? fn(order) : `Actualización de tu pedido ${order?.code || ''}.`;
}
