// "Paquete contable": todo lo que el contador necesita en UN solo Excel con
// varias hojas (diario, mayor/balance de prueba, estados, impuestos, plan,
// asientos manuales, activos). Funciones puras: reciben lo que ya devuelven
// los endpoints y producen hojas como matrices (AOA).

const TYPE_LABEL = {
  ASSET: 'Activo',
  LIABILITY: 'Pasivo',
  EQUITY: 'Patrimonio',
  INCOME: 'Ingresos',
  COST: 'Costos',
  EXPENSE: 'Gastos',
};
const n = (v) => (v == null || v === '' ? '' : Number(v) || 0);
const d10 = (v) => (v ? String(v).slice(0, 10) : '');

export function journalSheet(journal) {
  const rows = [['Fecha', 'Tipo', 'Referencia', 'Descripción', 'Cuenta', 'Nombre', 'Débito', 'Crédito']];
  for (const e of journal?.entries || []) {
    for (const l of e.lines || []) {
      rows.push([d10(e.date), e.type || '', e.ref || '', e.description || '', l.code, l.name || '', l.debit || '', l.credit || '']);
    }
  }
  if (journal?.totals) rows.push(['', '', '', 'TOTALES', '', '', n(journal.totals.debit), n(journal.totals.credit)]);
  return rows;
}

export function ledgerSheet(ledger) {
  const rows = [['Código', 'Cuenta', 'Grupo', 'Débito', 'Crédito', 'Saldo']];
  let td = 0;
  let tc = 0;
  for (const a of ledger?.accounts || []) {
    td += a.debit || 0;
    tc += a.credit || 0;
    rows.push([a.code, a.name, TYPE_LABEL[a.type] || a.type || '', a.debit || '', a.credit || '', n(a.balance)]);
  }
  rows.push(['', 'TOTALES', td === tc ? 'Cuadra' : 'Descuadre', td, tc, '']);
  return rows;
}

export function incomeStatementSheet(fin) {
  const p = fin?.incomeStatement;
  const rows = [['Concepto', 'Código', 'Valor']];
  if (!p) return rows;
  const push = (title, list, total) => {
    rows.push([title, '', '']);
    for (const a of list || []) rows.push([a.name, a.code, n(a.value)]);
    rows.push([`Total ${title.toLowerCase()}`, '', n(total)]);
  };
  push('Ingresos', p.income, p.totalIncome);
  push('Costos', p.costs, p.totalCosts);
  rows.push(['Utilidad bruta', '', n(p.grossProfit)]);
  push('Gastos', p.expenses, p.totalExpenses);
  rows.push(['Utilidad neta', '', n(p.netProfit)]);
  return rows;
}

export function balanceSheetSheet(fin) {
  const b = fin?.balanceSheet;
  const rows = [['Concepto', 'Código', 'Valor']];
  if (!b) return rows;
  const push = (title, list, total) => {
    rows.push([title, '', '']);
    for (const a of list || []) rows.push([a.name, a.code, n(a.value)]);
    rows.push([`Total ${title.toLowerCase()}`, '', n(total)]);
  };
  push('Activo', b.assets, b.totalAssets);
  push('Pasivo', b.liabilities, b.totalLiabilities);
  rows.push(['Patrimonio', '', '']);
  for (const a of b.equity || []) rows.push([a.name, a.code, n(a.value)]);
  rows.push(['Resultado acumulado', '', n(b.retainedResult)]);
  rows.push(['Total patrimonio', '', n(b.totalEquity)]);
  rows.push(['Pasivo + Patrimonio', '', n((b.totalLiabilities || 0) + (b.totalEquity || 0))]);
  rows.push(['Cuadra', '', b.balanced ? 'Sí' : 'No']);
  return rows;
}

export function cashFlowSheet(fin) {
  const c = fin?.cashFlow;
  const rows = [['Cuenta', 'Código', 'Entradas', 'Salidas', 'Neto']];
  if (!c) return rows;
  for (const a of c.accounts || []) rows.push([a.name, a.code, n(a.in), n(a.out), n(a.net)]);
  rows.push(['TOTAL', '', n(c.totalIn), n(c.totalOut), n(c.net)]);
  return rows;
}

