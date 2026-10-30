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
    expect(screen.getByText('Claro suave')).toBeInTheDocument();
    expect(screen.getByText('Clásico neutro')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByPlaceholderText('Comienza tu leyenda').value).toBe('Reserva tu turno'));
  });

  it('cambiar el estilo y los textos guarda con PATCH toda la configuración', async () => {
    await renderPage(<DesignPage />);
    await waitForCall(api, 'GET', /^\/company\/booking-config$/);
    await waitFor(() => expect(screen.getByPlaceholderText('Comienza tu leyenda').value).toBe('Reserva tu turno'));
    await typeInto(placeholder('Comienza tu leyenda'), 'Tu mejor corte');
    await typeInto(placeholder('Disciplina · Estilo · Actitud'), 'Estilo · Actitud');
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PATCH', /^\/company\/booking-config$/);
    expect(call.body).toMatchObject({ skin: 'dark', tagline: 'Barbería Prueba', introCta: 'Tu mejor corte', introPills: 'Estilo · Actitud', whatsapp: '3001112233' });
    await expectToast('success', 'Diseño de la página guardado');
  });

  it('al elegir el estilo claro desaparecen los campos exclusivos del oscuro', async () => {
    await renderPage(<DesignPage />);
    await waitForCall(api, 'GET', /^\/company\/booking-config$/);
    await waitFor(() => expect(screen.getByPlaceholderText('Comienza tu leyenda')).toBeInTheDocument());
    await click(screen.getByText('Claro suave'));
    expect(screen.queryByPlaceholderText('Comienza tu leyenda')).toBeNull();
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PATCH', /^\/company\/booking-config$/);
    expect(call.body.skin).toBe('light');
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
