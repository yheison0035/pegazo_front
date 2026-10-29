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
  fireEvent,
  button,
  placeholder,
  waitForCall,
  expectToast,
  navState,
  money,
} from '@/test/behaviorHarness';
import SalesPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const PRODUCT = { id: 5, type: 'product', name: 'CAMISETA BÁSICA', color: 'ÚNICO', stock: 12, price: 25000, trackStock: true, unit: 'UNIDAD', localId: 1 };
const SERVICE = { id: 9, type: 'service', name: 'CORTE CLÁSICO', price: 20000 };
const CUSTOMER = { id: 1, name: 'ANA PÉREZ', document: '1001', email: 'ana@test.com', phone: '3001234567' };
const APPOINTMENT = {
  id: 5,
  localId: 1,
  barberId: 1,
  status: 'CONFIRMADA',
  customer: CUSTOMER,
  service: { id: 9, name: 'CORTE CLÁSICO', serviceLocals: [{ localId: 1, price: 20000 }] },
};

const SEARCH_PLACEHOLDER = /^Buscar .* \(nombre o código\)$/;

function salesApi() {
  return installApi([
    on('GET', /^\/inventory\/search\/cami/, ok([PRODUCT])),
    on('GET', /^\/inventory\/search\/cort/, ok([SERVICE])),
    on('GET', /^\/inventory\/search\//, ok([])),
    on('GET', /^\/customers$/, list([CUSTOMER])),
    on('GET', /^\/appointments\/\d+$/, detail(APPOINTMENT)),
    on('GET', /^\/cash\/current$/, ok(null)),
    on('POST', /^\/sales$/, ok({ id: 77, total: 50000 })),
    ...baseRoutes(),
  ]);
}

async function openPos(api) {
  await renderPage(<SalesPage />);
  await waitForCall(api, 'GET', /^\/payment-methods$/);
  await waitForCall(api, 'GET', /^\/locals$/);
  await settle();
}

async function addItem(api, term, name) {
  await typeInto(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), term);
  await waitForCall(api, 'GET', new RegExp(`^/inventory/search/${term}`));
  const card = (await screen.findAllByText(name)).map((n) => n.closest('button')).find(Boolean);
  await click(card);
}

function cartRow(name) {
  const p = screen.getAllByText(name).find((n) => n.tagName === 'P');
  return p.closest('.rounded-xl');
}

function submitButton() {
  return screen.getByRole('button', { name: /^(Cobrar|Procesando|Crear plan separe|Facturar)/ });
}

