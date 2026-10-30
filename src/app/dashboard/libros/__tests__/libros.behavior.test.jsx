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
import LibrosPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
vi.mock('@/lib/accounting/xlsxIO', () => ({ downloadWorkbook: vi.fn(), readAllSheets: vi.fn(), readSheetRows: vi.fn() }));

const JOURNAL = {
  entries: [
    { id: 1, date: '2026-02-10T10:00:00.000Z', type: 'VENTA', description: 'Venta FV-0001', reference: 'FV-0001', lines: [{ code: '1105', name: 'CAJA', debit: 119000, credit: 0 }, { code: '4135', name: 'COMERCIO', debit: 0, credit: 100000 }, { code: '2408', name: 'IVA', debit: 0, credit: 19000 }] },
    { id: 2, date: '2026-02-11T10:00:00.000Z', type: 'GASTO', description: 'Arriendo febrero', reference: '', lines: [{ code: '5120', name: 'ARRENDAMIENTOS', debit: 1200000, credit: 0 }, { code: '1110', name: 'BANCOS', debit: 0, credit: 1200000 }] },
  ],
  totals: { debit: 1319000, credit: 1319000 },
};
const LEDGER = { accounts: [
  { code: '1105', name: 'CAJA', type: 'ASSET', debit: 119000, credit: 0, balance: 119000 },
  { code: '4135', name: 'COMERCIO', type: 'INCOME', debit: 0, credit: 100000, balance: 100000 },
  { code: '2408', name: 'IVA', type: 'LIABILITY', debit: 0, credit: 19000, balance: 19000 },
] };
const AUX = { account: { code: '1105', name: 'CAJA' }, movements: [{ id: 1, date: '2026-02-10', description: 'Venta FV-0001', debit: 119000, credit: 0, balance: 119000 }], totals: { debit: 119000, credit: 0 } };

function librosApi() {
  return installApi([
    on('GET', /^\/accounting\/journal$/, ok(JOURNAL)),
    on('GET', /^\/accounting\/ledger$/, ok(LEDGER)),
    on('GET', /^\/accounting\/auxiliary$/, ok(AUX)),
    on('GET', /^\/ledger-accounts$/, ok([{ id: 1, code: '1105', name: 'CAJA', type: 'ASSET' }, { id: 2, code: '1110', name: 'BANCOS', type: 'ASSET' }])),
    ...baseRoutes(),
  ]);
}

describe('Libros contables', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = librosApi();
    URL.createObjectURL = vi.fn(() => 'blob:csv');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it('abre en el libro diario del mes con sus asientos y totales', async () => {
    await renderPage(<LibrosPage />);
    const call = await waitForCall(api, 'GET', /^\/accounting\/journal$/);
    expect(call.query.startDate).toMatch(/^\d{4}-\d{2}-01$/);
    expect(call.query.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(await screen.findByText('Venta FV-0001')).toBeInTheDocument();
    expect(screen.getByText('Arriendo febrero')).toBeInTheDocument();
    // Los totales se muestran sin símbolo de moneda.
    expect(screen.getByText(/Débitos:/).textContent).toContain('1.319.000');
  });

  it('cambiar el rango de fechas vuelve a consultar', async () => {
    await renderPage(<LibrosPage />);
    await waitForCall(api, 'GET', /^\/accounting\/journal$/);
    const dates = document.querySelectorAll('input[type="date"]');
    await typeInto(dates[0], '2026-01-01');
    const call = await waitForCall(api, 'GET', /^\/accounting\/journal$/, { count: 2 });
    expect(call.query.startDate).toBe('2026-01-01');
    await click(button(/Actualizar/));
    await waitForCall(api, 'GET', /^\/accounting\/journal$/, { count: 3 });
  });

  it('el libro mayor y el balance de prueba consultan el mayor y muestran el cuadre', async () => {
    await renderPage(<LibrosPage />);
    await waitForCall(api, 'GET', /^\/accounting\/journal$/);
    await click(button('Libro mayor'));
    await waitForCall(api, 'GET', /^\/accounting\/ledger$/);
    expect(await screen.findByText('CAJA')).toBeInTheDocument();
    await click(button('Balance de prueba'));
    await waitFor(() => expect(screen.getByText(/Totales/)).toBeInTheDocument());
    expect(screen.getByText(/cuadra/)).toBeInTheDocument();
  });

  it('el auxiliar pide elegir la cuenta y muestra el saldo corrido', async () => {
    await renderPage(<LibrosPage />);
    await waitForCall(api, 'GET', /^\/accounting\/journal$/);
    await click(button('Auxiliar'));
    await waitForCall(api, 'GET', /^\/ledger-accounts$/);
    const select = await screen.findByDisplayValue('Elige una cuenta…');
    await typeInto(select, '1105');
    const call = await waitForCall(api, 'GET', /^\/accounting\/auxiliary$/);
    expect(call.query).toMatchObject({ account: '1105' });
    expect(await screen.findByText('Venta FV-0001')).toBeInTheDocument();
  });

  it('"Exportar a Excel" descarga el libro actual como CSV', async () => {
    await renderPage(<LibrosPage />);
    await waitForCall(api, 'GET', /^\/accounting\/journal$/);
    await screen.findByText('Venta FV-0001');
    await click(button(/Exportar a Excel/));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blob = URL.createObjectURL.mock.calls[0][0];
    expect(blob.type).toContain('text/csv');
  });

  it('un error del backend al cargar se avisa', async () => {
    api.set('GET', /^\/accounting\/journal$/, fail(400, 'Error interno'));
    await renderPage(<LibrosPage />);
    await waitForCall(api, 'GET', /^\/accounting\/journal$/);
    await expectToast('error', 'Error interno');
  });

  it('el contador entra; la caja no', async () => {
    resetBehavior({ role: 'CONTADOR' });
    api = librosApi();
    await renderPage(<LibrosPage />);
    expect(await screen.findByText('Venta FV-0001')).toBeInTheDocument();
    vi.restoreAllMocks();
    resetBehavior({ role: 'CAJA' });
    librosApi();
    await renderPage(<LibrosPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
