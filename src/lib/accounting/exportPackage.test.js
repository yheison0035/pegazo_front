import { describe, it, expect } from 'vitest';
import { buildPackageSheets, journalSheet, ledgerSheet, balanceSheetSheet, packageFilename } from './exportPackage';

const fin = {
  incomeStatement: { income: [{ code: '4135', name: 'VENTAS', value: 100 }], costs: [], expenses: [{ code: '5105', name: 'GASTOS', value: 40 }], totalIncome: 100, totalCosts: 0, totalExpenses: 40, grossProfit: 100, netProfit: 60 },
  balanceSheet: { assets: [{ code: '1105', name: 'CAJA', value: 60 }], liabilities: [], equity: [], retainedResult: 60, totalAssets: 60, totalLiabilities: 0, totalEquity: 60, balanced: true },
  cashFlow: { accounts: [{ code: '1105', name: 'CAJA', in: 100, out: 40, net: 60 }], totalIn: 100, totalOut: 40, net: 60 },
};

describe('exportPackage', () => {
  it('diario: una fila por línea + totales', () => {
    const rows = journalSheet({
      entries: [{ date: '2026-01-05T00:00:00.000Z', type: 'VENTA', ref: 'V-1', description: 'Venta', lines: [{ code: '1105', name: 'CAJA', debit: 100, credit: 0 }, { code: '4135', name: 'VENTAS', debit: 0, credit: 100 }] }],
      totals: { debit: 100, credit: 100 },
    });
    expect(rows).toHaveLength(4);
    expect(rows[1]).toEqual(['2026-01-05', 'VENTA', 'V-1', 'Venta', '1105', 'CAJA', 100, '']);
    expect(rows[3]).toEqual(['', '', '', 'TOTALES', '', '', 100, 100]);
  });

  it('mayor: totales y verificación de cuadre', () => {
    const rows = ledgerSheet({ accounts: [{ code: '1105', name: 'CAJA', type: 'ASSET', debit: 100, credit: 40, balance: 60 }, { code: '4135', name: 'VENTAS', type: 'INCOME', debit: 0, credit: 100, balance: 100 }, { code: '5105', name: 'G', type: 'EXPENSE', debit: 40, credit: 0, balance: 40 }] });
    expect(rows[rows.length - 1]).toEqual(['', 'TOTALES', 'Cuadra', 140, 140, '']);
  });

  it('balance general: incluye resultado acumulado y cuadre', () => {
    const rows = balanceSheetSheet(fin);
    expect(rows).toContainEqual(['Resultado acumulado', '', 60]);
    expect(rows[rows.length - 1]).toEqual(['Cuadra', '', 'Sí']);
  });

  it('arma solo las hojas de las fuentes disponibles', () => {
    const sheets = buildPackageSheets({ company: { name: 'Mi Tienda', nit: '900' }, startDate: '2026-01-01', endDate: '2026-01-31', financials: fin, accounts: [{ code: '1105', name: 'CAJA', type: 'ASSET', nature: 'DEBIT' }] });
    expect(sheets.map((s) => s.name)).toEqual(['Resumen', 'Estado de resultados', 'Balance general', 'Flujo de caja', 'Plan de cuentas']);
    expect(sheets[0].rows[0]).toEqual(['Empresa', 'Mi Tienda']);
    expect(sheets[4].rows[1]).toEqual(['1105', 'CAJA', 'Activo', 'Débito', 'Sí']);
  });

  it('nombre de archivo sin tildes ni espacios', () => {
    expect(packageFilename({ name: 'Panadería El Buen Pan' }, '2026-01-01', '2026-01-31')).toBe('paquete-contable_panaderia-el-buen-pan_2026-01-01_a_2026-01-31.xlsx');
  });
});
