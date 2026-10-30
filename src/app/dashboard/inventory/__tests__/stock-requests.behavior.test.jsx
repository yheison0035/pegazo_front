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
  button,
  placeholder,
  waitForCall,
  expectToast,
  router,
} from '@/test/behaviorHarness';
import StockRequestsPage from '../stock-requests/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const PENDING = [
  {
    id: 1,
    status: 'PENDING',
    reason: 'conteo físico',
    createdAt: '2026-02-10T10:00:00.000Z',
    inventory: { name: 'CAMISETA BÁSICA' },
    requestedBy: { name: 'CARLA VENDEDORA' },
    lines: [{ id: 1, label: 'ÚNICO', currentStock: 12, requestedStock: 4, delta: -8 }],
  },
];
const REJECTED = [{ ...PENDING[0], id: 2, status: 'REJECTED', decidedBy: { name: 'Dueño Prueba' }, decidedAt: '2026-02-11T10:00:00.000Z', decisionNote: 'no coincide' }];

function requestsApi() {
  return installApi([
    on('GET', /^\/stock-requests$/, (c) => ok(c.query.status === 'REJECTED' ? REJECTED : c.query.status === 'APPROVED' ? [] : PENDING)),
    on('PATCH', /^\/stock-requests\/\d+\/approve$/, ok({ id: 1 })),
    on('PATCH', /^\/stock-requests\/\d+\/reject$/, ok({ id: 1 })),
    ...baseRoutes(),
  ]);
}

describe('Solicitudes de disminución de stock', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = requestsApi();
    window.dispatchEvent = vi.fn(window.dispatchEvent);
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga las pendientes con producto, solicitante, motivo y cantidades', async () => {
    await renderPage(<StockRequestsPage />);
    const call = await waitForCall(api, 'GET', /^\/stock-requests$/);
    expect(call.query.status).toBe('PENDING');
    expect(await screen.findByText('CAMISETA BÁSICA')).toBeInTheDocument();
    expect(screen.getByText(/CARLA VENDEDORA/)).toBeInTheDocument();
    expect(screen.getByText(/conteo físico/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Aprobar/ })).toBeInTheDocument();
  });

  it('las pestañas consultan por estado', async () => {
    await renderPage(<StockRequestsPage />);
    await screen.findByText('CAMISETA BÁSICA');
    await click(button('Rechazada'));
    const call = await waitForCall(api, 'GET', /^\/stock-requests$/, { count: 2 });
    expect(call.query.status).toBe('REJECTED');
    expect(await screen.findByText(/no coincide/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Aprobar/ })).toBeNull();
  });

  it('aprobar aplica la baja de stock y avisa al inventario', async () => {
    await renderPage(<StockRequestsPage />);
    await screen.findByText('CAMISETA BÁSICA');
    await click(screen.getByRole('button', { name: /Aprobar/ }));
    const call = await waitForCall(api, 'PATCH', /^\/stock-requests\/1\/approve$/);
    expect(call.body).toEqual({});
    await expectToast('success', 'Disminución aprobada');
    await waitForCall(api, 'GET', /^\/stock-requests$/, { count: 2 });
    expect(window.dispatchEvent.mock.calls.some(([e]) => e.type === 'stock-requests-changed')).toBe(true);
  });

  it('rechazar pide un motivo opcional y lo envía', async () => {
    await renderPage(<StockRequestsPage />);
    await screen.findByText('CAMISETA BÁSICA');
    await click(screen.getByRole('button', { name: /Rechazar/ }));
    await typeInto(placeholder('Ej: la cantidad no coincide con el conteo físico…'), 'no coincide con el conteo');
    await click(screen.getAllByRole('button', { name: /Rechazar/ }).pop());
    const call = await waitForCall(api, 'PATCH', /^\/stock-requests\/1\/reject$/);
    expect(call.body).toEqual({ note: 'no coincide con el conteo' });
    await expectToast('success', 'Solicitud rechazada');
  });

  it('si el backend rechaza la aprobación, se avisa', async () => {
    api.set('PATCH', /^\/stock-requests\/\d+\/approve$/, fail(400, 'La solicitud ya fue procesada'));
    await renderPage(<StockRequestsPage />);
    await screen.findByText('CAMISETA BÁSICA');
    await click(screen.getByRole('button', { name: /Aprobar/ }));
    await expectToast('error', 'ya fue procesada');
  });

  it('solo dueño y administrador entran', async () => {
    resetBehavior({ role: 'ASESOR' });
    requestsApi();
    await renderPage(<StockRequestsPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
