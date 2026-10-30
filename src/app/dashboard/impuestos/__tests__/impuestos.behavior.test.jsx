import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
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
import ImpuestosPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
const csvMock = vi.hoisted(() => ({ downloadCsv: vi.fn() }));
vi.mock('@/utils/exportCsv', () => csvMock);

const REPORT = (neto) => ({
  range: { startDate: '2026-02-01', endDate: '2026-02-28' },
  iva: { generado: 190000, descontable: 190000 - neto, neto },
  ventas: { base: 1000000, iva: 190000, total: 1190000, count: 12 },
  compras: { base: 500000, iva: 95000, total: 595000, count: 4 },
});

function taxesApi(neto = 95000) {
  return installApi([
    on('POST', /^\/statistics\/tax-report$/, ok(REPORT(neto))),
    ...baseRoutes(),
  ]);
}

describe('Impuestos (IVA del periodo)', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = taxesApi();
    csvMock.downloadCsv.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('consulta el periodo actual y muestra IVA generado, descontable y el neto a pagar', async () => {
    await renderPage(<ImpuestosPage />);
    const call = await waitForCall(api, 'POST', /^\/statistics\/tax-report$/);
    expect(call.body.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(call.body.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(await screen.findByText('IVA generado (ventas)')).toBeInTheDocument();
    expect(screen.getByText('IVA descontable (compras)')).toBeInTheDocument();
    expect(screen.getAllByText(money(95000)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(money(1190000)).length).toBeGreaterThan(0);
  });

  it('cambiar fechas y "Consultar" vuelve a pedir el reporte con el rango nuevo', async () => {
    await renderPage(<ImpuestosPage />);
    await waitForCall(api, 'POST', /^\/statistics\/tax-report$/);
    const dates = document.querySelectorAll('input[type="date"]');
    await typeInto(dates[0], '2026-01-01');
    await typeInto(dates[1], '2026-01-31');
    await click(button('Consultar'));
    const call = await waitForCall(api, 'POST', /^\/statistics\/tax-report$/, { count: 2 });
    expect(call.body).toEqual({ startDate: '2026-01-01', endDate: '2026-01-31' });
  });

  it('con IVA descontable mayor al generado, muestra saldo a favor', async () => {
    api = taxesApi(-40000);
    await renderPage(<ImpuestosPage />);
    await waitForCall(api, 'POST', /^\/statistics\/tax-report$/);
    await screen.findByText('IVA generado (ventas)');
    expect(screen.getAllByText(money(40000)).length).toBeGreaterThan(0);
    expect(screen.queryByText('IVA neto del periodo')).toBeNull();
  });

  it('exporta el reporte a CSV', async () => {
    await renderPage(<ImpuestosPage />);
    await waitForCall(api, 'POST', /^\/statistics\/tax-report$/);
    await screen.findByText('IVA generado (ventas)');
    await click(screen.getByRole('button', { name: /Exportar/ }));
    await waitFor(() => expect(csvMock.downloadCsv).toHaveBeenCalledTimes(1));
    expect(csvMock.downloadCsv.mock.calls[0][0]).toBe('impuestos-iva.csv');
  });

  it('solo dueño y administrador entran', async () => {
    resetBehavior({ role: 'CONTADOR' });
    taxesApi();
    await renderPage(<ImpuestosPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