export function taxSheet(tax) {
  const rows = [['Impuesto', 'Cuenta', 'Débito', 'Crédito', 'Saldo por pagar']];
  if (!tax) return rows;
  rows.push(['Ingresos del periodo', '', '', '', n(tax.income)]);
  for (const k of ['iva', 'retefuente', 'ica']) {
    const t = tax[k];
    if (t) rows.push([t.name, t.code, n(t.debit), n(t.credit), n(t.balance)]);
  }
  return rows;
}

export function accountsSheet(accounts) {
  const rows = [['Código', 'Nombre', 'Grupo', 'Naturaleza', 'Activa']];
  for (const a of accounts || []) {
    rows.push([a.code, a.name, TYPE_LABEL[a.type] || a.type || '', a.nature === 'CREDIT' ? 'Crédito' : 'Débito', a.active === false ? 'No' : 'Sí']);
  }
  return rows;
}

export function manualEntriesSheet(entries) {
  const rows = [['Fecha', 'Asiento', 'Descripción', 'Referencia', 'Cuenta', 'Nombre', 'Débito', 'Crédito', 'Soporte']];
  for (const e of entries || []) {
    for (const l of e.lines || []) {
      rows.push([d10(e.date), e.id, e.description || '', e.reference || '', l.accountCode, l.accountName || '', l.debit || '', l.credit || '', e.attachmentUrl || '']);
    }
  }
  return rows;
}

export function assetsSheet(assets) {
  const rows = [['Nombre', 'Categoría', 'Referencia', 'Fecha compra', 'Cantidad', 'Valor unitario', 'Costo', 'Vida útil (meses)', 'Depreciación acumulada', 'Valor en libros', 'Estado']];
  for (const a of assets || []) {
    rows.push([a.name, a.category || '', a.reference || '', d10(a.acquisitionDate), a.quantity ?? 1, n(a.unitCost), n(a.cost), a.usefulLifeMonths ?? '', n(a.accumulatedDepreciation), n(a.bookValue), a.status || '']);
  }
  return rows;
}

// Arma todas las hojas del paquete. Las fuentes que no vengan se omiten.
export function buildPackageSheets({ company, startDate, endDate, journal, ledger, financials, taxSummary, accounts, entries, assets } = {}) {
  const sheets = [
    {
      name: 'Resumen',
      rows: [
        ['Empresa', company?.name || ''],
        ['NIT', company?.nit || ''],
        ['Periodo', `${startDate || ''} a ${endDate || ''}`],
        ['Generado', new Date().toISOString().slice(0, 10)],
        ['Hojas', 'Diario, Mayor, Estado de resultados, Balance general, Flujo de caja, Impuestos, Plan de cuentas, Asientos manuales, Activos'],
      ],
    },
  ];
  if (journal) sheets.push({ name: 'Diario', rows: journalSheet(journal) });
  if (ledger) sheets.push({ name: 'Mayor y balance', rows: ledgerSheet(ledger) });
  if (financials) {
    sheets.push({ name: 'Estado de resultados', rows: incomeStatementSheet(financials) });
    sheets.push({ name: 'Balance general', rows: balanceSheetSheet(financials) });
    sheets.push({ name: 'Flujo de caja', rows: cashFlowSheet(financials) });
  }
  if (taxSummary) sheets.push({ name: 'Impuestos', rows: taxSheet(taxSummary) });
  if (accounts) sheets.push({ name: 'Plan de cuentas', rows: accountsSheet(accounts) });
  if (entries) sheets.push({ name: 'Asientos manuales', rows: manualEntriesSheet(entries) });
  if (assets) sheets.push({ name: 'Activos', rows: assetsSheet(assets) });
  return sheets;
}

export function packageFilename(company, startDate, endDate) {
  const slug = String(company?.name || 'empresa')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `paquete-contable_${slug}_${startDate}_a_${endDate}.xlsx`;
}
