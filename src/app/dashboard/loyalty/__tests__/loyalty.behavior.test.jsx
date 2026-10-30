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
  typeInto,
  button,
  placeholder,
  waitForCall,
  expectToast,
  router,
} from '@/test/behaviorHarness';
import LoyaltyPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const ACTIVE = [
  { id: 1, name: 'ANA PÉREZ', phone: '3001234567', document: '1001', loyalty: { currentCount: 5, nextDiscount: 20, completed: false, expired: false } },
  { id: 2, name: 'LUIS GÓMEZ', phone: '', document: '1002', loyalty: { currentCount: 2, nextDiscount: 0, completed: false, expired: false } },
];
const DONE = [{ id: 3, name: 'MARTA RUIZ', phone: '3109876543', document: '1003', loyalty: { currentCount: 8, nextDiscount: 0, completed: true, expired: false } }];

function loyaltyApi() {
  return installApi([
    on('GET', /^\/customers\/loyalty$/, (c) => ({
      success: true,
      data: c.query.completed === 'true' ? DONE : ACTIVE,
      config: { loyaltyTier2Visits: 8, loyaltyEnabled: true },
      meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
    })),
    on('POST', /^\/company\/loyalty\/sync$/, ok({ customersUpdated: 12, salesProcessed: 340 })),
    ...baseRoutes(),
  ]);
}

describe('Fidelización', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'BARBERIA' });
    api = loyaltyApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista los clientes acumulando visitas con su progreso y premio', async () => {
    await renderPage(<LoyaltyPage />);
    const call = await waitForCall(api, 'GET', /^\/customers\/loyalty$/);
    expect(call.query).toMatchObject({ page: '1', completed: 'false' });
    expect(await screen.findByText('ANA PÉREZ')).toBeInTheDocument();
    expect(screen.getByText('5/8 visitas')).toBeInTheDocument();
    expect(screen.getByText(/20% dcto/)).toBeInTheDocument();
    expect(screen.getByText('ANA PÉREZ').closest('a')).toHaveAttribute('href', '/dashboard/customers/1');
    expect(screen.getByText('Sin teléfono')).toBeInTheDocument();
  });

  it('la pestaña de clientes antiguos consulta los completados', async () => {
    await renderPage(<LoyaltyPage />);
    await screen.findByText('ANA PÉREZ');
    await click(button(/Clientes antiguos/));
    const call = await waitForCall(api, 'GET', /^\/customers\/loyalty$/, { count: 2 });
    expect(call.query.completed).toBe('true');
    expect(await screen.findByText('MARTA RUIZ')).toBeInTheDocument();
  });

  it('el buscador manda el texto al backend', async () => {
    await renderPage(<LoyaltyPage />);
    await screen.findByText('ANA PÉREZ');
    await typeInto(placeholder('Buscar cliente por nombre, teléfono o documento'), 'ana');
    const call = await waitForCall(api, 'GET', /^\/customers\/loyalty$/, { count: 2 });
    expect(call.query.search).toBe('ana');
  });

  it('"Sincronizar con ventas" recalcula los sellos y resume el resultado', async () => {
    await renderPage(<LoyaltyPage />);
    await screen.findByText('ANA PÉREZ');
    await click(button(/Sincronizar con ventas/));
    await waitForCall(api, 'POST', /^\/company\/loyalty\/sync$/);
    const t = await expectToast('success', 'Sincronizado');
    expect(t.message).toContain('12 clientes');
    expect(t.message).toContain('340 ventas');
    await waitForCall(api, 'GET', /^\/customers\/loyalty$/, { count: 2 });
  });

  it('si la sincronización falla, se avisa', async () => {
    api.set('POST', /^\/company\/loyalty\/sync$/, fail(400, 'Fidelización desactivada'));
    await renderPage(<LoyaltyPage />);
    await screen.findByText('ANA PÉREZ');
    await click(button(/Sincronizar con ventas/));
    await expectToast('error', 'Fidelización desactivada');
  });

  it('el barbero no entra a fidelización', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    loyaltyApi();
    await renderPage(<LoyaltyPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
