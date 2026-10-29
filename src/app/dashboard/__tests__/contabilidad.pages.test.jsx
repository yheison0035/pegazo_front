import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Pruebas de humo de TODAS las pantallas de Contabilidad: cada página se
// renderiza con un usuario dueño y las APIs simuladas (formas reales de
// respuesta), y debe mostrar su título sin lanzar errores. Si un módulo deja
// de estar coordinado con otro (nombre de export, forma de dato), falla aquí.

const usuario = {
  id: 1,
  role: 'SUPER_ADMIN',
  company: { id: 90, name: 'Calzado Prueba', nit: '901', type: 'CALZADO', accountingEnabled: true, booksClosedUntil: null },
};
vi.mock('@/context/authContext', () => ({
  useAuth: () => ({ usuario, loading: false, setUsuario: vi.fn() }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/accounting/xlsxIO', () => ({ downloadWorkbook: vi.fn(), readAllSheets: vi.fn(), readSheetRows: vi.fn() }));

const ok = (data) => Promise.resolve({ success: true, data });
const accounts = [
  { id: 1, code: '1105', name: 'CAJA', type: 'ASSET', nature: 'DEBIT', isBase: true, active: true },
  { id: 2, code: '4135', name: 'VENTAS', type: 'INCOME', nature: 'CREDIT', isBase: true, active: true },
];
const financials = {
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  incomeStatement: { income: [{ code: '4135', name: 'VENTAS', value: 100 }], costs: [], expenses: [], totalIncome: 100, totalCosts: 0, totalExpenses: 0, grossProfit: 100, netProfit: 100 },
  balanceSheet: { assets: [{ code: '1105', name: 'CAJA', value: 100 }], liabilities: [], equity: [], retainedResult: 100, totalAssets: 100, totalLiabilities: 0, totalEquity: 100, balanced: true },
  cashFlow: { accounts: [{ code: '1105', name: 'CAJA', in: 100, out: 0, net: 100 }], totalIn: 100, totalOut: 0, net: 100 },
};
const journal = { startDate: '2026-01-01', endDate: '2026-01-31', entries: [{ date: '2026-01-05', type: 'VENTA', ref: 'V-1', description: 'Venta', lines: [{ code: '1105', name: 'CAJA', debit: 100, credit: 0 }, { code: '4135', name: 'VENTAS', debit: 0, credit: 100 }] }], totals: { debit: 100, credit: 100 } };
const ledger = { accounts: [{ code: '1105', name: 'CAJA', type: 'ASSET', debit: 100, credit: 0, balance: 100 }, { code: '4135', name: 'VENTAS', type: 'INCOME', debit: 0, credit: 100, balance: 100 }] };
const calendar = {
  year: 2026, uvt: 52000, regime: 'ORDINARIO', nitDigit: '1',
  deadlines: [
    { id: 1, obligation: 'IVA', title: 'IVA bimestre 1', period: 'Ene-Feb', dueDate: '2026-03-10', daysLeft: 5, status: 'PROXIMO' },
    { id: 2, obligation: 'RENTA', title: 'Renta 2025', period: '', dueDate: '2026-04-20', daysLeft: 40, status: 'PENDIENTE' },
  ],
};
const obligations = {
  engineAvailable: true,
  profile: { personType: 'JURIDICA', taxRegime: 'ORDINARIO', responsableIVA: true },
  magnitudes: { year: 2026, ingresosVentas: 100, patrimonioBruto: 0, retencionesAFavor: 0, anticipoRenta: 0 },
  evaluation: { mustDeclareRenta: true, reasons: ['Persona jurídica'], obligations: [{ code: 'RENTA', label: 'Declaración de renta', frequency: 'ANUAL' }], disclaimer: 'No es consulta en vivo a la DIAN.' },
};
const renta = {
  year: 2026, engineAvailable: true,
  consolidado: { ingresos: 100, costos: 0, gastos: 0, rentaLiquida: 100, patrimonioBruto: 100, patrimonioLiquido: 100 },
  baseGravable: 100, impuestoEstimado: 35, effectiveRate: 0.35, personType: 'JURIDICA', regime: 'ORDINARIO', company: { name: 'Calzado Prueba', nit: '901' },
  retencionesAFavor: 0, anticipoRenta: 0, saldoAPagarEstimado: 35, saldoAFavorEstimado: 0,
};

vi.mock('@/lib/api/routes/tax', () => ({
  getTaxCalendar: vi.fn(() => ok(calendar)),
  getTaxObligations: vi.fn(() => ok(obligations)),
  getTaxProfile: vi.fn(() => ok(obligations.profile)),
  updateTaxProfile: vi.fn(() => ok({})),
  getTaxYear: vi.fn(() => ok(obligations.magnitudes)),
  updateTaxYear: vi.fn(() => ok({})),
  runTaxAlerts: vi.fn(() => ok({ created: 0 })),
  getTaxRenta: vi.fn(() => ok(renta)),
  getTaxAlertPrefs: vi.fn(() => ok({ taxAlertsEnabled: true, taxAlertEmail: false })),
  updateTaxAlertPrefs: vi.fn(() => ok({})),
}));
vi.mock('@/lib/api/routes/accounting', () => ({
  getJournal: vi.fn(() => ok(journal)),
  getLedger: vi.fn(() => ok(ledger)),
  getFinancials: vi.fn(() => ok(financials)),
  getAuxiliary: vi.fn(() => ok({ account: null, movements: [], totals: { debit: 0, credit: 0 } })),
  getTaxSummary: vi.fn(() => ok({ income: 100, iva: { code: '2408', name: 'IVA', debit: 0, credit: 19, balance: 19 } })),
  getEntries: vi.fn(() => ok([])),
  createEntry: vi.fn(() => ok({})),
  updateEntry: vi.fn(() => ok({})),
  deleteEntry: vi.fn(() => ok({})),
  importEntries: vi.fn(() => ok({ total: 0, created: 0, errors: [] })),
  uploadAccountingDoc: vi.fn(() => ok({})),
}));
vi.mock('@/lib/api/routes/ledgerAccounts', () => ({
  getLedgerAccounts: vi.fn(() => ok(accounts)),
  createLedgerAccount: vi.fn(), updateLedgerAccount: vi.fn(), deleteLedgerAccount: vi.fn(), importLedgerAccounts: vi.fn(),
}));
vi.mock('@/lib/api/routes/assets', () => ({
  getAssets: vi.fn(() => Promise.resolve({ success: true, data: [{ id: 1, name: 'PC', category: 'Equipo', acquisitionDate: '2026-01-01', quantity: 1, unitCost: 100, cost: 100, salvageValue: 0, usefulLifeMonths: 12, status: 'ACTIVE', monthlyDepreciation: 8, accumulatedDepreciation: 8, bookValue: 92, monthsElapsed: 1, fullyDepreciated: false }], summary: { count: 1, activeCount: 1, totalCost: 100, totalAccumulated: 8, totalBookValue: 92, monthlyDepreciation: 8 } })),
  createAsset: vi.fn(), updateAsset: vi.fn(), disposeAsset: vi.fn(), deleteAsset: vi.fn(), importAssets: vi.fn(),
}));
vi.mock('@/lib/api/routes/statistics', () => ({
  getTaxReport: vi.fn(() => ok({ startDate: '2026-01-01', endDate: '2026-01-31', ivaGenerado: 19, ivaDescontable: 5, neto: 14, ventas: [], compras: [] })),
}));
vi.mock('@/lib/api/routes/company', () => ({ updateBooksClose: vi.fn(() => ok({ booksClosedUntil: null })) }));

const PAGES = [
  ['Resumen contable', () => import('../resumen-contable/page'), 'Resumen contable'],
  ['Activos', () => import('../assets/page'), 'Activos'],
  ['Plan de cuentas', () => import('../plan-cuentas/page'), /Plan de\s*cuentas/],
  ['Asientos', () => import('../asientos/page'), 'Asientos contables'],
  ['Libros', () => import('../libros/page'), 'Libros contables'],
  ['Estados financieros', () => import('../estados-financieros/page'), /Estados financieros/],
  ['Calendario tributario', () => import('../calendario-tributario/page'), /Calendario\s*tributario/],
  ['Impuestos (IVA)', () => import('../impuestos/page'), 'Reporte de IVA'],
];

describe('Pantallas de Contabilidad (humo)', () => {
  let errors;
  beforeEach(() => {
    errors = [];
    vi.spyOn(console, 'error').mockImplementation((...a) => errors.push(a.map(String).join(' ')));
  });

  for (const [name, load, title] of PAGES) {
    it(`${name} se renderiza con datos reales simulados`, async () => {
      const mod = await load();
      const Page = mod.default;
      render(<Page />);
      await waitFor(() => expect(screen.getAllByText(title).length).toBeGreaterThan(0));
      // Deja resolver las cargas asíncronas y verifica que no haya errores React.
      await new Promise((r) => setTimeout(r, 50));
      const reactErrors = errors.filter((e) => /Error|Warning: .*(undefined|null)|Cannot read|is not a function|not defined/.test(e));
      expect(reactErrors).toEqual([]);
    });
  }
});
