import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi,
  on,
  detail,
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
  placeholder,
  waitForCall,
  expectToast,
  router,
  money,
} from '@/test/behaviorHarness';
import CarteraPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
vi.mock('@/utils/printInvoice', () => ({ printSaleInvoice: vi.fn(), printCustodyTicket: vi.fn() }));

const ROWS = [
  { id: 1, code: 'FV-0001', customer: { id: 1, name: 'ANA PÉREZ', document: '1001', phone: '3001234567' }, saleDate: '2026-02-01T15:00:00.000Z', dueDate: '2026-02-15T00:00:00.000Z', overdueDays: 10, total: 100000, paid: 40000, saldo: 60000, status: 'FIADO' },
  { id: 2, code: 'FV-0002', customer: { id: 2, name: 'EMPRESA SAS', document: '900123', phone: '3109876543' }, saleDate: '2026-02-05T15:00:00.000Z', dueDate: null, overdueDays: 0, total: 50000, paid: 0, saldo: 50000, status: 'FIADO' },
];
const SALE = {
  id: 1,
  code: 'FV-0001',
  saleDate: '2026-02-01T15:00:00.000Z',
  totalAmount: 100000,
  paymentMethod: 'CREDITO',
  paymentStatus: 'FIADO',
  customer: ROWS[0].customer,
  local: { name: 'Sede Centro' },
  user: { name: 'Dueño Prueba' },
  items: [{ id: 1, inventoryVariantId: 5, name: 'CAMISETA BÁSICA', quantity: 4, price: 25000, discount: 0 }],
};
const PAYMENTS = { total: 100000, paid: 40000, saldo: 60000, dueDate: '2026-02-15T00:00:00.000Z', payments: [{ id: 1, amount: 40000, method: 'EFECTIVO', paidAt: '2026-02-03T10:00:00.000Z' }] };

function carteraApi() {
  return installApi([
    on('GET', /^\/sales\/receivables\/list$/, ok({ totalSaldo: 110000, count: 2, rows: ROWS })),
    on('GET', /^\/sales\/credits\/history$/, ok({ count: 2, pendiente: 110000, cobrado: 40000, rows: ROWS })),
    on('GET', /^\/sales\/payments\/history$/, ok({ total: 40000, count: 1, rows: [{ id: 1, paidAt: '2026-02-03T10:00:00.000Z', code: 'FV-0001', customer: 'ANA PÉREZ', method: 'EFECTIVO', registeredBy: 'Dueño Prueba', amount: 40000 }] })),
    on('GET', /^\/sales\/\d+\/payments$/, ok(PAYMENTS)),
    on('GET', /^\/sales\/\d+$/, detail(SALE)),
    on('POST', /^\/sales\/\d+\/payments$/, ok({ pagada: false })),
    on('DELETE', /^\/sales\/\d+$/, ok()),
    ...baseRoutes(),
  ]);
}

