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
import PurchasesPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const PURCHASES = [
  { id: 1, code: 'OC-0001', provider: { id: 7, name: 'Proveedor Uno' }, _count: { items: 1 }, total: 50000, status: 'PENDIENTE', createdAt: '2026-02-01T10:00:00.000Z' },
  { id: 2, code: 'OC-0002', provider: null, _count: { items: 2 }, total: 90000, status: 'RECIBIDA', createdAt: '2026-01-20T10:00:00.000Z' },
];
const DETAIL_PENDING = {
  id: 1,
  code: 'OC-0001',
  status: 'PENDIENTE',
  total: 50000,
  notes: 'urgente',
  provider: { id: 7, name: 'Proveedor Uno' },
  items: [{ id: 1, quantity: 2, unitCost: 25000, subtotal: 50000, variant: { color: 'ÚNICO', inventory: { name: 'CAMISETA BÁSICA' } } }],
};
const DETAIL_RECEIVED = { ...DETAIL_PENDING, id: 2, code: 'OC-0002', status: 'RECIBIDA', notes: '' };
const SEARCH = [
  { id: 5, type: 'product', name: 'CAMISETA BÁSICA', color: 'ÚNICO', stock: 12, unit: 'UNIDAD', price: 25000 },
  { id: 9, type: 'service', name: 'CORTE', price: 20000 },
];

