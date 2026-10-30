import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
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
  placeholder,
  waitForCall,
  expectToast,
} from '@/test/behaviorHarness';
import KitchenPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const COMANDAS = [
  { id: 50, status: 'PENDIENTE', mesa: { name: 'MESA 2' }, user: { name: 'Mesero Uno' }, createdAt: new Date().toISOString(), notes: '', items: [{ id: 1, name: 'HAMBURGUESA', quantity: 2, notes: 'sin cebolla' }] },
  { id: 51, status: 'PREPARANDO', mesa: { name: 'MESA 3' }, user: { name: 'Mesero Uno' }, createdAt: new Date().toISOString(), notes: '', items: [{ id: 2, name: 'LIMONADA', quantity: 1, notes: '' }] },
  { id: 52, status: 'LISTO', mesa: { name: 'MESA 4' }, user: { name: 'Mesero Dos' }, createdAt: new Date().toISOString(), notes: '', items: [{ id: 3, name: 'PAPAS', quantity: 3, notes: '' }] },
];
const MENU = [
  { id: 5, name: 'HAMBURGUESA', available: true },
  { id: 6, name: 'LIMONADA', available: false },
];

function kitchenApi() {
  return installApi([
    on('GET', /^\/comandas\/kitchen$/, ok(COMANDAS)),
    on('PATCH', /^\/comandas\/\d+\/status$/, ok({ id: 50 })),
    on('GET', /^\/inventory\/menu$/, ok(MENU)),
    on('PATCH', /^\/inventory\/\d+\/availability$/, ok({ id: 5 })),
    ...baseRoutes(),
  ]);
}

describe('Cocina', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'RESTAURANTE' });
    api = kitchenApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('muestra los pedidos por columna de estado con sus platos y notas', async () => {
    await renderPage(<KitchenPage />);
    await waitForCall(api, 'GET', /^\/comandas\/kitchen$/);
    expect((await screen.findAllByText(/HAMBURGUESA/)).length).toBeGreaterThan(0);
    expect(screen.getByText(/sin cebolla/)).toBeInTheDocument();
    expect(screen.getByText('MESA 2')).toBeInTheDocument();
    expect(screen.getByText('MESA 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Empezar a preparar/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Marcar listo/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Entregar/ })).toBeInTheDocument();
  });

  it('avanza el estado de un pedido: pendiente → preparando → listo → entregado', async () => {
    await renderPage(<KitchenPage />);
    await screen.findByText('MESA 2');
    await click(screen.getByRole('button', { name: /Empezar a preparar/ }));
    let call = await waitForCall(api, 'PATCH', /^\/comandas\/50\/status$/);
    expect(call.body).toEqual({ status: 'PREPARANDO' });
    await click(screen.getByRole('button', { name: /Marcar listo/ }));
    call = await waitForCall(api, 'PATCH', /^\/comandas\/51\/status$/);
    expect(call.body).toEqual({ status: 'LISTO' });
    await click(screen.getByRole('button', { name: /^Entregar/ }));
    call = await waitForCall(api, 'PATCH', /^\/comandas\/52\/status$/);
    expect(call.body).toEqual({ status: 'ENTREGADO' });
    await waitForCall(api, 'GET', /^\/comandas\/kitchen$/, { count: 2 });
  });

  it('el cocinero no entrega (solo marca listo)', async () => {
    resetBehavior({ type: 'RESTAURANTE', role: 'COCINERO' });
    api = kitchenApi();
    await renderPage(<KitchenPage />);
    await screen.findByText('MESA 2');
    expect(screen.getByRole('button', { name: /Empezar a preparar/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Entregar/ })).toBeNull();
  });

  it('el menú del día permite buscar un plato y marcarlo agotado/disponible', async () => {
    await renderPage(<KitchenPage />);
    await waitForCall(api, 'GET', /^\/inventory\/menu$/);
    await screen.findByText('MESA 2');
    const search = placeholder('Buscar plato…');
    await typeInto(search, 'limo');
    const limonada = screen.getAllByText('LIMONADA').map((n) => n.closest('button')).find(Boolean);
    expect(limonada).toBeTruthy();
    await click(limonada);
    let call = await waitForCall(api, 'PATCH', /^\/inventory\/6\/availability$/);
    expect(call.body).toEqual({ available: true });
    await typeInto(search, 'hamb');
    const hamb = screen.getAllByText('HAMBURGUESA').map((n) => n.closest('button')).find(Boolean);
    await click(hamb);
    call = await waitForCall(api, 'PATCH', /^\/inventory\/5\/availability$/);
    expect(call.body).toEqual({ available: false });
  });

  it('si cambiar la disponibilidad falla, el plato vuelve a su estado anterior', async () => {
    api.set('PATCH', /^\/inventory\/\d+\/availability$/, fail(400, 'Sin permiso'));
    await renderPage(<KitchenPage />);
    await waitForCall(api, 'GET', /^\/inventory\/menu$/);
    await typeInto(placeholder('Buscar plato…'), 'limo');
    const limonada = screen.getAllByText('LIMONADA').map((n) => n.closest('button')).find(Boolean);
    const before = limonada.className;
    await click(limonada);
    await waitForCall(api, 'PATCH', /^\/inventory\/6\/availability$/);
    await settle();
    const after = screen.getAllByText('LIMONADA').map((n) => n.closest('button')).find(Boolean);
    expect(after.className).toBe(before);
  });
});