describe('Cartera (fiado) · por cobrar', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = carteraApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga saldos, créditos e historial y muestra el total por cobrar', async () => {
    await renderPage(<CarteraPage />);
    await waitForCall(api, 'GET', /^\/sales\/receivables\/list$/);
    await waitForCall(api, 'GET', /^\/sales\/credits\/history$/);
    await waitForCall(api, 'GET', /^\/sales\/payments\/history$/);
    expect(screen.getByText('Total por cobrar')).toBeInTheDocument();
    expect(screen.getAllByText(money(110000)).length).toBeGreaterThan(0);
    expect(screen.getByText('FV-0001')).toBeInTheDocument();
    expect(screen.getByText('ANA PÉREZ')).toBeInTheDocument();
    expect(screen.getByText(/10 días de mora/)).toBeInTheDocument();
  });

  it('el buscador filtra por cliente, documento o factura sin ir al backend', async () => {
    await renderPage(<CarteraPage />);
    await screen.findByText('FV-0001');
    const calls = api.count('GET', /^\/sales\/receivables\/list$/);
    await typeInto(placeholder('Buscar por cliente, documento o factura…'), 'empresa');
    expect(screen.queryByText('FV-0001')).toBeNull();
    expect(screen.getByText('FV-0002')).toBeInTheDocument();
    await typeInto(placeholder('Buscar por cliente, documento o factura…'), '1001');
    expect(screen.getByText('FV-0001')).toBeInTheDocument();
    expect(api.count('GET', /^\/sales\/receivables\/list$/)).toBe(calls);
  });

  it('"Abonar" abre el abono con el saldo, "Saldar todo" lo llena y registra el pago', async () => {
    api.set('POST', /^\/sales\/\d+\/payments$/, ok({ pagada: true }));
    await renderPage(<CarteraPage />);
    await screen.findByText('FV-0001');
    await click(screen.getAllByRole('button', { name: 'Abonar' })[0]);
    await waitForCall(api, 'GET', /^\/sales\/1\/payments$/);
    const saldar = await screen.findByRole('button', { name: /Saldar todo/ });
    expect(saldar).toHaveTextContent(money(60000));
    await click(saldar);
    await click(screen.getByRole('button', { name: 'Transferencia' }));
    await typeInto(placeholder('Ej: abono en efectivo'), 'pago final');
    await click(button('Registrar abono'));
    const call = await waitForCall(api, 'POST', /^\/sales\/1\/payments$/);
    expect(call.body).toEqual({ amount: 60000, method: 'TRANSFERENCIA', note: 'pago final' });
    // Quedó pagada: el modal se cierra y la cartera se recarga.
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Registrar abono' })).toBeNull());
    await waitForCall(api, 'GET', /^\/sales\/receivables\/list$/, { count: 2 });
  });

  it('un abono parcial deja el modal abierto y recarga los abonos', async () => {
    await renderPage(<CarteraPage />);
    await screen.findByText('FV-0001');
    await click(screen.getAllByRole('button', { name: 'Abonar' })[0]);
    await waitForCall(api, 'GET', /^\/sales\/1\/payments$/);
    await screen.findByRole('button', { name: /Saldar todo/ });
    await typeInto(placeholder('$ 0'), '20000');
    await click(button('Registrar abono'));
    const call = await waitForCall(api, 'POST', /^\/sales\/1\/payments$/);
    expect(call.body).toMatchObject({ amount: 20000, method: 'EFECTIVO' });
    await waitForCall(api, 'GET', /^\/sales\/1\/payments$/, { count: 2 });
    expect(screen.getByRole('button', { name: 'Registrar abono' })).toBeInTheDocument();
  });

  it('no permite abonar más del saldo ni montos en cero', async () => {
    await renderPage(<CarteraPage />);
    await screen.findByText('FV-0001');
    await click(screen.getAllByRole('button', { name: 'Abonar' })[0]);
    await screen.findByRole('button', { name: /Saldar todo/ });
    await click(button('Registrar abono'));
    expect(screen.getByText('Ingresa un monto mayor a 0.')).toBeInTheDocument();
    await typeInto(placeholder('$ 0'), '70000');
    await click(button('Registrar abono'));
    expect(screen.getByText(/supera el saldo pendiente/)).toBeInTheDocument();
    expect(api.count('POST', /payments$/)).toBe(0);
  });

  it('si el backend rechaza el abono, se muestra el error en el modal', async () => {
    api.set('POST', /^\/sales\/\d+\/payments$/, fail(400, 'Caja cerrada: abre la caja para recibir efectivo'));
    await renderPage(<CarteraPage />);
    await screen.findByText('FV-0001');
    await click(screen.getAllByRole('button', { name: 'Abonar' })[0]);
    await screen.findByRole('button', { name: /Saldar todo/ });
    await typeInto(placeholder('$ 0'), '10000');
    await click(button('Registrar abono'));
    await waitForCall(api, 'POST', /^\/sales\/1\/payments$/);
    expect(await screen.findByText(/Caja cerrada/)).toBeInTheDocument();
  });

  it('clic en la fila abre el detalle completo con abonos; desde ahí se puede abonar o eliminar', async () => {
    await renderPage(<CarteraPage />);
    await screen.findByText('FV-0001');
    await click(screen.getByText('FV-0001'));
    await waitForCall(api, 'GET', /^\/sales\/1$/);
    await waitForCall(api, 'GET', /^\/sales\/1\/payments$/);
    const modal = (await screen.findByRole('heading', { name: 'FV-0001' })).closest('.fixed');
    expect(within(modal).getByText('CAMISETA BÁSICA')).toBeInTheDocument();
    expect(within(modal).getByRole('button', { name: /Registrar abono/ })).toBeInTheDocument();
    await click(within(modal).getByRole('button', { name: /Eliminar/ }));
    const confirm = screen.getByText('Confirmar eliminación').parentElement;
    expect(within(confirm).getByText('FV-0001')).toBeInTheDocument();
    await click(within(confirm).getByRole('button', { name: 'Eliminar' }));
    await waitForCall(api, 'DELETE', /^\/sales\/1$/);
    await waitForCall(api, 'GET', /^\/sales\/receivables\/list$/, { count: 2 });
  });

  it('las pestañas de créditos e historial muestran sus filas', async () => {
    await renderPage(<CarteraPage />);
    await screen.findByText('FV-0001');
    await click(button(/Todos los créditos/));
    expect(screen.getAllByText('FV-0001').length).toBeGreaterThan(0);
    await click(button(/Historial de abonos/));
    expect(screen.getByText('Dueño Prueba')).toBeInTheDocument();
    expect(screen.getAllByText(money(40000)).length).toBeGreaterThan(0);
  });
});

describe('Cartera · permisos', () => {
  afterEach(() => vi.restoreAllMocks());

  it('el administrador no puede eliminar ventas desde el detalle', async () => {
    resetBehavior({ role: 'ADMIN' });
    const api = carteraApi();
    await renderPage(<CarteraPage />);
    await screen.findByText('FV-0001');
    await click(screen.getByText('FV-0001'));
    const modal = (await screen.findByRole('heading', { name: 'FV-0001' })).closest('.fixed');
    await waitForCall(api, 'GET', /^\/sales\/1\/payments$/);
    expect(within(modal).queryByRole('button', { name: /Eliminar/ })).toBeNull();
    expect(within(modal).getByRole('button', { name: /Registrar abono/ })).toBeInTheDocument();
  });

  it('el barbero no entra a cartera', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    carteraApi();
    await renderPage(<CarteraPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
    expect(screen.queryByText('Total por cobrar')).toBeNull();
  });
});
