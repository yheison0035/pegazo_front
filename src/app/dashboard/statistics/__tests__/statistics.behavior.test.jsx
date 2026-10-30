import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  list,
  ok,
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
  router,
  money,
} from '@/test/behaviorHarness';
import StatisticsPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
const csvMock = vi.hoisted(() => ({ exportCSV: vi.fn(), csvNum: (n) => Number(n) || 0 }));
vi.mock('@/components/dashboard/statistics/exportUtils', () => csvMock);
// Recharts mide el contenedor con ResizeObserver: en jsdom dibuja vacío, basta con que no rompa.
// Las gráficas hacen lento el render: con la suite completa en paralelo supera los 5 s por defecto.
vi.setConfig({ testTimeout: 20000 });

const DASHBOARD = {
  range: { startDate: '2026-02-01', endDate: '2026-02-28' },
  summary: { totalSales: 1250000, salesCount: 42, avgTicket: 29762, costOfGoods: 600000, grossMargin: 650000, totalExpenses: 300000, profit: 350000, newCustomers: 7, deltas: { totalSales: 12, salesCount: 5, avgTicket: 3, totalExpenses: -4, profit: 20, newCustomers: 1 } },
  series: [{ date: '2026-02-01', sales: 100000, expenses: 20000 }],
  paymentMethods: [{ method: 'EFECTIVO', total: 800000, count: 30 }],
  byLocal: [{ localId: 1, name: 'Sede Centro', total: 1250000 }],
  expensesByType: [{ type: 'ARRIENDO', total: 200000 }],
  expensesDetail: [{ id: 1, concept: 'Arriendo', type: 'ARRIENDO', amount: 200000, expenseDate: '2026-02-05', paidAt: '2026-02-05' }],
  topProducts: [{ name: 'CAMISETA BÁSICA', quantity: 20, total: 500000 }],
  topServices: [],
  topSellers: [{ name: 'Dueño Prueba', total: 1250000, count: 42 }],
  topCustomers: [{ name: 'ANA PÉREZ', total: 300000, count: 5 }],
  productProfit: [{ name: 'CAMISETA BÁSICA', revenue: 500000, cost: 240000, profit: 260000 }],
  receivables: { total: 0, count: 0, buckets: [] },
};

function statsApi() {
  return installApi([
    on('POST', /^\/statistics\/dashboard$/, ok(DASHBOARD)),
    on('GET', /^\/statistics\/movements$/, ok([{ date: '2026-02-01', type: 'VENTA', concept: 'FV-0001', amount: 100000 }])),
    on('POST', /^\/statistics\/compare$/, ok({ months: [] })),
    on('POST', /^\/statistics\/annual$/, ok({ months: [] })),
    on('POST', /^\/statistics\/inventory-valuation$/, ok({ items: [], totals: {} })),
    ...baseRoutes(),
  ]);
}

describe('Estadísticas', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = statsApi();
    csvMock.exportCSV.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('consulta el tablero con el rango y muestra los indicadores', async () => {
    await renderPage(<StatisticsPage />);
    const call = await waitForCall(api, 'POST', /^\/statistics\/dashboard$/);
    expect(call.body).toMatchObject({ basis: expect.any(String) });
    expect(await screen.findAllByText(money(1250000))).toBeTruthy();
    expect(screen.getByText('Ventas')).toBeInTheDocument();
    expect(screen.getByText('Utilidad/Ganancia')).toBeInTheDocument();
    expect(screen.getAllByText(money(350000)).length).toBeGreaterThan(0);
  });

  it('cambiar fechas, sede y "Aplicar" vuelve a consultar con esos filtros', async () => {
    await renderPage(<StatisticsPage />);
    await waitForCall(api, 'POST', /^\/statistics\/dashboard$/);
    await waitForCall(api, 'GET', /^\/locals$/);
    const dates = document.querySelectorAll('input[type="date"]');
    await typeInto(dates[0], '2026-01-01');
    await typeInto(dates[1], '2026-01-31');
    await typeInto(await screen.findByDisplayValue('Todas las sedes'), '2');
    await click(button('Aplicar'));
    await waitFor(() => {
      const last = api.last('POST', /^\/statistics\/dashboard$/);
      expect(last.body).toMatchObject({ startDate: '2026-01-01', endDate: '2026-01-31', localId: '2' });
    });
  });

  it('los atajos de rango ("Mes pasado") consultan ese periodo', async () => {
    await renderPage(<StatisticsPage />);
    await waitForCall(api, 'POST', /^\/statistics\/dashboard$/);
    const n = api.count('POST', /^\/statistics\/dashboard$/);
    await click(button('Mes pasado'));
    await waitFor(() => expect(api.count('POST', /^\/statistics\/dashboard$/)).toBeGreaterThan(n));
    const last = api.last('POST', /^\/statistics\/dashboard$/);
    expect(last.body.startDate).toMatch(/^\d{4}-\d{2}-01$/);
    expect(last.body.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('exporta el resumen y el libro de movimientos a Excel', async () => {
    await renderPage(<StatisticsPage />);
    await waitForCall(api, 'POST', /^\/statistics\/dashboard$/);
    await screen.findByText('Ventas');
    await click(button('Excel'));
    expect(csvMock.exportCSV).toHaveBeenCalledWith('Pegazo-resumen', expect.any(Array));
    const rows = csvMock.exportCSV.mock.calls[0][1];
    expect(rows.some((r) => r[0] === 'Ventas' && r[1] === 1250000)).toBe(true);
    expect(rows.some((r) => r[0] === 'Utilidad neta' && r[1] === 350000)).toBe(true);

    await click(button('Libro contable'));
    await waitForCall(api, 'GET', /^\/statistics\/movements$/);
    await waitFor(() => expect(csvMock.exportCSV).toHaveBeenCalledWith('Pegazo-libro-movimientos', expect.any(Array)));
  });

  it('la pestaña Gastos exporta el detalle de gastos', async () => {
    await renderPage(<StatisticsPage />);
    await waitForCall(api, 'POST', /^\/statistics\/dashboard$/);
    await click(button('Gastos'));
    expect((await screen.findAllByText('Arriendo')).length).toBeGreaterThan(0);
    await click(button('Excel'));
    expect(csvMock.exportCSV).toHaveBeenCalledWith('Pegazo-gastos', expect.any(Array));
  });

  it('las demás pestañas consultan sus propios reportes', async () => {
    await renderPage(<StatisticsPage />);
    await waitForCall(api, 'POST', /^\/statistics\/dashboard$/);
    await click(button('Comparar meses'));
    await waitForCall(api, 'POST', /^\/statistics\/compare$/);
    await click(button('Anual'));
    await waitForCall(api, 'POST', /^\/statistics\/annual$/);
    await click(button('Inventario'));
    await waitForCall(api, 'POST', /^\/statistics\/inventory-valuation$/);
    await click(button('Impuestos'));
    await waitForCall(api, 'POST', /^\/statistics\/tax-report$/);
  });

  it('el barbero no entra a estadísticas', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    statsApi();
    await renderPage(<StatisticsPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
