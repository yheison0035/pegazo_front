import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  ok,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  waitFor,
  click,
  waitForCall,
  router,
  money,
} from '@/test/behaviorHarness';
import ResumenPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
const csvMock = vi.hoisted(() => ({ downloadCsv: vi.fn() }));
vi.mock('@/utils/exportCsv', () => csvMock);

const FIN = {
  startDate: '2026-02-01',
  endDate: '2026-02-28',
  incomeStatement: { income: [], costs: [], expenses: [], totalIncome: 1000000, totalCosts: 400000, grossProfit: 600000, totalExpenses: 250000, netProfit: 350000 },
  balanceSheet: { assets: [{ code: '1105', name: 'CAJA', value: 800000 }, { code: '1305', name: 'CLIENTES', value: 120000 }], liabilities: [{ code: '2205', name: 'PROVEEDORES', value: 300000 }], equity: [], retainedResult: 350000, totalAssets: 920000, totalLiabilities: 300000, totalEquity: 620000, balanced: true },
  cashFlow: { accounts: [], totalIn: 0, totalOut: 0, net: 0 },
};
const CAL = { year: 2026, uvt: 52374, regime: 'ORDINARIO', nitDigit: '4', deadlines: [{ id: 1, obligation: 'IVA', period: 'Bimestre 1', title: 'Declaración de IVA bimestre 1', dueDate: '2026-03-10', daysLeft: 12, status: 'PROXIMO', notes: '' }] };

function resumenApi() {
  return installApi([
    on('GET', /^\/accounting\/financials$/, ok(FIN)),
    on('GET', /^\/tax\/calendar$/, ok(CAL)),
    ...baseRoutes(),
  ]);
}

describe('Resumen contable', () => {
  afterEach(() => vi.restoreAllMocks());

  it('muestra utilidad del mes, cartera, proveedores y próximos vencimientos', async () => {
    resetBehavior();
    const api = resumenApi();
    await renderPage(<ResumenPage />);
    await waitForCall(api, 'GET', /^\/accounting\/financials$/);
    await waitForCall(api, 'GET', /^\/tax\/calendar$/);
    expect(await screen.findByText('Utilidad del mes')).toBeInTheDocument();
    expect(screen.getAllByText(money(350000)).length).toBeGreaterThan(0);
    expect(screen.getByText('Te deben (cartera)')).toBeInTheDocument();
    expect(screen.getAllByText(money(120000)).length).toBeGreaterThan(0);
    expect(screen.getByText('Debes a proveedores')).toBeInTheDocument();
    expect(screen.getAllByText(money(300000)).length).toBeGreaterThan(0);
    expect(screen.getByText('Próximos vencimientos')).toBeInTheDocument();
    expect(screen.getByText('Declaración de IVA bimestre 1')).toBeInTheDocument();
  });

  it('exporta el resumen a CSV', async () => {
    resetBehavior();
    const api = resumenApi();
    await renderPage(<ResumenPage />);
    await screen.findByText('Utilidad del mes');
    await click(screen.getByRole('button', { name: /Exportar/ }));
    await waitFor(() => expect(csvMock.downloadCsv).toHaveBeenCalledTimes(1));
  });

  it('solo dueño y administrador entran', async () => {
    resetBehavior({ role: 'CONTADOR' });
    resumenApi();
    await renderPage(<ResumenPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
