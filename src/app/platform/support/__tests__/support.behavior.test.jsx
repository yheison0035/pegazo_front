import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  ok,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  waitFor,
  fireEvent,
  act,
  click,
  typeInto,
  placeholder,
  waitForCall,
  router,
} from '@/test/behaviorHarness';
import SupportPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const NOW = new Date().toISOString();
const THREADS = [
  { companyId: 1, companyName: 'NEGOCIO UNO', logo: '', lastMessage: 'Hola, necesito ayuda', lastFromPlatform: false, lastAt: NOW, unread: 2 },
  { companyId: 2, companyName: 'NEGOCIO DOS', logo: '', lastMessage: 'Gracias', lastFromPlatform: true, lastAt: NOW, unread: 0 },
];
const THREAD_1 = {
  company: { name: 'NEGOCIO UNO', type: 'COMERCIO' },
  messages: [
    { id: 1, fromPlatform: false, body: 'Hola, necesito ayuda', senderName: 'Ana', createdAt: NOW },
    { id: 2, fromPlatform: true, body: 'Claro, dime', createdAt: NOW },
  ],
};

function supportApi() {
  return installApi([
    on('GET', /^\/support\/threads$/, ok(THREADS)),
    on('GET', /^\/support\/threads\/1$/, ok(THREAD_1)),
    on('POST', /^\/support\/threads\/1$/, ok({ id: 3 })),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · Soporte', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = supportApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista las conversaciones con no leídos y pide elegir una', async () => {
    await renderPage(<SupportPage />);
    await waitForCall(api, 'GET', /^\/support\/threads$/);
    expect(await screen.findByText('NEGOCIO UNO')).toBeInTheDocument();
    expect(screen.getByText('Hola, necesito ayuda')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/Tú: /)).toBeInTheDocument();
    expect(screen.getByText('Elige una conversación para responder.')).toBeInTheDocument();
  });

  it('abrir una conversación carga sus mensajes y limpia el contador', async () => {
    await renderPage(<SupportPage />);
    await screen.findByText('NEGOCIO UNO');
    await click(screen.getByText('NEGOCIO UNO'));
    await waitForCall(api, 'GET', /^\/support\/threads\/1$/);
    expect(await screen.findByText('Claro, dime')).toBeInTheDocument();
    expect(screen.getByText(/Ana ·/)).toBeInTheDocument();
    expect(screen.getByText('COMERCIO')).toBeInTheDocument();
    expect(screen.queryByText('2')).toBeNull();
  });

  it('responder con Enter envía el mensaje, lo muestra y recarga el hilo', async () => {
    await renderPage(<SupportPage />);
    await screen.findByText('NEGOCIO UNO');
    await click(screen.getByText('NEGOCIO UNO'));
    await screen.findByText('Claro, dime');
    const box = placeholder('Responder…');
    const sendBtn = box.nextElementSibling;
    expect(sendBtn).toBeDisabled();
    await typeInto(box, 'Revisa tu correo, te envié la guía.');
    expect(sendBtn).not.toBeDisabled();
    api.set('POST', /^\/support\/threads\/1$/, (c) => {
      api.set('GET', /^\/support\/threads\/1$/, ok({ ...THREAD_1, messages: [...THREAD_1.messages, { id: 3, fromPlatform: true, body: c.body.body, createdAt: NOW }] }));
      return ok({ id: 3 });
    });
    await act(async () => {
      fireEvent.keyDown(box, { key: 'Enter' });
    });
    const call = await waitForCall(api, 'POST', /^\/support\/threads\/1$/);
    expect(call.body).toEqual({ body: 'Revisa tu correo, te envié la guía.' });
    expect(screen.getByText('Revisa tu correo, te envié la guía.')).toBeInTheDocument();
    expect(box.value).toBe('');
    await waitForCall(api, 'GET', /^\/support\/threads\/1$/, { count: 2 });
    await waitForCall(api, 'GET', /^\/support\/threads$/, { count: 2 });
  });

  it('el botón de enviar también manda el mensaje', async () => {
    await renderPage(<SupportPage />);
    await screen.findByText('NEGOCIO UNO');
    await click(screen.getByText('NEGOCIO UNO'));
    await screen.findByText('Claro, dime');
    const box = placeholder('Responder…');
    await typeInto(box, 'Listo');
    await click(box.nextElementSibling);
    const call = await waitForCall(api, 'POST', /^\/support\/threads\/1$/);
    expect(call.body).toEqual({ body: 'Listo' });
  });

  it('solo el administrador de plataforma entra', async () => {
    vi.restoreAllMocks();
    resetBehavior({ role: 'SUPER_ADMIN' });
    supportApi();
    await renderPage(<SupportPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
