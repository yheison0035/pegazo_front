// Cálculo del plan de crédito por cuotas (espejo del backend credit-plan.util).
// Se usa para la previsualización en el POS y para mostrar el cronograma en
// cartera. La fuente de verdad sigue siendo el backend; esto solo pinta.

const peso = (n) => Math.round(Number(n) || 0);

export const FREQUENCIES = [
  { id: 'SEMANAL', label: 'Semanal', days: 7 },
  { id: 'QUINCENAL', label: 'Quincenal', days: 15 },
  { id: 'MENSUAL', label: 'Mensual', days: null },
  { id: 'ANUAL', label: 'Anual', days: null },
];

export const FREQ_LABEL = {
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  MENSUAL: 'Mensual',
  ANUAL: 'Anual',
};

export function addPeriod(base, frequency, steps) {
  const d = new Date(base);
  switch (frequency) {
    case 'SEMANAL':
      d.setDate(d.getDate() + 7 * steps);
      break;
    case 'QUINCENAL':
      d.setDate(d.getDate() + 15 * steps);
      break;
    case 'MENSUAL':
      d.setMonth(d.getMonth() + steps);
      break;
    case 'ANUAL':
      d.setFullYear(d.getFullYear() + steps);
      break;
    default:
      break;
  }
  return d;
}

// Devuelve { down, financedBase, interestAmount, financedTotal, obligation,
// startDate, installments:[{number,dueDate,amount}] } o null si no aplica.
export function buildCreditPlan({
  total,
  downPayment = 0,
  interestPercent = 0,
  count,
  frequency,
  startDate,
  saleDate,
}) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (!n || !frequency) return null;

  const totalP = peso(Math.max(0, total));
  const down = peso(Math.min(Math.max(0, downPayment), totalP));
  const pct = Math.max(0, Number(interestPercent) || 0);

  const financedBase = Math.max(0, totalP - down);
  const interestAmount = peso((financedBase * pct) / 100);
  const financedTotal = financedBase + interestAmount;
  const obligation = totalP + interestAmount;

  const base = saleDate ? new Date(saleDate) : new Date();
  const start = startDate ? new Date(startDate) : addPeriod(base, frequency, 1);

  const per = Math.floor(financedTotal / n);
  let assigned = 0;
  const installments = [];
  for (let i = 1; i <= n; i++) {
    const isLast = i === n;
    const amount = isLast ? financedTotal - assigned : per;
    assigned += amount;
    installments.push({
      number: i,
      dueDate: addPeriod(start, frequency, i - 1),
      amount: peso(amount),
    });
  }

  return {
    down,
    financedBase,
    interestAmount,
    financedTotal,
    obligation,
    startDate: start,
    installments,
  };
}
