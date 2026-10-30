import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  waitFor,
  click,
  button,
  router,
} from '@/test/behaviorHarness';
import ContadorLayout from '../layout';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());

describe('Portal del contador · layout (sesión)', () => {
  beforeEach(() => {
    resetBehavior({ role: 'CONTADOR' });
    installApi(baseRoutes());
    try {
      localStorage.clear();
    } catch {
      /* noop */
    }
  });
  afterEach(() => vi.restoreAllMocks());

  it('con sesión de contador muestra el portal y el nombre', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('sessionType', 'accountant');
    localStorage.setItem('contador', JSON.stringify({ name: 'Contador Prueba' }));
    await renderPage(
      <ContadorLayout>
        <p>Contenido del portal</p>
      </ContadorLayout>,
    );
    expect(await screen.findByText('Contenido del portal')).toBeInTheDocument();
    expect(screen.getByText('Contador Prueba')).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('sin sesión de contador redirige a /login', async () => {
    await renderPage(
      <ContadorLayout>
        <p>Contenido del portal</p>
      </ContadorLayout>,
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
  });

  it('una sesión normal (no accountant) tampoco entra', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('sessionType', 'user');
    await renderPage(
      <ContadorLayout>
        <p>Contenido del portal</p>
      </ContadorLayout>,
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
  });

  it('"Salir" limpia la sesión y vuelve al login', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('sessionType', 'accountant');
    localStorage.setItem('contador', JSON.stringify({ name: 'Contador Prueba' }));
    await renderPage(
      <ContadorLayout>
        <p>Contenido del portal</p>
      </ContadorLayout>,
    );
    await screen.findByText('Contenido del portal');
    await click(button(/Salir/));
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('sessionType')).toBeNull();
    expect(router.push).toHaveBeenCalledWith('/login');
  });
});
