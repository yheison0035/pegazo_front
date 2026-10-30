import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  ok,
  fail,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  waitForCall,
  router,
} from '@/test/behaviorHarness';
import StatisticsPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const OVERVIEW = {
  totals: { mrr: 1500000, arr: 18000000, revenueAtRisk: 200000, companies: 12, active: 9, suspended: 2, overdue: 1, users: 40, locals: 15 },
  growth: [{ key: '2026-01', label: 'Ene', count: 2 }, { key: '2026-02', label: 'Feb', count: 5 }],
  byType: [{ type: 'COMERCIO', count: 7 }, { type: 'BARBERIA', count: 5 }],
  byPlan: [{ plan: 'ORBITA', count: 8 }, { plan: 'IMPULSO', count: 4 }],
  expiringSoon: [{ id: 3, name: 'NEGOCIO TRES', paidUntil: '2026-11-03' }],
};
const EMPTY = { totals: { mrr: 0, arr: 0, revenueAtRisk: 0, companies: 0, active: 0, suspended: 0, overdue: 0, users: 0, locals: 0 }, growth: [], byType: [], byPlan: [], expiringSoon: [] };
const cardValue = (label) => screen.getByText(label).nextElementSibling.textContent;

function statsApi(overview = OVERVIEW) {
  return installApi([
    on('GET', /^\/companies\/platform\/overview$/, ok(overview)),
    on('GET', /^\/companies\/platform\/audit$/, ok([{ id: 1, createdAt: '2026-10-29T10:00:00.000Z', companyName: 'NEGOCIO UNO', actorEmail: 'root@pegazo.co' }])),
    on('GET', /^\/companies\/platform\/activity$/, ok([{ id: 1, createdAt: '2026-10-29T11:00:00.000Z', companyName: 'NEGOCIO DOS', action: 'CREATE', entity: 'Product', entityId: 55, userName: 'Luis' }])),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · Estadísticas globales', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = statsApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('muestra ingresos, portafolio, crecimiento, desgloses, vencimientos, auditoría y actividad', async () => {
    await renderPage(<StatisticsPage />);
    await waitForCall(api, 'GET', /^\/companies\/platform\/overview$/);
    expect((await waitForCall(api, 'GET', /^\/companies\/platform\/audit$/)).query.limit).toBe('30');
    expect((await waitForCall(api, 'GET', /^\/companies\/platform\/activity$/)).query.limit).toBe('40');
    await screen.findByText(/1\.500\.000/);
    expect(screen.getByText(/18\.000\.000/)).toBeInTheDocument();
    expect(cardValue('Empresas')).toBe('12');
    expect(cardValue('Activas')).toBe('9');
    expect(cardValue('Suspendidas')).toBe('2');
    expect(cardValue('Vencidas')).toBe('1');
    expect(cardValue('Usuarios')).toBe('40');
    expect(cardValue('Locales')).toBe('15');
    expect(screen.getByText('Feb')).toBeInTheDocument();
    expect(screen.getByTitle('5 altas')).toBeInTheDocument();
    expect(screen.getByText('COMERCIO')).toBeInTheDocument();
    expect(screen.getByText('ORBITA')).toBeInTheDocument();
    expect(screen.getByText('NEGOCIO TRES')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gestionar' })).toHaveAttribute('href', '/platform/companies/edit/3');
    expect(screen.getByText('root@pegazo.co')).toBeInTheDocument();
    expect(screen.getByText('Creó')).toBeInTheDocument();
    expect(screen.getByText('Product #55')).toBeInTheDocument();
    expect(screen.getByText('Luis')).toBeInTheDocument();
  });

  it('sin datos muestra los vacíos de cada bloque', async () => {
    api = statsApi(EMPTY);
    api.set('GET', /^\/companies\/platform\/audit$/, ok([]));
    api.set('GET', /^\/companies\/platform\/activity$/, ok([]));
    await renderPage(<StatisticsPage />);
    expect(await screen.findByText('Sin datos de crecimiento.')).toBeInTheDocument();
    expect(screen.getAllByText('Sin datos.')).toHaveLength(2);
    expect(screen.getByText('Ninguna empresa vence en los próximos 7 días.')).toBeInTheDocument();
    expect(screen.getByText('Aún no hay accesos de soporte registrados.')).toBeInTheDocument();
    expect(screen.getByText('Sin actividad registrada todavía.')).toBeInTheDocument();
  });

  it('si fallan auditoría o actividad, el resumen igual se muestra', async () => {
    api.set('GET', /^\/companies\/platform\/audit$/, fail(400, 'Sin auditoría'));
    api.set('GET', /^\/companies\/platform\/activity$/, fail(400, 'Sin actividad'));
    await renderPage(<StatisticsPage />);
    expect(await screen.findByText('NEGOCIO TRES')).toBeInTheDocument();
    expect(screen.getByText('Aún no hay accesos de soporte registrados.')).toBeInTheDocument();
    expect(screen.getByText('Sin actividad registrada todavía.')).toBeInTheDocument();
  });

  it('si falla el resumen, se avisa', async () => {
    api.set('GET', /^\/companies\/platform\/overview$/, fail(400, 'Resumen no disponible'));
    await renderPage(<StatisticsPage />);
    expect(await screen.findByText('Resumen no disponible')).toBeInTheDocument();
  });

  it('solo el administrador de plataforma entra', async () => {
    vi.restoreAllMocks();
    resetBehavior({ role: 'SUPER_ADMIN' });
    statsApi();
    await renderPage(<StatisticsPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
