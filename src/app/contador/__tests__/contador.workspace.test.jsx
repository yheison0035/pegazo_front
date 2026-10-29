import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Prueba de humo del portal del contador (workspace de una empresa): recorre
// TODAS las pestañas con las APIs simuladas. Si un proxy cambia de nombre o
// una pestaña deja de estar coordinada con los componentes compartidos
// (asientos, impuestos, renta, calendario), falla aquí.

vi.mock('next/navigation', () => ({
  useParams: () => ({ companyId: '90' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/contador/empresa/90',
}));
vi.mock('next/link', () => ({ default: ({ href, children }) => <a href={href}>{children}</a> }));
vi.mock('@/lib/accounting/xlsxIO', () => ({ downloadWorkbook: vi.fn(), readAllSheets: vi.fn(), readSheetRows: vi.fn() }));

const ok = (data) => Promise.resolve({ success: true, data });
const accounts = [
  { id: 1, code: '1105', name: 'CAJA', type: 'ASSET', nature: 'DEBIT' },
  { id: 2, code: '1110', name: 'BANCOS', type: 'ASSET', nature: 'DEBIT' },
  { id: 3, code: '3115', name: 'CAPITAL', type: 'EQUITY', nature: 'CREDIT' },
  { id: 4, code: '4135', name: 'VENTAS', type: 'INCOME', nature: 'CREDIT' },
];
const financials = {
  incomeStatement: { income: [{ code: '4135', name: 'VENTAS', value: 100 }], costs: [], expenses: [], totalIncome: 100, totalCosts: 0, totalExpenses: 0, grossProfit: 100, netProfit: 100 },
  balanceSheet: { assets: [{ code: '1105', name: 'CAJA', value: 100 }], liabilities: [], equity: [], retainedResult: 100, totalAssets: 100, totalLiabilities: 0, totalEquity: 100, balanced: true },
  cashFlow: { accounts: [{ code: '1105', name: 'CAJA', in: 100, out: 0, net: 100 }], totalIn: 100, totalOut: 0, net: 100 },
};

vi.mock('@/lib/api/routes/accountant', () => ({
  getAccountantPortfolio: vi.fn(() => ok([{ companyId: 90, name: 'Calzado Prueba', nit: '901', booksClosedUntil: null, accountingOnly: false }])),
  getAccCompanyFinancials: vi.fn(() => ok(financials)),
  getAccCompanyJournal: vi.fn(() => ok({ entries: [{ date: '2026-01-05', type: 'VENTA', ref: 'V-1', description: 'Venta', lines: [{ code: '1105', name: 'CAJA', debit: 100, credit: 0 }, { code: '4135', name: 'VENTAS', debit: 0, credit: 100 }] }], totals: { debit: 100, credit: 100 } })),
  getAccCompanyLedger: vi.fn(() => ok({ accounts: [{ code: '1105', name: 'CAJA', type: 'ASSET', debit: 100, credit: 0, balance: 100 }] })),
  getAccCompanyAuxiliary: vi.fn(() => ok({ account: { code: '1105', name: 'CAJA' }, movements: [{ date: '2026-01-05', description: 'Venta', debit: 100, credit: 0, balance: 100 }], totals: { debit: 100, credit: 0, balance: 100 } })),
  getAccCompanyLedgerAccounts: vi.fn(() => ok(accounts)),
  getAccCompanyTaxCalendar: vi.fn(() => ok({ deadlines: [{ id: 1, obligation: 'IVA', title: 'IVA', period: '', dueDate: '2026-03-10', daysLeft: 5, status: 'PROXIMO' }] })),
  getAccCompanyTaxSummary: vi.fn(() => ok({ income: 100, iva: { code: '2408', name: 'IVA', debit: 0, credit: 19, balance: 19 }, retefuente: { code: '2365', name: 'RTE', debit: 0, credit: 0, balance: 0 }, ica: { code: '2412', name: 'ICA', debit: 0, credit: 0, balance: 0 } })),
  setAccCompanyClose: vi.fn(() => ok({ booksClosedUntil: null })),
  getAccCompanyEntries: vi.fn(() => ok([{ id: 1, date: '2026-01-02', description: 'Aporte', reference: null, lines: [{ id: 1, accountCode: '1105', accountName: 'CAJA', debit: 50, credit: 0 }, { id: 2, accountCode: '3115', accountName: 'CAPITAL', debit: 0, credit: 50 }] }])),
  createAccCompanyEntry: vi.fn(() => ok({})),
  updateAccCompanyEntry: vi.fn(() => ok({})),
  deleteAccCompanyEntry: vi.fn(() => ok({})),
  importAccCompanyEntries: vi.fn(() => ok({ total: 0, created: 0, errors: [] })),
  importAccCompanyLedgerAccounts: vi.fn(() => ok({ total: 0, created: 0, updated: 0, errors: [] })),
  uploadAccCompanyDoc: vi.fn(() => ok({})),
  getAccCompanyParties: vi.fn(() => ok([{ id: 1, kind: 'CLIENTE', name: 'Juan', docType: 'CC', docNumber: '1' }])),
  createAccCompanyParty: vi.fn(), updateAccCompanyParty: vi.fn(), deleteAccCompanyParty: vi.fn(),
  getAccCompanyFiscalProfile: vi.fn(() => ok({ personType: 'JURIDICA', taxRegime: 'ORDINARIO' })),
  updateAccCompanyFiscalProfile: vi.fn(() => ok({})),
  getAccCompanyTaxYear: vi.fn(() => ok({ year: 2026 })),
  updateAccCompanyTaxYear: vi.fn(() => ok({})),
  getAccCompanyTaxObligations: vi.fn(() => ok({ engineAvailable: true, profile: { personType: 'JURIDICA', taxRegime: 'ORDINARIO' }, magnitudes: { year: 2026 }, evaluation: { mustDeclareRenta: true, reasons: [], obligations: [], disclaimer: '' } })),
  getAccCompanyRenta: vi.fn(() => ok({ year: 2026, engineAvailable: true, consolidado: { ingresos: 100, costos: 0, gastos: 0, rentaLiquida: 100, patrimonioBruto: 100, patrimonioLiquido: 100 }, baseGravable: 100, impuestoEstimado: 35, effectiveRate: 0.35, retencionesAFavor: 0, anticipoRenta: 0, saldoAPagarEstimado: 35, saldoAFavorEstimado: 0 })),
  getAccCompanyAlertPrefs: vi.fn(() => ok({ taxAlertsEnabled: true, taxAlertEmail: false })),
  updateAccCompanyAlertPrefs: vi.fn(() => ok({})),
}));

const TABS = ['Estados financieros', 'Asientos', 'Terceros', 'Impuestos', 'Renta', 'Conciliación', 'Libros', 'Plan de cuentas', 'Calendario'];

describe('Portal del contador · workspace de empresa (humo)', () => {
  let errors;
  beforeEach(() => {
    errors = [];
    vi.spyOn(console, 'error').mockImplementation((...a) => errors.push(a.map(String).join(' ')));
  });

  it('renderiza la empresa y recorre todas las pestañas sin errores', async () => {
    const mod = await import('../empresa/[companyId]/page');
    const Page = mod.default;
    render(<Page />);
    expect((await screen.findAllByText('Calzado Prueba')).length).toBeGreaterThan(0);
    for (const tab of TABS) {
      const btn = screen.getAllByRole('button', { name: tab }).find((b) => b.closest('div')?.className?.includes('rounded-xl'));
      fireEvent.click(btn || screen.getAllByRole('button', { name: tab })[0]);
      await new Promise((r) => setTimeout(r, 40));
    }
    // Asientos: el panel compartido listó el asiento de prueba.
    fireEvent.click(screen.getAllByRole('button', { name: 'Asientos' })[0]);
    await waitFor(() => expect(screen.getByText('Aporte')).toBeInTheDocument());
    const reactErrors = errors.filter((e) => /Error|Cannot read|is not a function|not defined/.test(e));
    expect(reactErrors).toEqual([]);
  });
});
