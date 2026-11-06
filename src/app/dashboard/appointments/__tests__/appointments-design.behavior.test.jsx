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
import DesignPage from '../design/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const CONFIG = { slug: 'barberia-prueba', skin: 'dark', accent: '#d4af37', tagline: 'Barbería Prueba', subtitle: '', whatsapp: '3001112233', introCta: 'Reserva tu turno', introPills: 'Corte · Barba', heroImage: '', ravenImage: '', musicUrl: '' };

function designApi() {
  return installApi([
    on('GET', /^\/company\/booking-config$/, ok(CONFIG)),
    on('PATCH', /^\/company\/booking-config$/, ok({})),
    ...baseRoutes(),
  ]);
}

describe('Diseño de la página de citas', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'BARBERIA' });
    api = designApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga la configuración actual y muestra los estilos disponibles', async () => {
    await renderPage(<DesignPage />);
    await waitForCall(api, 'GET', /^\/company\/booking-config$/);
    expect(await screen.findByText('Diseño de la página de citas')).toBeInTheDocument();
    expect(screen.getByText('Premium oscuro (guerrero)')).toBeInTheDocument();
    expect(screen.getByText('Elegante (negro / gris / plateado)')).toBeInTheDocument();
    expect(screen.getByText('Claro suave')).toBeInTheDocument();
    expect(screen.getByText('Clásico neutro')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByDisplayValue('Barbería Prueba')).toBeInTheDocument());
  });

  it('cambiar el título guarda con PATCH toda la configuración', async () => {
    await renderPage(<DesignPage />);
    await waitForCall(api, 'GET', /^\/company\/booking-config$/);
    await waitFor(() => expect(screen.getByDisplayValue('Barbería Prueba')).toBeInTheDocument());
    await typeInto(screen.getByDisplayValue('Barbería Prueba'), 'Tu mejor corte');
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PATCH', /^\/company\/booking-config$/);
    expect(call.body).toMatchObject({ skin: 'dark', tagline: 'Tu mejor corte', whatsapp: '3001112233' });
    await expectToast('success', 'Diseño de la página guardado');
  });

  it('al elegir el estilo claro desaparecen los campos exclusivos del oscuro', async () => {
    await renderPage(<DesignPage />);
    await waitForCall(api, 'GET', /^\/company\/booking-config$/);
    await waitFor(() => expect(screen.getByText(/Cuervo decorativo/)).toBeInTheDocument());
    await click(screen.getByText('Claro suave'));
    expect(screen.queryByText(/Cuervo decorativo/)).toBeNull();
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PATCH', /^\/company\/booking-config$/);
    expect(call.body.skin).toBe('light');
  });

  it('al elegir el estilo elegante se puede poner imagen de fondo pero no portada', async () => {
    await renderPage(<DesignPage />);
    await waitForCall(api, 'GET', /^\/company\/booking-config$/);
    await click(screen.getByText('Elegante (negro / gris / plateado)'));
    // La imagen de fondo está disponible, pero NO el cuervo (exclusivo oscuro).
    expect(screen.getAllByText('Imagen de fondo').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Cuervo decorativo/)).toBeNull();
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PATCH', /^\/company\/booking-config$/);
    expect(call.body.skin).toBe('elegant');
  });

  it('un error del backend al guardar se avisa', async () => {
    api.set('PATCH', /^\/company\/booking-config$/, fail(400, 'URL de música inválida'));
    await renderPage(<DesignPage />);
    await waitForCall(api, 'GET', /^\/company\/booking-config$/);
    await settle();
    await click(button('Guardar'));
    await waitForCall(api, 'PATCH', /^\/company\/booking-config$/);
    await expectToast('error', 'URL de música inválida');
  });

  it('solo dueño y administrador entran', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    designApi();
    await renderPage(<DesignPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
