// Saldos iniciales (asiento de apertura): el dueño/contador escribe el saldo
// de cada cuenta (débito o crédito) y el sistema cuadra la diferencia contra
// una cuenta de patrimonio. Funciones puras.

export const DEFAULT_EQUITY_CODES = ['3115', '3105', '3130', '3605'];

// Elige la cuenta de patrimonio para cuadrar (capital si existe).
export function pickEquityAccount(accounts) {
  const list = accounts || [];
  for (const code of DEFAULT_EQUITY_CODES) {
    const a = list.find((x) => x.code === code);
    if (a) return a.code;
  }
  const eq = list.find((x) => x.type === 'EQUITY');
  return eq ? eq.code : '';
}

const num = (v) => Math.max(0, Math.round(Number(v) || 0));

// Totales y diferencia (débitos − créditos) de las filas capturadas.
export function openingTotals(rows) {
  let debit = 0;
  let credit = 0;
  for (const r of rows || []) {
    debit += num(r.debit);
    credit += num(r.credit);
  }
  return { debit, credit, diff: debit - credit };
}

// Arma el asiento de apertura balanceado. Si hay diferencia, la lleva a la
// cuenta de patrimonio indicada (crédito si sobran débitos, débito si no).
export function buildOpeningEntry({ date, rows, equityAccount, accounts, description }) {
  const lines = (rows || [])
    .map((r) => ({
      accountCode: String(r.accountCode || '').trim(),
      accountName: r.accountName || null,
      debit: num(r.debit),
      credit: num(r.credit),
    }))
    .filter((l) => l.accountCode && (l.debit > 0 || l.credit > 0));
  const { diff } = openingTotals(lines);
  if (diff !== 0) {
    if (!equityAccount) {
      throw new Error('Elige la cuenta de patrimonio para cuadrar la diferencia.');
    }
    const acc = (accounts || []).find((a) => a.code === equityAccount);
    const idx = lines.findIndex((l) => l.accountCode === equityAccount);
    if (idx >= 0) {
      // Ya venía esa cuenta: ajusta su saldo neto.
      const net = lines[idx].credit - lines[idx].debit + diff;
      lines[idx] = {
        ...lines[idx],
        debit: net < 0 ? -net : 0,
        credit: net > 0 ? net : 0,
      };
      if (!lines[idx].debit && !lines[idx].credit) lines.splice(idx, 1);
    } else {
      lines.push({
        accountCode: equityAccount,
        accountName: acc?.name || null,
        debit: diff < 0 ? -diff : 0,
        credit: diff > 0 ? diff : 0,
      });
    }
  }
  if (lines.length < 2) throw new Error('Captura al menos dos saldos.');
  return {
    date,
    description: description || 'Saldos iniciales (apertura)',
    reference: 'APERTURA',
    lines,
  };
}
