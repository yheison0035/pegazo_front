import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  ok,
  fail,
  baseRoutes,
  resetBehavior,
  renderPage,
  settle,
  screen,
  waitFor,
  click,
  typeInto,
  button,
  waitForCall,
  expectToast,
  router,
  money,
} from '@/test/behaviorHarness';
import EstadosPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
vi.mock('@/lib/accounting/xlsxIO', () => ({ downloadWorkbook: vi.fn(), readAllSheets: vi.fn(), readSheetRows: vi.fn() }));

const FINANCIALS = {
  startDate: '2026-02-01',
  endDate: '2026-02-28',
  incomeStatement: {
    income: [{ code: '4135', name: 'COMERCIO', value: 1000000 }],
    costs: [{ code: '6135', name: 'COSTO DE VENTAS', value: 400000 }],
    expenses: [{ code: '5120', name: 'ARRENDAMIENTOS', value: 250000 }],
    totalIncome: 1000000,
    totalCosts: 400000,
    grossProfit: 600000,
    totalExpenses: 250000,
    netProfit: 350000,
  },
  balanceSheet: {
    assets: [{ code: '1105', name: 'CAJA', value: 800000 }, { code: '1305', name: 'CLIENTES', value: 120000 }],
    liabilities: [{ code: '2205', name: 'PROVEEDORES', value: 300000 }],
    equity: [{ code: '3115', name: 'CAPITAL', value: 270000 }],
    retainedResult: 350000,
    totalAssets: 920000,
    totalLiabilities: 300000,
    totalEquity: 620000,
    balanced: true,
  },
  cashFlow: { accounts: [{ code: '1105', name: 'CAJA', in: 1000000, out: 200000, net: 800000 }], totalIn: 1000000, totalOut: 200000, net: 800000 },
};

function statementsApi() {
  return installApi([
    on('GET', /^\/accounting\/financials$/, ok(FINANCIALS)),
    on('GET', /^\/accounting\/journal$/, ok({ entries: [], totals: { debit: 0, credit: 0 } })),
    on('GET', /^\/accounting\/ledger$/, ok({ accounts: [] })),
    ...baseRoutes(),
  ]);
}

describe('Estados financieros', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = statementsApi();
    URL.createObjectURL = vi.fn(() => 'blob:csv');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it('abre en el estado de resultados del mes con ingresos, costos, gastos y utilidad', async () => {
    await renderPage(<EstadosPage />);
    const call = await waitForCall(api, 'GET', /^\/accounting\/financials$/);
    expect(call.query.startDate).toMatch(/^\d{4}-\d{2}-01$/);
    expect(await screen.findByText(/COMERCIO/)).toBeInTheDocument();
    expect(screen.getByText(/ARRENDAMIENTOS/)).toBeInTheDocument();
    expect(screen.getAllByText(money(350000)).length).toBeGreaterThan(0);
  });

  it('el balance general muestra activos, pasivos y patrimonio cuadrados', async () => {
    await renderPage(<EstadosPage />);
    await waitForCall(api, 'GET', /^\/accounting\/financials$/);
    await click(button('Balance general'));
    expect(await screen.findByText(/CLIENTES/)).toBeInTheDocument();
    expect(screen.getByText(/PROVEEDORES/)).toBeInTheDocument();
    expect(screen.getByText('Pasivo + Patrimonio')).toBeInTheDocument();
    expect(screen.getAllByText(money(920000)).length).toBeGreaterThan(0);
  });

  it('el flujo de caja muestra entradas, salidas y neto', async () => {
    await renderPage(<EstadosPage />);
    await waitForCall(api, 'GET', /^\/accounting\/financials$/);
    await click(button('Flujo de caja'));
    expect(await screen.findByText('Entradas')).toBeInTheDocument();
    expect(screen.getByText('Salidas')).toBeInTheDocument();
    expect(screen.getAllByText(money(800000)).length).toBeGreaterThan(0);
  });

  it('cambiar fechas y "Actualizar" vuelve a consultar', async () => {
    await renderPage(<EstadosPage />);
    await waitForCall(api, 'GET', /^\/accounting\/financials$/);
    const dates = document.querySelectorAll('input[type="date"]');
    await typeInto(dates[0], '2026-01-01');
    await typeInto(dates[1], '2026-01-31');
    await click(button(/Actualizar/));
    await waitFor(() => {
      const last = api.last('GET', /^\/accounting\/financials$/);
      expect(last.query).toMatchObject({ startDate: '2026-01-01', endDate: '2026-01-31' });
    });
  });

  it('"Exportar" descarga el estado actual como CSV', async () => {
    await renderPage(<EstadosPage />);
    await waitForCall(api, 'GET', /^\/accounting\/financials$/);
    await screen.findByText(/COMERCIO/);
    await click(screen.getByRole('button', { name: /^Exportar$/ }));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('el contador entra; la caja no', async () => {
    resetBehavior({ role: 'CONTADOR' });
    api = statementsApi();
    await renderPage(<EstadosPage />);
    expect(await screen.findByText(/COMERCIO/)).toBeInTheDocument();
    vi.restoreAllMocks();
    resetBehavior({ role: 'CAJA' });
    statementsApi();
    await renderPage(<EstadosPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
