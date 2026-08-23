// Estado del "día" (caja) de una sede a partir de la caja abierta actual.
//   'ok'       -> caja abierta de hoy (se puede vender)
//   'not_open' -> no hay caja abierta (hay que abrir el día)
//   'prev_day' -> hay caja abierta pero de un día anterior (cerrar el día)
//
// IMPORTANTE: el "día" se calcula en hora Colombia FIJA (UTC-5), igual que el
// backend (ver colombiaDayStart en cash.service / el guard de ventas). No se usa
// la zona horaria del dispositivo: una tablet/navegador con zona mal configurada
// (p.ej. UTC) hacía que una caja abierta hoy se viera como "día anterior" por la
// tarde/noche y bloqueaba la venta aunque el backend sí la aceptara.

// Identificador del día en hora Colombia (UTC-5) para una fecha dada.
function colombiaDayKey(date) {
  const col = new Date(date.getTime() - 5 * 3600 * 1000);
  return `${col.getUTCFullYear()}-${col.getUTCMonth()}-${col.getUTCDate()}`;
}

export function dayStateFromRegister(register) {
  if (!register) return 'not_open';
  const opened = new Date(register.openedAt);
  const now = new Date();
  return colombiaDayKey(opened) === colombiaDayKey(now) ? 'ok' : 'prev_day';
}
