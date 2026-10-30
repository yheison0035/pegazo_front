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
} from '@/test/behaviorHarness';
import OrdersPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const ORDERS = [
  { id: 1, code: 'PED-0001', customer: { id: 1, name: 'ANA PÉREZ', phone: '3001234567' }, _count: { items: 1 }, totalAmount: 50000, paymentStatus: 'PAGADA', shippingStatus: 'PENDIENTE', saleStatus: 'ACTIVA', saleDate: '2026-02-10T10:00:00.000Z' },
  { id: 2, code: 'PED-0002', customer: { id: 2, name: 'LUIS GÓMEZ', phone: '' }, _count: { items: 2 }, totalAmount: 90000, paymentStatus: 'PAGADA', shippingStatus: 'EN_CAMINO', saleStatus: 'ACTIVA', saleDate: '2026-02-11T10:00:00.000Z' },
];
const ORDER_NEW = {
  ...ORDERS[0],
  confirmedAt: null,
  shipment: null,
  items: [{ id: 1, variant: { inventory: { name: 'CAMISETA BÁSICA' } }, quantity: 2, price: 25000, subtotal: 50000 }],
  shippingAddress: 'Calle 1 # 2-3',
};
const ORDER_CONFIRMED = { ...ORDER_NEW, confirmedAt: '2026-02-10T12:00:00.000Z', shipment: { carrier: 'Servientrega', trackingNumber: '', notes: '' } };

function ordersApi(detailBody = ORDER_NEW) {
  return installApi([
    on('GET', /^\/sales\/orders\/list$/, list(ORDERS, { total: 2 })),
    on('GET', /^\/sales\/orders\/\d+$/, detail(detailBody)),
    on('PATCH', /^\/sales\/orders\/\d+\/fulfillment$/, ok({ id: 1 })),
    on('PATCH', /^\/sales\/orders\/\d+\/cancel$/, ok({ id: 1 })),
    on('DELETE', /^\/sales\/\d+$/, ok()),
    ...baseRoutes(),
  ]);
}

async function openOrder(api) {
  await renderPage(<OrdersPage />);
  await waitForCall(api, 'GET', /^\/sales\/orders\/list$/);
  await click(screen.getAllByText('PED-0001')[0]);
  await waitForCall(api, 'GET', /^\/sales\/orders\/1$/);
  return (await screen.findByText('CAMISETA BÁSICA')).closest('.fixed');
}

