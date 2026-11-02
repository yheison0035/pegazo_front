// Validación de los datos del cliente al reservar una cita (página pública).
// Pura, sin React, para poder probarla y compartir las mismas reglas con el
// backend: nombre COMPLETO (nombre y apellido), correo válido y celular válido.
export function validateBookingContact({ name, email, phone } = {}) {
  const nombre = String(name || '').trim().replace(/\s+/g, ' ');
  // "Completo" = al menos dos palabras de 2+ letras (nombre y apellido).
  if (nombre.split(' ').filter((w) => w.length >= 2).length < 2) {
    return {
      ok: false,
      field: 'name',
      message: 'Escribe tu nombre completo (nombre y apellido).',
    };
  }
  const correo = String(email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    return { ok: false, field: 'email', message: 'Escribe un correo válido.' };
  }
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return { ok: false, field: 'phone', message: 'Escribe un celular válido.' };
  }
  return {
    ok: true,
    name: nombre,
    email: correo.toLowerCase(),
    phone: digits,
  };
}
