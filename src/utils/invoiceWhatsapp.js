// Frase de agradecimiento según lo que realmente maneja el negocio (módulos),
// no un tipo fijo: así aplica a cualquier vertical, incluidas las nuevas.
function thanksPhrase(modules) {
  const m = Array.isArray(modules) ? modules : [];
  if (m.includes('appointments'))
    return 'Gracias por confiar en nuestros servicios';
  if (m.includes('kitchen') || m.includes('mesas'))
    return 'Gracias por tu pedido';
  return 'Gracias por tu compra';
}

// Abre WhatsApp con un mensaje que incluye la factura y su enlace de
// verificación, para enviársela al cliente. El saludo se adapta a la vertical.
export function sendInvoiceWhatsapp(sale, companyName, modules) {
  const raw = String(sale?.customer?.phone || '').replace(/\D/g, '');
  if (!raw) return { ok: false, reason: 'sin-telefono' };
  const phone = raw.length === 10 && raw.startsWith('3') ? `57${raw}` : raw;

  // Dominio público fijo (pegazo.co). No usamos variable de entorno ni el
  // origen actual del admin para evitar que aparezca el dominio viejo.
  const verifyUrl = `https://pegazo.co/verifyCodeSale?code=${sale.code}`;

  const total = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(sale.totalAmount || 0);

  const nombre = sale?.customer?.name
    ? ` ${String(sale.customer.name).trim().split(/\s+/)[0]}`
    : '';

  const msg = [
    `¡Hola${nombre}! ${thanksPhrase(modules)} en ${
      companyName || 'nuestro negocio'
    }.`,
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
