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
  waitForCall,
  router,
  navState,
} from '@/test/behaviorHarness';
import UpgradePage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
// El módulo está apagado en producción (ver upgrade-gate.behavior.test.jsx). Aquí se
// enciende para que el flujo de pago quede verificado para cuando se reactive.
vi.mock('@/config/planChange', () => ({ PLAN_CHANGE_ENABLED: true, canChangePlan: (role) => role === 'SUPER_ADMIN' }));

function upgradeApi() {
  return installApi([
    on('POST', /^\/subscription\/checkout$/, ok({ checkoutUrl: 'https://checkout.wompi.co/p/abc' })),
    on('GET', /^\/subscription\/status$/, ok({ plan: 'ORBITA', status: 'APPROVED' })),
    ...baseRoutes(),
  ]);
}

describe('Mi plan (mejorar plan) · con el módulo encendido', () => {
  let api;
  let locationHref;
  beforeEach(() => {
    // La empresa de prueba está en IMPULSO: puede mejorar a Altura u Órbita.
    resetBehavior({ company: { plan: 'IMPULSO' } });
    api = upgradeApi();
    locationHref = '';
    const loc = { ...window.location, assign: vi.fn() };
    Object.defineProperty(loc, 'href', { get: () => locationHref, set: (v) => (locationHref = v), configurable: true });
    vi.spyOn(window, 'location', 'get').mockReturnValue(loc);
  });
  afterEach(() => vi.restoreAllMocks());

  it('muestra los planes, marca el actual y ofrece mejorar a los superiores', async () => {
    await renderPage(<UpgradePage />);
    expect(screen.getByText('Mi plan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mejorar a Altura/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mejorar a Órbita/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mejorar a Impulso/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Mejorar a Despegue/ })).toBeNull();
  });

  it('mejorar a un plan inicia el pago y redirige a la pasarela', async () => {
    await renderPage(<UpgradePage />);
    await click(screen.getByRole('button', { name: /Mejorar a Altura/ }));
    const call = await waitForCall(api, 'POST', /^\/subscription\/checkout$/);
    expect(call.body).toEqual({ plan: 'ALTURA' });
    await waitFor(() => expect(locationHref).toBe('https://checkout.wompi.co/p/abc'));
  });

  it('si la pasarela no está activa, muestra el mensaje del backend y la alternativa por WhatsApp', async () => {
    api.set('POST', /^\/subscription\/checkout$/, fail(503, 'Los pagos en línea aún no están activos. Escríbenos por WhatsApp.'));
    await renderPage(<UpgradePage />);
    await click(screen.getByRole('button', { name: /Mejorar a Órbita/ }));
    await waitForCall(api, 'POST', /^\/subscription\/checkout$/);
    expect(await screen.findByText(/aún no están activos/)).toBeInTheDocument();
    expect(locationHref).toBe('');
    expect(document.querySelector('a[href*="wa.me"]')).toBeTruthy();
  });

  it('al volver de la pasarela con ?ref= consulta el estado y lo muestra', async () => {
    navState.search = 'ref=PAY-123';
    await renderPage(<UpgradePage />);
    const call = await waitForCall(api, 'GET', /^\/subscription\/status$/);
    expect(call.query.ref).toBe('PAY-123');
    expect(await screen.findByText(/Pago aprobado/)).toBeInTheDocument();
  });

  it('un pago rechazado se informa', async () => {
    navState.search = 'ref=PAY-999';
    api.set('GET', /^\/subscription\/status$/, ok({ plan: 'ORBITA', status: 'DECLINED' }));
    await renderPage(<UpgradePage />);
    expect(await screen.findByText(/El pago fue rechazado/)).toBeInTheDocument();
  });

  it('solo el dueño gestiona el plan', async () => {
    resetBehavior({ role: 'ADMIN' });
    upgradeApi();
    await renderPage(<UpgradePage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
