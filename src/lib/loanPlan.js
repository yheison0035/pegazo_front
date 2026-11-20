// Motor de préstamos (espejo del backend src/loans/loan-plan.util.ts). Se usa
// para la vista previa inmediata del simulador y del formulario de préstamo; la
// fuente de verdad sigue siendo el backend (POST /loans/simulate y al crear).
//
// Convenciones: tasa en % MENSUAL convertida al periodo (proporcional por
// defecto); mora en % mensual sobre el capital vencido; pesos enteros.

export const LOAN_FREQUENCIES = [
  { id: 'DIARIA', label: 'Diaria', days: 1 },
  { id: 'SEMANAL', label: 'Semanal', days: 7 },
  { id: 'QUINCENAL', label: 'Quincenal', days: 15 },
  { id: 'MENSUAL', label: 'Mensual', days: 30 },
];
export const FREQ_LABEL = Object.fromEntries(LOAN_FREQUENCIES.map((f) => [f.id, f.label]));
export const PERIOD_DAYS = Object.fromEntries(LOAN_FREQUENCIES.map((f) => [f.id, f.days]));

export const LOAN_AMORTIZATIONS = [
  { id: 'SIMPLE', label: 'Interés simple (cuota fija)', hint: 'Interés sobre el capital inicial todo el plazo. El más usado en microcrédito y cobro diario.' },
  { id: 'FRANCES', label: 'Cuota fija (francés)', hint: 'Cuota igual todo el plazo; el interés se calcula sobre el saldo.' },
  { id: 'ALEMAN', label: 'Capital fijo (alemán)', hint: 'Capital igual en cada cuota; la cuota baja con el tiempo.' },
];
export const AMORT_LABEL = Object.fromEntries(LOAN_AMORTIZATIONS.map((a) => [a.id, a.label]));

export const LOAN_STATUS_LABEL = {
  SOLICITADO: 'Solicitado',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  DESEMBOLSADO: 'Activo',
  PAGADO: 'Pagado',
  REFINANCIADO: 'Refinanciado',
  CASTIGADO: 'Castigado',
  ANULADO: 'Anulado',
  AL_DIA: 'Al día',
  EN_MORA: 'En mora',
};

const peso = (n) => Math.round(Number(n) || 0);
const DAY_MS = 86400000;

export function roundToMultiple(n, multiple = 1) {
  const m = Math.max(1, Math.floor(Number(multiple) || 1));
  if (m === 1) return peso(n);
  return Math.round(n / m) * m;
}

export function addMonthsClamped(base, months) {
  const d = new Date(base);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
}

export function shiftToAllowedWeekday(date, excludeWeekdays = []) {
  if (!excludeWeekdays.length) return date;
  const allowed = new Set([0, 1, 2, 3, 4, 5, 6].filter((w) => !excludeWeekdays.includes(w)));
  if (!allowed.size) return date;
  const d = new Date(date);
  let guard = 0;
  while (!allowed.has(d.getDay()) && guard++ < 7) d.setDate(d.getDate() + 1);
  return d;
}

export function nextDueDate(base, frequency, excludeWeekdays = []) {
  const d = new Date(base);
  switch (frequency) {
    case 'DIARIA':
      d.setDate(d.getDate() + 1);
      return shiftToAllowedWeekday(d, excludeWeekdays);
    case 'SEMANAL':
      d.setDate(d.getDate() + 7);
      return shiftToAllowedWeekday(d, excludeWeekdays);
    case 'QUINCENAL':
      d.setDate(d.getDate() + 15);
      return shiftToAllowedWeekday(d, excludeWeekdays);
    case 'MENSUAL':
    default:
      return shiftToAllowedWeekday(addMonthsClamped(d, 1), excludeWeekdays);
  }
}

export function periodicRate(monthlyRatePercent, frequency, conversion = 'PROPORCIONAL') {
  const m = Math.max(0, Number(monthlyRatePercent) || 0) / 100;
  const days = PERIOD_DAYS[frequency] ?? 30;
  if (m === 0) return 0;
  if (frequency === 'MENSUAL') return m;
  if (conversion === 'EFECTIVA') return Math.pow(1 + m, days / 30) - 1;
  return (m * days) / 30;
}

export function effectiveAnnualRate(monthlyRatePercent) {
  const m = Math.max(0, Number(monthlyRatePercent) || 0) / 100;
  return Math.pow(1 + m, 12) - 1;
}

function buildDates(first, n, frequency, excl) {
  const dates = [new Date(first)];
  for (let i = 1; i < n; i++) dates.push(nextDueDate(dates[i - 1], frequency, excl));
  return dates;
}

