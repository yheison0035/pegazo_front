import { describe, it, expect, vi, afterEach } from 'vitest';
import { installApi, baseRoutes, resetBehavior, renderPage, screen, router } from '@/test/behaviorHarness';
import UpgradePage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());

// El módulo "Cambiar / mejorar plan" está APAGADO para todos (un solo plan por
// ahora): la pantalla no se muestra y lleva a "Mi suscripción".
describe('Mi plan · módulo apagado (interruptor real)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('redirige a facturación y no pinta nada', async () => {
    resetBehavior();
    installApi([...baseRoutes()]);
    await renderPage(<UpgradePage />);
    expect(router.replace).toHaveBeenCalledWith('/dashboard/billing');
    expect(screen.queryByText('Mi plan')).toBeNull();
  });
});
