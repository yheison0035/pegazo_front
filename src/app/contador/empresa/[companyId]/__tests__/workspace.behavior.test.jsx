import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi,
  on,
  ok,
  fail,
  list,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  waitFor,
  click,
  typeInto,
  button,
  placeholder,
  waitForCall,
  money,
} from '@/test/behaviorHarness';
import ContadorEmpresa from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
vi.mock('@/lib/accounting/xlsxIO', () => ({ downloadWorkbook: vi.fn(), readAllSheets: vi.fn(), readSheetRows: vi.fn() }));

const C = 90;
const PORTFOLIO = [{ companyId: C, name: 'NEGOCIO UNO', nit: '901222333', type: 'COMERCIO', accountingOnly: false, booksClosedUntil: null }];
const FIN = {
  incomeStatement: { income: [{ code: '4135', name: 'COMERCIO', value: 1000000 }], costs: [], expenses: [{ code: '5120', name: 'ARRIENDO', value: 250000 }], totalIncome: 1000000, totalCosts: 0, grossProfit: 1000000, totalExpenses: 250000, netProfit: 750000 },
  balanceSheet: { assets: [{ code: '1105', name: 'CAJA', value: 800000 }], liabilities: [{ code: '2205', name: 'PROVEEDORES', value: 200000 }], equity: [{ code: '3115', name: 'CAPITAL', value: 600000 }], retainedResult: 0, totalAssets: 800000, totalLiabilities: 200000, totalEquity: 600000, balanced: true },
  cashFlow: { accounts: [], totalIn: 1000000, totalOut: 200000, net: 800000 },
};
const JOURNAL = { entries: [{ date: '2026-02-10', type: 'VENTA', ref: 'FV-1', description: 'Venta FV-1', lines: [{ code: '1105', name: 'CAJA', debit: 119000, credit: 0 }, { code: '4135', name: 'COMERCIO', debit: 0, credit: 100000 }] }], totals: { debit: 119000, credit: 119000 } };
const LEDGER = { accounts: [{ code: '1105', name: 'CAJA', type: 'ASSET', debit: 119000, credit: 0, balance: 119000 }] };
const ACCOUNTS = [{ id: 1, code: '1105', name: 'CAJA', type: 'ASSET' }, { id: 2, code: '1110', name: 'BANCOS', type: 'ASSET' }];
const AUX = { account: { code: '1105', name: 'CAJA' }, movements: [{ date: '2026-02-10', description: 'Venta FV-1', debit: 119000, credit: 0, balance: 119000 }], totals: { debit: 119000, credit: 0, balance: 119000 } };
const CALENDAR = { deadlines: [{ id: 1, obligation: 'IVA', title: 'IVA Bimestre 1', period: 'Bim 1', dueDate: '2026-03-10', daysLeft: 12 }] };
const TAX_SUMMARY = { income: 1000000, iva: { balance: 190000, credit: 190000, debit: 0 }, retefuente: { balance: 0, credit: 0, debit: 0 }, ica: { balance: 0, credit: 0, debit: 0 } };
const PARTIES = [{ id: 7, kind: 'CLIENTE', name: 'Cliente Uno', docType: 'CC', docNumber: '123', email: 'c@uno.test', phone: '300', address: '' }];

function wsApi() {
  return installApi([
    on('GET', /^\/accountant\/portfolio$/, ok(PORTFOLIO)),
    on('GET', new RegExp(`^/accountant/companies/${C}/financials$`), ok(FIN)),
    on('GET', new RegExp(`^/accountant/companies/${C}/journal$`), ok(JOURNAL)),
    on('GET', new RegExp(`^/accountant/companies/${C}/ledger$`), ok(LEDGER)),
    on('GET', new RegExp(`^/accountant/companies/${C}/ledger-accounts$`), ok(ACCOUNTS)),
    on('GET', new RegExp(`^/accountant/companies/${C}/auxiliary$`), ok(AUX)),
    on('GET', new RegExp(`^/accountant/companies/${C}/tax-calendar$`), ok(CALENDAR)),
    on('GET', new RegExp(`^/accountant/companies/${C}/tax-summary$`), ok(TAX_SUMMARY)),
    on('GET', new RegExp(`^/accountant/companies/${C}/parties$`), ok(PARTIES)),
    on('POST', new RegExp(`^/accountant/companies/${C}/parties$`), ok({ id: 8 })),
    on('PATCH', new RegExp(`^/accountant/companies/${C}/parties/\\d+$`), ok({})),
    on('DELETE', new RegExp(`^/accountant/companies/${C}/parties/\\d+$`), ok({})),
    on('GET', new RegExp(`^/accountant/companies/${C}/entries$`), list([])),
    ...baseRoutes(),
  ]);
}

