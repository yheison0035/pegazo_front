import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi,
  on,
  list,
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
import ReturnsPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const RETURNS = [
  { id: 1, code: 'DEV-0001', sale: { code: 'FV-0001' }, _count: { items: 1 }, total: 25000, reason: 'Talla equivocada', createdAt: '2026-02-12T10:00:00.000Z' },
  { id: 2, code: 'DEV-0002', sale: { code: 'FV-0002' }, _count: { items: 2 }, total: 40000, reason: '', createdAt: '2026-02-13T10:00:00.000Z' },
];
const RETURN_DETAIL = { id: 1, code: 'DEV-0001', sale: { code: 'FV-0001' }, total: 25000, reason: 'Talla equivocada', items: [{ id: 1, name: 'CAMISETA BÁSICA', quantity: 1, price: 25000, subtotal: 25000 }] };
const SALE_FOR_RETURN = {
  id: 1,
  code: 'FV-0001',
  saleDate: '2026-02-10T15:00:00.000Z',
  customer: { name: 'ANA PÉREZ' },
  items: [
    { saleItemId: 11, inventoryVariantId: 5, name: 'CAMISETA BÁSICA', color: 'ÚNICO', price: 25000, soldQuantity: 3, returnedQuantity: 1, remaining: 2 },
    { saleItemId: 12, inventoryVariantId: 6, name: 'GORRA NEGRA', color: 'ÚNICO', price: 30000, soldQuantity: 1, returnedQuantity: 1, remaining: 0 },
  ],
};

function returnsApi() {
  return installApi([
    on('GET', /^\/returns$/, list(RETURNS, { total: 2 })),
    on('GET', /^\/returns\/sale\/\d+$/, detail(SALE_FOR_RETURN)),
    on('GET', /^\/returns\/\d+$/, detail(RETURN_DETAIL)),
    on('POST', /^\/returns$/, ok({ id: 3, code: 'DEV-0003' })),
    on('GET', /^\/sales$/, list([{ id: 1, code: 'FV-0001', customer: { name: 'ANA PÉREZ' }, totalAmount: 105000 }])),
    ...baseRoutes(),
  ]);
}

async function openSale(api) {
  await click(button('Nueva devolución'));
  await typeInto(placeholder('Ej: SALE-1787... (mín. 3 caracteres)'), 'FV-0');
  const search = await waitForCall(api, 'GET', /^\/sales$/);
  expect(search.query).toMatchObject({ code: 'FV-0', limit: '6' });
  await click(await screen.findByRole('button', { name: /FV-0001/ }));
  await waitForCall(api, 'GET', /^\/returns\/sale\/1$/);
  await screen.findByText('CAMISETA BÁSICA');
}

describe('Devoluciones', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = returnsApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista las devoluciones con su venta origen y total', async () => {
    await renderPage(<ReturnsPage />);
    const call = await waitForCall(api, 'GET', /^\/returns$/);
    expect(call.query).toMatchObject({ page: '1', limit: '10' });
    expect(screen.getByText('DEV-0001')).toBeInTheDocument();
    expect(screen.getByText('DEV-0002')).toBeInTheDocument();
    expect(screen.getByText('Talla equivocada')).toBeInTheDocument();
  });

  it('"Ver" abre el detalle con sus líneas', async () => {
    await renderPage(<ReturnsPage />);
    await waitForCall(api, 'GET', /^\/returns$/);
    await click(screen.getAllByRole('button', { name: 'Ver' })[0]);
    await waitForCall(api, 'GET', /^\/returns\/1$/);
    const modal = (await screen.findByRole('heading', { name: 'DEV-0001' })).closest('.fixed');
    expect(within(modal).getByText('CAMISETA BÁSICA')).toBeInTheDocument();
    expect(within(modal).getByText(/Talla equivocada/)).toBeInTheDocument();
  });

  it('busca la venta por código, la carga y muestra lo vendido, devuelto y disponible', async () => {
    await renderPage(<ReturnsPage />);
    await waitForCall(api, 'GET', /^\/returns$/);
    await openSale(api);
    const row = screen.getByText('CAMISETA BÁSICA').closest('tr');
    expect(within(row).getByText('3')).toBeInTheDocument();
    expect(within(row).getByText(/máx 2/)).toBeInTheDocument();
    // La gorra ya se devolvió completa: no se puede devolver más.
    const row2 = screen.getByText('GORRA NEGRA').closest('tr');
    expect(within(row2).getByPlaceholderText('0')).toBeDisabled();
    expect(button('Registrar devolución')).toBeDisabled();
  });

  it('la cantidad se topa a lo disponible y el reembolso se calcula solo', async () => {
    await renderPage(<ReturnsPage />);
    await waitForCall(api, 'GET', /^\/returns$/);
    await openSale(api);
    const row = screen.getByText('CAMISETA BÁSICA').closest('tr');
    await typeInto(within(row).getByPlaceholderText('0'), '5');
    expect(within(row).getByPlaceholderText('0').value).toBe('2');
    expect(within(row).getByText(money(50000))).toBeInTheDocument();
    expect(button('Registrar devolución')).not.toBeDisabled();
  });

  it('registra la devolución con POST /returns y recarga la lista', async () => {
    await renderPage(<ReturnsPage />);
    await waitForCall(api, 'GET', /^\/returns$/);
    await openSale(api);
    const row = screen.getByText('CAMISETA BÁSICA').closest('tr');
    await typeInto(within(row).getByPlaceholderText('0'), '2');
    await typeInto(placeholder('Motivo (opcional): defectuoso, cambio de talla…'), 'defectuoso');
    await click(button('Registrar devolución'));
    const call = await waitForCall(api, 'POST', /^\/returns$/);
    expect(call.body).toEqual({ saleId: 1, reason: 'defectuoso', items: [{ saleItemId: 11, quantity: 2 }] });
    await expectToast('success', 'Devolución registrada');
    await waitForCall(api, 'GET', /^\/returns$/, { count: 2 });
    expect(screen.getByRole('button', { name: 'Nueva devolución' })).toBeInTheDocument();
  });

  it('si el backend rechaza la devolución, se avisa y el formulario sigue', async () => {
    api.set('POST', /^\/returns$/, fail(400, 'La venta ya fue devuelta por completo'));
    await renderPage(<ReturnsPage />);
    await waitForCall(api, 'GET', /^\/returns$/);
    await openSale(api);
    const row = screen.getByText('CAMISETA BÁSICA').closest('tr');
    await typeInto(within(row).getByPlaceholderText('0'), '1');
    await click(button('Registrar devolución'));
    await waitForCall(api, 'POST', /^\/returns$/);
    await expectToast('error', 'devuelta por completo');
    expect(screen.getByText('CAMISETA BÁSICA')).toBeInTheDocument();
  });

  it('el barbero no entra a devoluciones', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    returnsApi();
    await renderPage(<ReturnsPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
