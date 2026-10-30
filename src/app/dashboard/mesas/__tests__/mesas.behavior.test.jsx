import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi,
  on,
  list,
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
  money,
} from '@/test/behaviorHarness';
import MesasPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
vi.mock('@/utils/printInvoice', () => ({ printSaleInvoice: vi.fn(), printCustodyTicket: vi.fn() }));

const MESAS = [
  { id: 1, name: 'MESA 1', localId: 1, status: 'LIBRE', openCount: 0, posX: 0, posY: 0 },
  { id: 2, name: 'MESA 2', localId: 1, status: 'OCUPADA', openCount: 1, posX: 1, posY: 0 },
];
const COMANDA = {
  id: 50,
  mesaId: 2,
  status: 'LISTO',
  total: 36000,
  user: { name: 'Mesero Uno' },
  items: [{ id: 1, name: 'HAMBURGUESA', quantity: 2, subtotal: 36000, notes: 'sin cebolla' }],
};
const DISH = { id: 5, type: 'product', name: 'HAMBURGUESA', price: 18000, trackStock: false, stock: 0, unit: 'UNIDAD' };

function mesasApi() {
  return installApi([
    on('GET', /^\/mesas$/, ok(MESAS)),
    on('POST', /^\/mesas$/, ok({ id: 3 })),
    on('PUT', /^\/mesas\/\d+$/, ok({ id: 1 })),
    on('DELETE', /^\/mesas\/\d+$/, ok()),
    on('GET', /^\/comandas\/mesa\/2$/, ok([COMANDA])),
    on('GET', /^\/comandas\/mesa\/\d+$/, ok([])),
    on('POST', /^\/comandas$/, ok({ id: 51 })),
    on('PATCH', /^\/comandas\/\d+\/status$/, ok({ id: 50 })),
    on('POST', /^\/comandas\/mesa\/\d+\/charge$/, ok({ saleId: 77 })),
    on('GET', /^\/inventory\/search\//, ok([DISH])),
    ...baseRoutes(),
  ]);
}

async function openMesa(name) {
  await click(screen.getByText(name).closest('button') || screen.getByText(name));
}

describe('Mesas (restaurante)', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'RESTAURANTE' });
    api = mesasApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('muestra las mesas con su estado y el buscador las filtra', async () => {
    await renderPage(<MesasPage />);
    await waitForCall(api, 'GET', /^\/mesas$/);
    expect(await screen.findByText('MESA 1')).toBeInTheDocument();
    expect(screen.getByText('MESA 2')).toBeInTheDocument();
    expect(screen.getByText(/1 pedido/)).toBeInTheDocument();
    await typeInto(placeholder('Buscar mesa...'), 'MESA 2');
    expect(screen.queryByText('MESA 1')).toBeNull();
    expect(screen.getByText('MESA 2')).toBeInTheDocument();
  });

  it('crea una mesa con nombre y sede', async () => {
    await renderPage(<MesasPage />);
    await screen.findByText('MESA 1');
    await waitForCall(api, 'GET', /^\/locals$/);
    await click(button('Nueva mesa'));
    const name = await screen.findByPlaceholderText('Nombre (ej: Mesa 1)');
    const modal = name.closest('.fixed');
    await typeInto(name, 'Terraza 1');
    await typeInto(within(modal).getByRole('combobox'), '1');
    await click(within(modal).getByRole('button', { name: /Crear|Guardar/ }));
    const call = await waitForCall(api, 'POST', /^\/mesas$/);
    expect(call.body).toEqual({ name: 'Terraza 1', localId: 1 });
    await waitForCall(api, 'GET', /^\/mesas$/, { count: 2 });
  });

  it('abrir una mesa ocupada carga sus pedidos con ítems, notas y total', async () => {
    await renderPage(<MesasPage />);
    await screen.findByText('MESA 2');
    await openMesa('MESA 2');
    await waitForCall(api, 'GET', /^\/comandas\/mesa\/2$/);
    expect(await screen.findByText(/2× HAMBURGUESA/)).toBeInTheDocument();
    expect(screen.getByText(/sin cebolla/)).toBeInTheDocument();
    expect(screen.getByText(/Mesero: Mesero Uno/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(`Cobrar mesa`) })).toHaveTextContent(money(36000));
  });

  it('un pedido listo se marca como entregado o se cancela', async () => {
    await renderPage(<MesasPage />);
    await screen.findByText('MESA 2');
    await openMesa('MESA 2');
    await screen.findByText(/2× HAMBURGUESA/);
    await click(screen.getByRole('button', { name: 'Entregado' }));
    let call = await waitForCall(api, 'PATCH', /^\/comandas\/50\/status$/);
    expect(call.body).toEqual({ status: 'ENTREGADO' });
    await click(screen.getByRole('button', { name: 'Cancelar' }));
    call = await waitForCall(api, 'PATCH', /^\/comandas\/50\/status$/, { count: 2 });
    expect(call.body).toEqual({ status: 'CANCELADA' });
  });

  it('agrega platos y los envía a cocina como una comanda de la mesa', async () => {
    await renderPage(<MesasPage />);
    await screen.findByText('MESA 1');
    await openMesa('MESA 1');
    await waitForCall(api, 'GET', /^\/comandas\/mesa\/1$/);
    const search = await screen.findByPlaceholderText('Buscar o escanear código de barras (Enter agrega)...');
    await typeInto(search, 'hamb');
    await waitForCall(api, 'GET', /^\/inventory\/search\/hamb/i); // el selector busca en mayúsculas
    await click(await screen.findByText('HAMBURGUESA'));
    await click(button(/Enviar a cocina/));
    const call = await waitForCall(api, 'POST', /^\/comandas$/);
    expect(call.body).toEqual({ mesaId: 1, localId: 1, items: [{ inventoryVariantId: 5, quantity: 1 }] });
    await expectToast('success', 'Pedido enviado a cocina');
  });

  it('cobrar la mesa junta sus pedidos en una venta', async () => {
    await renderPage(<MesasPage />);
    await screen.findByText('MESA 2');
    await openMesa('MESA 2');
    await screen.findByText(/2× HAMBURGUESA/);
    await click(screen.getByRole('button', { name: /Cobrar mesa/ }));
    const call = await waitForCall(api, 'POST', /^\/comandas\/mesa\/2\/charge$/);
    expect(call.body).toEqual({ paymentMethod: 'EFECTIVO' });
    await expectToast('success', 'Mesa cobrada');
    await waitForCall(api, 'GET', /^\/mesas$/, { count: 2 });
  });

  it('si el backend rechaza el cobro, se avisa', async () => {
    api.set('POST', /^\/comandas\/mesa\/\d+\/charge$/, fail(400, 'Hay pedidos sin entregar'));
    await renderPage(<MesasPage />);
    await screen.findByText('MESA 2');
    await openMesa('MESA 2');
    await screen.findByText(/2× HAMBURGUESA/);
    await click(screen.getByRole('button', { name: /Cobrar mesa/ }));
    await expectToast('error', 'sin entregar');
  });

  it('el dueño elimina una mesa libre (la ocupada no se puede)', async () => {
    await renderPage(<MesasPage />);
    await screen.findByText('MESA 1');
    const libre = screen.getByText('MESA 1').closest('button');
    const closers = libre.querySelectorAll('span.absolute');
    expect(closers.length).toBe(1);
    await click(closers[0]);
    await waitForCall(api, 'DELETE', /^\/mesas\/1$/);
    const ocupada = screen.getByText('MESA 2').closest('button');
    expect(ocupada.querySelectorAll('span.absolute').length).toBe(0);
  });

  it('el mesero pide pero no cobra ni crea mesas', async () => {
    resetBehavior({ type: 'RESTAURANTE', role: 'MESERO' });
    api = mesasApi();
    await renderPage(<MesasPage />);
    await screen.findByText('MESA 2');
    expect(screen.queryByRole('button', { name: 'Nueva mesa' })).toBeNull();
    await openMesa('MESA 2');
    await screen.findByText(/2× HAMBURGUESA/);
    expect(screen.queryByRole('button', { name: /Cobrar mesa/ })).toBeNull();
    expect(screen.getByPlaceholderText('Buscar o escanear código de barras (Enter agrega)...')).toBeInTheDocument();
  });
});