describe('Portal del contador · empresa (workspace)', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'CONTADOR' });
    api = wsApi();
    URL.createObjectURL = vi.fn(() => 'blob:csv');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it('abre en estados financieros con el nombre de la empresa y la utilidad', async () => {
    await renderPage(<ContadorEmpresa />);
    await waitForCall(api, 'GET', /\/financials$/);
    expect(await screen.findByRole('heading', { name: 'NEGOCIO UNO' })).toBeInTheDocument();
    expect(await screen.findByText('4135 · COMERCIO')).toBeInTheDocument();
    expect(screen.getByText(money(750000))).toBeInTheDocument();
    expect(screen.getByText('Mis empresas').closest('a')).toHaveAttribute('href', '/contador');
  });

  it('las pestañas de estados cambian a balance y flujo', async () => {
    await renderPage(<ContadorEmpresa />);
    await screen.findByText('4135 · COMERCIO');
    await click(button('Balance'));
    expect(await screen.findByText('1105 · CAJA')).toBeInTheDocument();
    expect(screen.getByText('Pasivo + Patrimonio')).toBeInTheDocument();
    await click(button('Flujo'));
    expect(await screen.findByText('Entradas')).toBeInTheDocument();
    expect(screen.getByText(money(800000))).toBeInTheDocument();
  });

  it('cambiar el rango de fechas vuelve a consultar', async () => {
    await renderPage(<ContadorEmpresa />);
    await waitForCall(api, 'GET', /\/financials$/);
    const dates = document.querySelectorAll('input[type="date"]');
    await typeInto(dates[0], '2026-01-01');
    await waitFor(() => expect(api.last('GET', /\/financials$/).query.startDate).toBe('2026-01-01'));
  });

  it('en Libros muestra diario, mayor y auxiliar por cuenta', async () => {
    await renderPage(<ContadorEmpresa />);
    await screen.findByText('4135 · COMERCIO');
    await click(button('Libros'));
    await waitForCall(api, 'GET', /\/journal$/);
    expect(await screen.findByText('Venta FV-1')).toBeInTheDocument();
    await click(button('Libro mayor'));
    await waitForCall(api, 'GET', /\/ledger$/);
    expect(await screen.findByText('CAJA')).toBeInTheDocument();
    await click(button('Auxiliar'));
    await waitForCall(api, 'GET', /\/ledger-accounts$/);
    const accSelect = [...document.querySelectorAll('select')].find((s) => [...s.options].some((o) => o.value === '1105'));
    await typeInto(accSelect, '1105');
    const call = await waitForCall(api, 'GET', /\/auxiliary$/);
    expect(call.query.account).toBe('1105');
    expect(await screen.findByText('Venta FV-1')).toBeInTheDocument();
  });

  it('exporta el diario a CSV', async () => {
    await renderPage(<ContadorEmpresa />);
    await screen.findByText('4135 · COMERCIO');
    await click(button('Libros'));
    await screen.findByText('Venta FV-1');
    await click(button(/^Exportar$/));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('el Plan de cuentas lista las cuentas agrupadas', async () => {
    await renderPage(<ContadorEmpresa />);
    await screen.findByText('4135 · COMERCIO');
    await click(button('Plan de cuentas'));
    await waitForCall(api, 'GET', /\/ledger-accounts$/);
    expect(await screen.findByText('BANCOS')).toBeInTheDocument();
  });

  it('el Calendario muestra los vencimientos de la empresa', async () => {
    await renderPage(<ContadorEmpresa />);
    await screen.findByText('4135 · COMERCIO');
    await click(button('Calendario'));
    await waitForCall(api, 'GET', /\/tax-calendar$/);
    expect(await screen.findByText('IVA Bimestre 1')).toBeInTheDocument();
  });

  it('Impuestos muestra el resumen de IVA, retención e ICA del periodo', async () => {
    await renderPage(<ContadorEmpresa />);
    await screen.findByText('4135 · COMERCIO');
    await click(button('Impuestos'));
    await waitForCall(api, 'GET', /\/tax-summary$/);
    expect(await screen.findByText('Ingresos del periodo')).toBeInTheDocument();
    expect(screen.getByText(money(190000))).toBeInTheDocument();
  });

  it('Terceros: lista, crea, edita y elimina', async () => {
    await renderPage(<ContadorEmpresa />);
    await screen.findByText('4135 · COMERCIO');
    await click(button('Terceros'));
    await waitForCall(api, 'GET', /\/parties$/);
    expect(await screen.findByText('Cliente Uno')).toBeInTheDocument();
    await click(button(/Nuevo tercero/));
    const heading = await screen.findByRole('heading', { name: 'Nuevo tercero' });
    const modal = within(heading.closest('.fixed'));
    await typeInto(modal.getAllByRole('textbox')[0], 'Proveedor Dos');
    await click(button('Guardar'));
    const call = await waitForCall(api, 'POST', /\/parties$/);
    expect(call.body).toMatchObject({ kind: 'CLIENTE', name: 'Proveedor Dos' });
    await waitForCall(api, 'GET', /\/parties$/, { count: 2 });
    const row = screen.getByText('Cliente Uno').closest('tr');
    await click(row.querySelectorAll('button')[0]);
    expect(await screen.findByText('Editar tercero')).toBeInTheDocument();
    await click(button('Guardar'));
    await waitForCall(api, 'PATCH', /\/parties\/7$/);
    await click(screen.getByText('Cliente Uno').closest('tr').querySelectorAll('button')[1]);
    await waitForCall(api, 'DELETE', /\/parties\/7$/);
  });

  it('los Asientos manuales montan el panel y cargan los existentes', async () => {
    await renderPage(<ContadorEmpresa />);
    await screen.findByText('4135 · COMERCIO');
    await click(button('Asientos'));
    await waitForCall(api, 'GET', /\/entries$/);
    expect(await screen.findByRole('button', { name: /Nuevo asiento/ })).toBeInTheDocument();
  });

  it('un error del backend al cargar estados se avisa', async () => {
    api.set('GET', new RegExp(`^/accountant/companies/${C}/financials$`), fail(400, 'Sin permiso'));
    await renderPage(<ContadorEmpresa />);
    await waitForCall(api, 'GET', /\/financials$/);
    expect(await screen.findByText('Sin permiso')).toBeInTheDocument();
  });
});
