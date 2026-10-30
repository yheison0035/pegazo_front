import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
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
  button,
  waitForCall,
  router,
} from '@/test/behaviorHarness';
import NotificationsPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const ITEMS = [
  { id: 1, title: 'Stock bajo: CAMISETA BÁSICA', body: 'Quedan 1 unidades.', read: false, url: '/dashboard/inventory', createdAt: '2026-02-10T10:00:00.000Z' },
  { id: 2, title: 'Nueva cita agendada', body: 'ANA PÉREZ a las 09:00.', read: true, url: '/dashboard/appointments', createdAt: '2026-02-09T10:00:00.000Z' },
];

function notificationsApi() {
  return installApi([
    on('GET', /^\/notifications$/, ok(ITEMS)),
    on('PATCH', /^\/notifications\/\d+\/read$/, ok()),
    on('PATCH', /^\/notifications\/read-all$/, ok()),
    on('GET', /^\/notifications\/unread-count$/, ok({ count: 1 })),
    ...baseRoutes(),
  ]);
}

describe('Notificaciones', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = notificationsApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga las últimas notificaciones y cuenta las no leídas en la pestaña', async () => {
    await renderPage(<NotificationsPage />);
    const call = await waitForCall(api, 'GET', /^\/notifications$/);
    expect(call.query.limit).toBe('60');
    expect(await screen.findByText('Stock bajo: CAMISETA BÁSICA')).toBeInTheDocument();
    expect(screen.getByText('Nueva cita agendada')).toBeInTheDocument();
    expect(button(/Sin leer \(1\)/)).toBeInTheDocument();
  });

  it('la pestaña "Sin leer" filtra en pantalla sin ir al backend', async () => {
    await renderPage(<NotificationsPage />);
    await screen.findByText('Nueva cita agendada');
    await click(button(/Sin leer/));
    expect(screen.queryByText('Nueva cita agendada')).toBeNull();
    expect(screen.getByText('Stock bajo: CAMISETA BÁSICA')).toBeInTheDocument();
    expect(api.count('GET', /^\/notifications$/)).toBe(1);
    await click(button('Todas'));
    expect(screen.getByText('Nueva cita agendada')).toBeInTheDocument();
  });

  it('abrir una notificación la marca leída, muestra el detalle y "Ir al detalle" navega a su pantalla', async () => {
    await renderPage(<NotificationsPage />);
    await screen.findByText('Stock bajo: CAMISETA BÁSICA');
    await click(screen.getByText('Stock bajo: CAMISETA BÁSICA'));
    await waitForCall(api, 'PATCH', /^\/notifications\/1\/read$/);
    const modal = (await screen.findAllByText('Quedan 1 unidades.')).map((n) => n.closest('.fixed')).find(Boolean);
    await click(within(modal).getByRole('button', { name: /Ir al detalle/ }));
    expect(router.push).toHaveBeenCalledWith('/dashboard/inventory');
    expect(screen.queryAllByText('Quedan 1 unidades.').map((n) => n.closest('.fixed')).filter(Boolean)).toHaveLength(0);
    // Ya no cuenta como pendiente.
    expect(screen.queryByRole('button', { name: /Sin leer \(1\)/ })).toBeNull();
  });

  it('abrir una ya leída no vuelve a marcarla y "Cerrar" solo cierra', async () => {
    await renderPage(<NotificationsPage />);
    await screen.findByText('Nueva cita agendada');
    await click(screen.getByText('Nueva cita agendada'));
    const modal = (await screen.findAllByText('ANA PÉREZ a las 09:00.')).map((n) => n.closest('.fixed')).find(Boolean);
    await click(within(modal).getByRole('button', { name: 'Cerrar' }));
    await settle();
    expect(api.count('PATCH', /read$/)).toBe(0);
    expect(router.push).not.toHaveBeenCalled();
  });

  it('"Marcar todas" llama a read-all y queda deshabilitado al no haber pendientes', async () => {
    await renderPage(<NotificationsPage />);
    await screen.findByText('Stock bajo: CAMISETA BÁSICA');
    const btn = button(/Marcar todas/);
    expect(btn).not.toBeDisabled();
    await click(btn);
    await waitForCall(api, 'PATCH', /^\/notifications\/read-all$/);
    await waitFor(() => expect(button(/Marcar todas/)).toBeDisabled());
  });

  it('"Actualizar" vuelve a consultar el backend', async () => {
    await renderPage(<NotificationsPage />);
    await screen.findByText('Stock bajo: CAMISETA BÁSICA');
    await click(button(/Actualizar/));
    await waitForCall(api, 'GET', /^\/notifications$/, { count: 2 });
  });
});
