import { describe, it, expect, vi, afterEach } from 'vitest';
import { installApi, baseRoutes, resetBehavior, renderPage, screen, router } from '@/test/behaviorHarness';
import SettingsPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());

describe('Plataforma · Configuración', () => {
  afterEach(() => vi.restoreAllMocks());

  it('enlaza a cada sección de administración', async () => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    installApi(baseRoutes());
    await renderPage(<SettingsPage />);
    const expected = {
      Empresas: '/platform/companies',
      'Usuarios Globales': '/platform/users',
      'Planes y funciones': '/platform/plans',
      'Inteligencia Artificial': '/platform/ai',
      Cupones: '/platform/coupons',
      Comunicados: '/platform/announcements',
      'Estadísticas Globales': '/platform/statistics',
    };
    for (const [title, href] of Object.entries(expected)) {
      expect(screen.getByText(title).closest('a')).toHaveAttribute('href', href);
    }
    expect(screen.getByText('Suscripción y auto-registro activos')).toBeInTheDocument();
  });

  it('solo el administrador de plataforma entra', async () => {
    resetBehavior({ role: 'SUPER_ADMIN' });
    installApi(baseRoutes());
    await renderPage(<SettingsPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