describe('Pedidos (tienda online)', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = ordersApi();
    window.open = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista los pedidos y filtra por número, cliente y estado de envío', async () => {
    await renderPage(<OrdersPage />);
    const call = await waitForCall(api, 'GET', /^\/sales\/orders\/list$/);
    expect(call.query).toMatchObject({ page: '1', limit: '10' });
    expect(screen.getAllByText('PED-0001').length).toBeGreaterThan(0);
    await typeInto(placeholder('Buscar # de pedido'), 'PED-0002');
    let f = await waitForCall(api, 'GET', /^\/sales\/orders\/list$/, { count: 2 });
    expect(f.query.code).toBe('PED-0002');
    await typeInto(placeholder('Buscar cliente (nombre, teléfono, correo)'), 'ana');
    f = await waitForCall(api, 'GET', /^\/sales\/orders\/list$/, { count: 3 });
    expect(f.query.customer).toBe('ana');
    const statusSelect = screen.getAllByRole('combobox').find((s) => [...s.options].some((o) => o.text === 'En camino'));
    await typeInto(statusSelect, 'EN_CAMINO');
    f = await waitForCall(api, 'GET', /^\/sales\/orders\/list$/, { count: 4 });
    expect(f.query.shippingStatus ?? f.query.status).toBe('EN_CAMINO');
  });

  it('un pedido nuevo se confirma primero; hasta entonces la gestión del envío está bloqueada', async () => {
    const modal = await openOrder(api);
    expect(modal.querySelector('fieldset').disabled).toBe(true);
    await click(within(modal).getByRole('button', { name: /Marcar pedido confirmado/ }));
    const call = await waitForCall(api, 'PATCH', /^\/sales\/orders\/1\/fulfillment$/);
    expect(call.body).toEqual({ confirm: true });
  });

  it('en un pedido confirmado se actualiza el envío: estado, transportadora, guía y notas', async () => {
    api = ordersApi(ORDER_CONFIRMED);
    const modal = await openOrder(api);
    expect(modal.querySelector('fieldset').disabled).toBe(false);
    await typeInto(within(modal).getByRole('combobox'), 'EN_CAMINO');
    await typeInto(within(modal).getByPlaceholderText('N° de seguimiento'), 'SV123456');
    await typeInto(within(modal).getByPlaceholderText('Observaciones del envío'), 'sale hoy');
    await click(within(modal).getByRole('button', { name: /Guardar cambios/ }));
    const call = await waitForCall(api, 'PATCH', /^\/sales\/orders\/1\/fulfillment$/);
    expect(call.body).toEqual({ shippingStatus: 'EN_CAMINO', carrier: 'Servientrega', trackingNumber: 'SV123456', notes: 'sale hoy' });
    await expectToast('success', 'Pedido actualizado');
  });

  it('un envío fallido guarda el motivo y la reprogramación en las notas', async () => {
    api = ordersApi(ORDER_CONFIRMED);
    const modal = await openOrder(api);
    await typeInto(within(modal).getByRole('combobox'), 'FALLIDO');
    await typeInto(within(modal).getByPlaceholderText('Ej: cliente ausente, dirección errada…'), 'cliente ausente');
    await click(within(modal).getByRole('button', { name: /Guardar cambios/ }));
    const call = await waitForCall(api, 'PATCH', /^\/sales\/orders\/1\/fulfillment$/);
    expect(call.body.shippingStatus).toBe('FALLIDO');
    expect(call.body.notes).toContain('No entregado: cliente ausente');
  });

  it('notificar por WhatsApp abre el chat del cliente', async () => {
    api = ordersApi(ORDER_CONFIRMED);
    const modal = await openOrder(api);
    await click(within(modal).getByRole('button', { name: /Notificar por WhatsApp/ }));
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(String(window.open.mock.calls[0][0])).toMatch(/wa\.me|whatsapp/);
  });

  it('cancelar devuelve el stock tras confirmar; eliminar borra la venta', async () => {
    api = ordersApi(ORDER_CONFIRMED);
    let modal = await openOrder(api);
    await click(within(modal).getByRole('button', { name: /Cancelar y devolver stock/ }));
    await click(screen.getByRole('button', { name: 'Cancelar pedido' }));
    await waitForCall(api, 'PATCH', /^\/sales\/orders\/1\/cancel$/);
    await waitForCall(api, 'GET', /^\/sales\/orders\/list$/, { count: 2 });

    await click(screen.getAllByText('PED-0001')[0]);
    modal = (await screen.findByText('CAMISETA BÁSICA')).closest('.fixed');
    await click(within(modal).getByRole('button', { name: /^Eliminar/ }));
    const confirm = screen.getAllByRole('button', { name: 'Eliminar' }).pop();
    await click(confirm);
    await waitForCall(api, 'DELETE', /^\/sales\/1$/);
  });

  it('si el backend rechaza la actualización, se avisa', async () => {
    api = ordersApi(ORDER_CONFIRMED);
    api.set('PATCH', /^\/sales\/orders\/\d+\/fulfillment$/, fail(400, 'El pedido ya fue entregado'));
    const modal = await openOrder(api);
    await click(within(modal).getByRole('button', { name: /Guardar cambios/ }));
    await waitForCall(api, 'PATCH', /^\/sales\/orders\/1\/fulfillment$/);
    // El modal sigue abierto y muestra el motivo para reintentar.
    expect(await within(modal).findByText(/ya fue entregado/)).toBeInTheDocument();
    expect(within(modal).getByRole('button', { name: /Guardar cambios/ })).toBeInTheDocument();
  });

  it('el barbero no entra a pedidos', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    ordersApi();
    await renderPage(<OrdersPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
