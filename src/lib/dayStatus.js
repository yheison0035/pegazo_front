// Estado del "día" (caja) de una sede a partir de la caja abierta actual.
//   'ok'       -> caja abierta de hoy (se puede vender)
//   'not_open' -> no hay caja abierta (hay que abrir el día)
//   'prev_day' -> hay caja abierta pero de un día anterior (cerrar el día)
export function dayStateFromRegister(register) {
  if (!register) return 'not_open';
  const opened = new Date(register.openedAt);
  const now = new Date();
  const sameDay =
    opened.getFullYear() === now.getFullYear() &&
    opened.getMonth() === now.getMonth() &&
    opened.getDate() === now.getDate();
  return sameDay ? 'ok' : 'prev_day';
}