function purchasesApi() {
  return installApi([
    on('GET', /^\/purchases$/, list(PURCHASES, { total: 2 })),
    on('GET', /^\/purchases\/1$/, detail(DETAIL_PENDING)),
    on('GET', /^\/purchases\/2$/, detail(DETAIL_RECEIVED)),
    on('POST', /^\/purchases$/, ok({ id: 3, code: 'OC-0003' })),
    on('PATCH', /^\/purchases\/\d+\/receive$/, ok({ id: 1, status: 'RECIBIDA' })),
    on('PATCH', /^\/purchases\/\d+\/cancel$/, ok({ id: 1, status: 'CANCELADA' })),
    on('GET', /^\/inventory\/search\//, ok(SEARCH)),
    ...baseRoutes(),
  ]);
}

async function openNewPurchase(api) {
  await renderPage(<PurchasesPage />);
  await waitForCall(api, 'GET', /^\/purchases$/);
  await waitForCall(api, 'GET', /^\/locals$/);
  await click(button('Nueva compra'));
}

async function addProduct(api, term = 'cami') {
  await typeInto(placeholder('Busca por nombre o SKU (mín. 2 letras)'), term);
  const call = await waitForCall(api, 'GET', /^\/inventory\/search\//);
  const result = await screen.findByRole('button', { name: /CAMISETA BÁSICA/ });
  await click(result);
  return call;
}

describe('Compras · listado y detalle', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = purchasesApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista las órdenes con su estado y total', async () => {
    await renderPage(<PurchasesPage />);
    const call = await waitForCall(api, 'GET', /^\/purchases$/);
    expect(call.query).toMatchObject({ page: '1', limit: '10' });
    expect(screen.getByText('OC-0001')).toBeInTheDocument();
    expect(screen.getByText('OC-0002')).toBeInTheDocument();
    expect(screen.getByText(money(50000))).toBeInTheDocument();
  });

  it('"Ver" carga el detalle con sus líneas, notas y acciones de una orden pendiente', async () => {
    await renderPage(<PurchasesPage />);
    await waitForCall(api, 'GET', /^\/purchases$/);
    await click(screen.getAllByRole('button', { name: 'Ver' })[0]);
    await waitForCall(api, 'GET', /^\/purchases\/1$/);
    const modal = (await screen.findByText('Notas: urgente')).closest('.fixed');
    expect(within(modal).getByText('CAMISETA BÁSICA')).toBeInTheDocument();
    expect(within(modal).getByText(`Total: ${money(50000)}`)).toBeInTheDocument();
    expect(within(modal).getByRole('button', { name: /Recibir \(sumar stock\)/ })).toBeInTheDocument();
    expect(within(modal).getByRole('button', { name: 'Cancelar compra' })).toBeInTheDocument();
  });

  it('recibir la compra llama PATCH /receive, avisa, cierra y recarga', async () => {
    await renderPage(<PurchasesPage />);
    await waitForCall(api, 'GET', /^\/purchases$/);
    await click(screen.getAllByRole('button', { name: 'Ver' })[0]);
    const btn = await screen.findByRole('button', { name: /Recibir \(sumar stock\)/ });
    await click(btn);
    await waitForCall(api, 'PATCH', /^\/purchases\/1\/receive$/);
    await expectToast('success', 'Compra recibida');
    await waitForCall(api, 'GET', /^\/purchases$/, { count: 2 });
    expect(screen.queryByText('Notas: urgente')).toBeNull();
  });

  it('cancelar la compra llama PATCH /cancel', async () => {
    await renderPage(<PurchasesPage />);
    await waitForCall(api, 'GET', /^\/purchases$/);
    await click(screen.getAllByRole('button', { name: 'Ver' })[0]);
    await click(await screen.findByRole('button', { name: 'Cancelar compra' }));
    await waitForCall(api, 'PATCH', /^\/purchases\/1\/cancel$/);
    await expectToast('success', 'Compra cancelada');
  });

  it('una compra ya recibida no ofrece recibir ni cancelar', async () => {
    await renderPage(<PurchasesPage />);
    await waitForCall(api, 'GET', /^\/purchases$/);
    await click(screen.getAllByRole('button', { name: 'Ver' })[1]);
    await waitForCall(api, 'GET', /^\/purchases\/2$/);
    await screen.findByText(`Total: ${money(50000)}`);
    expect(screen.queryByRole('button', { name: /Recibir/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancelar compra' })).toBeNull();
  });

  it('si recibir falla (p. ej. periodo cerrado) se avisa el motivo', async () => {
    api.set('PATCH', /^\/purchases\/\d+\/receive$/, fail(400, 'Periodo contable cerrado'));
    await renderPage(<PurchasesPage />);
    await waitForCall(api, 'GET', /^\/purchases$/);
    await click(screen.getAllByRole('button', { name: 'Ver' })[0]);
    await click(await screen.findByRole('button', { name: /Recibir \(sumar stock\)/ }));
    await expectToast('error', 'Periodo contable cerrado');
  });

  it('el barbero no entra al módulo', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    purchasesApi();
    await renderPage(<PurchasesPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
    expect(screen.queryByText('Compras')).toBeNull();
  });
});

describe('Compras · nueva compra', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = purchasesApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('abre el formulario con la sede del usuario y proveedores cargados; sin ítems no deja registrar', async () => {
    await openNewPurchase(api);
    expect(screen.getByDisplayValue('Sede Centro')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sin proveedor')).toBeInTheDocument();
    expect(button('Registrar compra')).toBeDisabled();
  });

  it('busca productos (solo productos, no servicios) y los agrega a la orden', async () => {
    await openNewPurchase(api);
    const call = await addProduct(api);
    expect(call.path).toBe('/inventory/search/cami');
    expect(screen.queryByRole('button', { name: /CORTE/ })).toBeNull();
    const row = screen.getByText('CAMISETA BÁSICA').closest('tr');
    expect(row).toBeTruthy();
    expect(within(row).getByDisplayValue('1')).toBeInTheDocument();
    // Agregar el mismo producto dos veces no duplica la línea.
    await addProduct(api);
    expect(screen.getAllByText('CAMISETA BÁSICA').filter((n) => n.closest('tr'))).toHaveLength(1);
  });

  it('registra la compra con cantidades, costos, proveedor y notas', async () => {
    await openNewPurchase(api);
    await addProduct(api);
    const row = screen.getByText('CAMISETA BÁSICA').closest('tr');
    await typeInto(within(row).getByDisplayValue('1'), '3');
    await typeInto(within(row).getByPlaceholderText('$ 0'), '2000');
    expect(within(row).getByText(money(6000))).toBeInTheDocument();
    await typeInto(screen.getByDisplayValue('Sin proveedor'), '7');
    await typeInto(placeholder('Notas (opcional)'), 'reposición semanal');
    await click(button('Registrar compra'));
    const call = await waitForCall(api, 'POST', /^\/purchases$/);
    expect(call.body).toEqual({
      localId: 1,
      providerId: 7,
      notes: 'reposición semanal',
      retefuente: 0,
      reteica: 0,
      items: [{ inventoryVariantId: 5, quantity: 3, unitCost: 2000 }],
    });
    await expectToast('success', 'Compra registrada');
    await waitForCall(api, 'GET', /^\/purchases$/, { count: 2 });
    // El formulario se cierra y vuelve el botón de nueva compra.
    expect(screen.getByRole('button', { name: 'Nueva compra' })).toBeInTheDocument();
  });

  it('las retenciones practicadas viajan en la compra', async () => {
    await openNewPurchase(api);
    const [rete, ica] = screen.getAllByPlaceholderText('$ 0');
    await typeInto(rete, '10000');
    await typeInto(ica, '500');
    await addProduct(api);
    const row = screen.getByText('CAMISETA BÁSICA').closest('tr');
    await typeInto(within(row).getByPlaceholderText('$ 0'), '100000');
    await click(button('Registrar compra'));
    const call = await waitForCall(api, 'POST', /^\/purchases$/);
    expect(call.body.retefuente).toBe(10000);
    expect(call.body.reteica).toBe(500);
  });

  it('quitar una línea la elimina de la orden', async () => {
    await openNewPurchase(api);
    await addProduct(api);
    const row = screen.getByText('CAMISETA BÁSICA').closest('tr');
    await click(within(row).getAllByRole('button').pop());
    expect(screen.queryByText('CAMISETA BÁSICA')).toBeNull();
    expect(button('Registrar compra')).toBeDisabled();
  });

  it('si la empresa es responsable de IVA, muestra el IVA descontable de la compra', async () => {
    api.set('GET', /^\/company\/fiscal/, ok({ responsableIVA: true, defaultTaxRate: 19 }));
    await openNewPurchase(api);
    await addProduct(api);
    const row = screen.getByText('CAMISETA BÁSICA').closest('tr');
    await typeInto(within(row).getByPlaceholderText('$ 0'), '100000');
    const iva = screen.getByText(/IVA \(19%\)/);
    expect(iva.textContent.replace(/\u00a0/g, ' ')).toContain(money(19000));
    expect(screen.getByText(money(119000))).toBeInTheDocument();
  });

  it('un error del backend al registrar se avisa y la orden no se pierde', async () => {
    api.set('POST', /^\/purchases$/, fail(400, 'Proveedor inactivo'));
    await openNewPurchase(api);
    await addProduct(api);
    const row = screen.getByText('CAMISETA BÁSICA').closest('tr');
    await typeInto(within(row).getByPlaceholderText('$ 0'), '1000');
    await click(button('Registrar compra'));
    await waitForCall(api, 'POST', /^\/purchases$/);
    await expectToast('error', 'Proveedor inactivo');
    expect(screen.getByText('CAMISETA BÁSICA')).toBeInTheDocument();
  });
});