// Tabla de amortización. Devuelve null si faltan datos para calcular.
export function buildLoanPlan({
  principal,
  interestRate = 0,
  termCount,
  frequency = 'MENSUAL',
  amortization = 'SIMPLE',
  rateConversion = 'PROPORCIONAL',
  roundTo = 1,
  disbursementDate,
  firstDueDate,
  excludeWeekdays = [],
} = {}) {
  const P = peso(Math.max(0, principal));
  const N = Math.max(0, Math.floor(Number(termCount) || 0));
  if (!P || !N) return null;
  const freq = PERIOD_DAYS[frequency] ? frequency : 'MENSUAL';
  const amort = AMORT_LABEL[amortization] ? amortization : 'SIMPLE';
  const rt = Math.max(1, Math.floor(Number(roundTo) || 1));
  const excl = Array.isArray(excludeWeekdays) ? excludeWeekdays.map(Number) : [];
  const disb = disbursementDate ? new Date(disbursementDate) : new Date();
  const first = firstDueDate
    ? shiftToAllowedWeekday(new Date(firstDueDate), excl)
    : nextDueDate(disb, freq, excl);
  const i = periodicRate(interestRate, freq, rateConversion);
  const dates = buildDates(first, N, freq, excl);
  const rows = [];

  if (amort === 'FRANCES' && i > 0) {
    const A = roundToMultiple((P * i) / (1 - Math.pow(1 + i, -N)), rt);
    let balance = P;
    for (let k = 1; k <= N; k++) {
      const isLast = k === N;
      const interest = peso(balance * i);
      let capital = isLast ? balance : Math.min(balance, peso(A - interest));
      if (capital < 0) capital = 0;
      const total = capital + interest;
      balance = Math.max(0, balance - capital);
      rows.push({ number: k, dueDate: dates[k - 1], capital, interest, total, balanceAfter: balance });
    }
  } else if (amort === 'ALEMAN' && i > 0) {
    const baseCapital = roundToMultiple(P / N, rt);
    let balance = P;
    for (let k = 1; k <= N; k++) {
      const isLast = k === N;
      const interest = peso(balance * i);
      const capital = isLast ? balance : Math.min(balance, baseCapital);
      const total = capital + interest;
      balance = Math.max(0, balance - capital);
      rows.push({ number: k, dueDate: dates[k - 1], capital, interest, total, balanceAfter: balance });
    }
  } else {
    const totalInterest = peso(P * i * N);
    const totalAmount = P + totalInterest;
    const cuota = roundToMultiple(totalAmount / N, rt);
    const baseCapital = Math.floor(P / N);
    let capAssigned = 0;
    let totAssigned = 0;
    let balance = P;
    for (let k = 1; k <= N; k++) {
      const isLast = k === N;
      const capital = isLast ? P - capAssigned : baseCapital;
      const total = isLast ? totalAmount - totAssigned : cuota;
      const interest = Math.max(0, total - capital);
      capAssigned += capital;
      totAssigned += total;
      balance = Math.max(0, balance - capital);
      rows.push({ number: k, dueDate: dates[k - 1], capital, interest, total, balanceAfter: balance });
    }
  }

  const totalInterest = rows.reduce((a, r) => a + r.interest, 0);
  const totalAmount = rows.reduce((a, r) => a + r.total, 0);
  return {
    principal: P,
    interestRate: Number(interestRate) || 0,
    periodicRatePercent: Math.round(i * 100 * 10000) / 10000,
    frequency: freq,
    amortization: amort,
    termCount: N,
    totalInterest,
    totalAmount,
    installmentAmount: rows[0]?.total ?? 0,
    firstDueDate: dates[0],
    lastDueDate: dates[dates.length - 1],
    effectiveAnnualRatePercent: Math.round(effectiveAnnualRate(interestRate) * 10000) / 100,
    installments: rows,
  };
}

export function daysLate(dueDate, now = new Date()) {
  const d = Math.floor((now.getTime() - new Date(dueDate).getTime()) / DAY_MS);
  return d > 0 ? d : 0;
}

export function computeMora({ overdueCapital, dueDate, now = new Date(), moraRate, graceDays = 0 }) {
  const late = daysLate(dueDate, now);
  const grace = Math.max(0, Math.floor(Number(graceDays) || 0));
  const rate = Math.max(0, Number(moraRate) || 0) / 100;
  const base = Math.max(0, Number(overdueCapital) || 0);
  if (late <= grace || rate === 0 || base === 0) return 0;
  return peso(base * (rate / 30) * late);
}

// Días de atraso → etiqueta y clase de color (semáforo de mora).
export function overdueTone(days) {
  if (!days || days <= 0) return { label: 'Al día', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' };
  if (days > 30) return { label: `${days} días`, cls: 'bg-red-50 text-red-700 ring-red-600/20' };
  if (days > 8) return { label: `${days} días`, cls: 'bg-amber-50 text-amber-700 ring-amber-600/20' };
  return { label: `${days} ${days === 1 ? 'día' : 'días'}`, cls: 'bg-orange-50 text-orange-700 ring-orange-600/20' };
}