describe('Ventas (POS) · armar la factura', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = salesApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('arranca vacío con los catálogos cargados y el cobro bloqueado', async () => {
    await openPos(api);
    expect(screen.getByText('La factura está vacía. Agrega ítems desde la izquierda.')).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Efectivo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transferencia' })).toBeInTheDocument();
  });

  it('busca en el catálogo y agrega el ítem al carrito con su precio', async () => {
    await openPos(api);
    await addItem(api, 'cami', 'CAMISETA BÁSICA');
    expect(cartRow('CAMISETA BÁSICA')).toBeTruthy();
    expect(submitButton()).toHaveTextContent(`Cobrar ${money(25000)} · 1 ít.`);
    expect(submitButton()).not.toBeDisabled();
  });

  it('la cantidad se puede editar y no supera el stock', async () => {
    await openPos(api);
    await addItem(api, 'cami', 'CAMISETA BÁSICA');
    const row = cartRow('CAMISETA BÁSICA');
    await typeInto(within(row).getByDisplayValue('1'), '2');
    expect(submitButton()).toHaveTextContent(`Cobrar ${money(50000)} · 2 ít.`);
    await typeInto(within(row).getByDisplayValue('2'), '50');
    expect(within(row).getByDisplayValue('12')).toBeInTheDocument();
    expect(submitButton()).toHaveTextContent(`Cobrar ${money(300000)} · 12 ít.`);
  });

  it('agregar el mismo producto dos veces suma cantidad en la misma línea', async () => {
    await openPos(api);
    await addItem(api, 'cami', 'CAMISETA BÁSICA');
    await addItem(api, 'cami', 'CAMISETA BÁSICA');
    expect(screen.getAllByText('CAMISETA BÁSICA').filter((n) => n.tagName === 'P')).toHaveLength(1);
    expect(submitButton()).toHaveTextContent('· 2 ít.');
  });

  it('Enter en el buscador agrega el primer resultado (lector de código de barras)', async () => {
    await openPos(api);
    const input = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
    await typeInto(input, 'cami');
    await waitForCall(api, 'GET', /^\/inventory\/search\/cami/);
    await screen.findAllByText('CAMISETA BÁSICA');
    fireEvent.keyDown(input, { key: 'Enter' });
    await settle();
    expect(cartRow('CAMISETA BÁSICA')).toBeTruthy();
    expect(input.value).toBe('');
  });

  it('"Limpiar" vacía la factura', async () => {
    await openPos(api);
    await addItem(api, 'cami', 'CAMISETA BÁSICA');
    await click(button('Limpiar'));
    expect(screen.getByText('La factura está vacía. Agrega ítems desde la izquierda.')).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it('quitar una línea del carrito', async () => {
    await openPos(api);
    await addItem(api, 'cami', 'CAMISETA BÁSICA');
    const row = cartRow('CAMISETA BÁSICA');
    await click(within(row).getAllByRole('button')[0]);
    expect(screen.getByText('La factura está vacía. Agrega ítems desde la izquierda.')).toBeInTheDocument();
  });
});

describe('Ventas (POS) · cobrar', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = salesApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('cobra en efectivo: POST /sales con ítems, método, estado PAGADA y efectivo recibido', async () => {
    await openPos(api);
    await addItem(api, 'cami', 'CAMISETA BÁSICA');
    await typeInto(within(cartRow('CAMISETA BÁSICA')).getByDisplayValue('1'), '2');
    await typeInto(placeholder('$ 0'), '60000');
    await click(submitButton());
    const call = await waitForCall(api, 'POST', /^\/sales$/);
    expect(call.body).toMatchObject({
      paymentMethod: 'EFECTIVO',
      paymentMethodCatalogId: 1,
      invoiceType: 'NORMAL',
      paymentStatus: 'PAGADA',
      dueDate: null,
      localId: 1,
      userId: 1,
      customerId: null,
      cashReceived: 60000,
      items: [{ inventoryVariantId: 5, quantity: 2, discount: 0 }],
    });
    expect(String(call.body.saleDate)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const t = await expectToast('success', 'Factura registrada correctamente');
    expect(t.url).toBe('/dashboard/delivered_sales');
  });

  it('cobra por transferencia usando el catálogo de métodos de pago', async () => {
    await openPos(api);
    await addItem(api, 'cami', 'CAMISETA BÁSICA');
    await click(screen.getByRole('button', { name: 'Transferencia' }));
    expect(screen.queryByPlaceholderText('$ 0')).toBeNull();
    await click(submitButton());
    const call = await waitForCall(api, 'POST', /^\/sales$/);
    expect(call.body).toMatchObject({ paymentMethod: 'TRANSFERENCIA', paymentMethodCatalogId: 2, paymentStatus: 'PAGADA', cashReceived: null });
  });

  it('a crédito (fiado) la venta nace FIADA', async () => {
    await openPos(api);
    await addItem(api, 'cami', 'CAMISETA BÁSICA');
    await click(screen.getByRole('button', { name: 'Crédito (fiado)' }));
    await click(submitButton());
    const call = await waitForCall(api, 'POST', /^\/sales$/);
    expect(call.body).toMatchObject({ paymentMethod: 'CREDITO', paymentStatus: 'FIADO' });
  });

  it('busca y asigna un cliente identificado a la factura', async () => {
    await openPos(api);
    await addItem(api, 'cami', 'CAMISETA BÁSICA');
    await typeInto(placeholder('Cliente (opcional) — Consumidor Final'), 'ana');
    const search = await waitForCall(api, 'GET', /^\/customers$/);
    expect(search.query).toMatchObject({ name: 'ana', limit: '6' });
    await click(await screen.findByRole('button', { name: /ANA PÉREZ/ }));
    await waitForCall(api, 'GET', /^\/customers\/1\/summary$/);
    await click(submitButton());
    const call = await waitForCall(api, 'POST', /^\/sales$/);
    expect(call.body.customerId).toBe(1);
  });

  it('un servicio se envía con serviceId, no con variante', async () => {
    await openPos(api);
    await addItem(api, 'cort', 'CORTE CLÁSICO');
    await click(submitButton());
    const call = await waitForCall(api, 'POST', /^\/sales$/);
    expect(call.body.items).toEqual([{ serviceId: 9, quantity: 1, discount: 0 }]);
  });

  it('si el backend rechaza la venta, se avisa y la factura sigue en pantalla', async () => {
    api.set('POST', /^\/sales$/, fail(400, 'Stock insuficiente para CAMISETA BÁSICA'));
    await openPos(api);
    await addItem(api, 'cami', 'CAMISETA BÁSICA');
    await click(submitButton());
    await waitForCall(api, 'POST', /^\/sales$/);
    await expectToast('error', 'Stock insuficiente');
    expect(cartRow('CAMISETA BÁSICA')).toBeTruthy();
  });
});

describe('Ventas (POS) · política de caja y cobro de citas', () => {
  afterEach(() => vi.restoreAllMocks());

  it('con "exigir caja abierta" y sin caja, bloquea la venta y lleva a abrir el día', async () => {
    resetBehavior({ company: { requireCashOpen: true } });
    const api = salesApi();
    await renderPage(<SalesPage />);
    await waitForCall(api, 'GET', /^\/cash\/current$/);
    expect(await screen.findByText('Debes abrir el día para vender')).toBeInTheDocument();
    expect(screen.getByText('Abrir el día').closest('a')).toHaveAttribute('href', '/dashboard/cash');
    expect(screen.queryByPlaceholderText(SEARCH_PLACEHOLDER)).toBeNull();
  });

  it('con caja abierta hoy, el POS se habilita', async () => {
    resetBehavior({ company: { requireCashOpen: true } });
    const api = salesApi();
    api.set('GET', /^\/cash\/current$/, ok({ id: 5, openedAt: new Date().toISOString() }));
    await renderPage(<SalesPage />);
    await waitForCall(api, 'GET', /^\/cash\/current$/);
    expect(await screen.findByPlaceholderText(SEARCH_PLACEHOLDER)).toBeInTheDocument();
  });

  it('con una caja abierta de un día anterior, pide cerrar el día', async () => {
    resetBehavior({ company: { requireCashOpen: true } });
    const api = salesApi();
    api.set('GET', /^\/cash\/current$/, ok({ id: 5, openedAt: '2026-01-01T13:00:00.000Z' }));
    await renderPage(<SalesPage />);
    await waitForCall(api, 'GET', /^\/cash\/current$/);
    expect(await screen.findByText('El día de ayer no se ha cerrado')).toBeInTheDocument();
  });

  it('cobrar una cita precarga servicio, cliente y atendedor, y enlaza la venta a la cita', async () => {
    resetBehavior({ type: 'BARBERIA' });
    navState.search = 'appointment=5';
    const api = salesApi();
    await renderPage(<SalesPage />);
    await waitForCall(api, 'GET', /^\/appointments\/5$/);
    expect(await screen.findByText('Cobrar cita')).toBeInTheDocument();
    await waitForCall(api, 'GET', /^\/payment-methods$/);
    await settle();
    expect(cartRow('CORTE CLÁSICO')).toBeTruthy();
    expect(screen.getByText('ANA PÉREZ')).toBeInTheDocument();
    await click(submitButton());
    const call = await waitForCall(api, 'POST', /^\/sales$/);
    expect(call.body).toMatchObject({ appointmentId: 5, customerId: 1, userId: 1, items: [{ serviceId: 9, quantity: 1, discount: 0 }] });
    const t = await expectToast('success', 'Cita cobrada');
    expect(t.url).toBe('/dashboard/appointments');
  });

  it('en negocios de servicios hay que indicar quién atendió antes de cobrar', async () => {
    resetBehavior({ type: 'BARBERIA' });
    const api = salesApi();
    await renderPage(<SalesPage />);
    await waitForCall(api, 'GET', /^\/payment-methods$/);
    await settle();
    await addItem(api, 'cort', 'CORTE CLÁSICO');
    await click(submitButton());
    await expectToast('warning', /Selecciona quién atendió/);
    expect(api.count('POST', /^\/sales$/)).toBe(0);
  });
});
