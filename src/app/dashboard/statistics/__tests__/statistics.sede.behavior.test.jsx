import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  ok,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  click,
  waitForCall,
} from '@/test/behaviorHarness';
import StatisticsPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
// El dueño tiene una sede activa en el selector global: TODO el módulo debe
// acotarse a esa sede (localId = '2').
vi.mock('@/context/localScopeContext', () => ({
  useLocalScope: () => ({
    activeLocal: '2',
    setActiveLocal: () => {},
    locals: [{ id: 1, name: 'Sede Centro' }, { id: 2, name: 'Sede Norte' }],
    multi: true,
  }),
}));
const csvMock = vi.hoisted(() => ({ exportCSV: vi.fn(), csvNum: (n) => Number(n) || 0 }));
vi.mock('@/components/dashboard/statistics/exportUtils', () => csvMock);
vi.setConfig({ testTimeout: 20000 });

const DASHBOARD = {
  range: { startDate: '2026-02-01', endDate: '2026-02-28' },
  summary: { totalSales: 1, salesCount: 1, avgTicket: 1, costOfGoods: 0, grossMargin: 1, grossMarginPct: 100, totalExpenses: 0, profit: 1, newCustomers: 0, deltas: { totalSales: 0, salesCount: 0, avgTicket: 0, totalExpenses: 0, profit: 0, newCustomers: 0 } },
  series: [], paymentMethods: [], byLocal: [], expensesByType: [], expensesDetail: [],
  topProducts: [], topServices: [], topSellers: [], topCustomers: [], productProfit: [],
  receivables: { total: 0, count: 0, items: [] },
};

function statsApi() {
  return installApi([
    on('POST', /^\/statistics\/dashboard$/, ok(DASHBOARD)),
    on('POST', /^\/statistics\/tax-report$/, ok({ range: { startDate: '2026-02-01', endDate: '2026-02-28' }, iva: { generado: 0, descontable: 0, neto: 0, aPagar: 0, aFavor: 0 }, ventas: { base: 0, iva: 0, total: 0, count: 0 }, compras: { base: 0, iva: 0, total: 0, count: 0 } })),
    on('POST', /^\/statistics\/inventory-valuation$/, ok({ items: [], totals: {} })),
    ...baseRoutes(),
  ]);
}

describe('Estadísticas · filtrado por sede del dueño', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = statsApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('el Resumen (dashboard) se consulta con la sede activa', async () => {
    await renderPage(<StatisticsPage />);
    const call = await waitForCall(api, 'POST', /^\/statistics\/dashboard$/);
    expect(call.body).toMatchObject({ localId: '2' });
  });

  it('Impuestos (IVA) se consulta con la sede activa', async () => {
    await renderPage(<StatisticsPage />);
    await waitForCall(api, 'POST', /^\/statistics\/dashboard$/);
    await click(screen.getByRole('button', { name: 'Impuestos' }));
    const call = await waitForCall(api, 'POST', /^\/statistics\/tax-report$/);
    expect(call.body).toMatchObject({ localId: '2' });
  });

  it('Inventario valorizado se consulta con la sede activa', async () => {
    await renderPage(<StatisticsPage />);
    await waitForCall(api, 'POST', /^\/statistics\/dashboard$/);
    await click(screen.getByRole('button', { name: 'Inventario' }));
    const call = await waitForCall(api, 'POST', /^\/statistics\/inventory-valuation$/);
    expect(call.body).toMatchObject({ localId: '2' });
  });
});
