// Ciclo de cierre mensual configurable por empresa (Company.cycleStartDay).
// startDay=1 => mes calendario (1→fin). Ej. RAGNOR usa 3 => del 3 al 2 del
// mes siguiente. Todo en fechas 'YYYY-MM-DD' (sin zona horaria: aritmética pura).

const p = (n) => String(n).padStart(2, '0');

// Rango [inicio, fin] (ambos inclusive) del ciclo que CONTIENE `todayStr`,
// desplazado `offset` meses (0 = actual, -1 = anterior).
export function cycleMonthRange(startDay, todayStr, offset = 0) {
  const sd =
    Number.isInteger(startDay) && startDay >= 1 && startDay <= 28 ? startDay : 1;
  const [y, m, d] = todayStr.split('-').map(Number);
  // Mes ancla del ciclo actual: si aún no llega el día de inicio, es el anterior.
  let ay = y;
  let am = d >= sd ? m : m - 1;
  am += offset;
  while (am < 1) { am += 12; ay -= 1; }
  while (am > 12) { am -= 12; ay += 1; }
  const start = `${ay}-${p(am)}-${p(sd)}`;
  // Fin = día previo al inicio del ciclo siguiente.
  const endD = new Date(Date.UTC(ay, am, sd)); // (am es 1-based → mes siguiente en 0-based)
  endD.setUTCDate(endD.getUTCDate() - 1);
  const end = `${endD.getUTCFullYear()}-${p(endD.getUTCMonth() + 1)}-${p(endD.getUTCDate())}`;
  return [start, end];
}

// Inicio del ciclo actual (para "este mes" hasta hoy).
export function cycleStartOf(startDay, todayStr) {
  return cycleMonthRange(startDay, todayStr, 0)[0];
}
