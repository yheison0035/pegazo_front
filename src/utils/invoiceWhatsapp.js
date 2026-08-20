// Abre WhatsApp con un mensaje que incluye la factura y su enlace de
// verificación, para enviársela al cliente.
export function sendInvoiceWhatsapp(sale, companyName) {
  const raw = String(sale?.customer?.phone || '').replace(/\D/g, '');
  if (!raw) return { ok: false, reason: 'sin-telefono' };
  const phone = raw.length === 10 && raw.startsWith('3') ? `57${raw}` : raw;

  const base =
    process.env.NEXT_PUBLIC_VERIFY_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const verifyUrl = `${base}/verifyCodeSale?code=${sale.code}`;

  const total = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(sale.totalAmount || 0);

  const nombre = sale?.customer?.name
    ? ` ${String(sale.customer.name).trim().split(/\s+/)[0]}`
    : '';

  const msg = [
    `¡Hola${nombre}! Gracias por tu compra en ${companyName || 'nuestro negocio'}.`,
    `Factura N° ${sale.code}`,
    `Total: ${total}`,
    '',
    `Verifícala aquí: ${verifyUrl}`,
  ].join('\n');

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
    '_blank',
    'noopener,noreferrer'
  );
  return { ok: true };
}
