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
  waitFor,
  click,
  typeInto,
  button,
  placeholder,
  waitForCall,
  expectToast,
  router,
} from '@/test/behaviorHarness';
import AiPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const NO_KEY = { enabled: false, provider: 'gemini', model: 'gemini-3.6-flash', baseUrl: '', keyPreview: '', hasKey: false };
const WITH_KEY = { enabled: true, provider: 'gemini', model: 'gemini-3.6-flash', baseUrl: '', keyPreview: 'AIza…9f', hasKey: true };

function aiApi(settings = NO_KEY) {
  return installApi([
    on('GET', /^\/platform-ai\/settings$/, ok(settings)),
    on('PUT', /^\/platform-ai\/settings$/, (c) => ok({ ...settings, ...c.body, hasKey: settings.hasKey || !!c.body.apiKey, keyPreview: c.body.apiKey ? `${c.body.apiKey.slice(0, 4)}…` : settings.keyPreview, apiKey: undefined })),
    on('POST', /^\/platform-ai\/generate\/product$/, ok({ description: '<p>Gran sonido y batería de 20 horas.</p>', features: ['Bluetooth 5.3'] })),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · Inteligencia Artificial', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = aiApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('sin key muestra "Aún sin conectar" y no deja probar la conexión', async () => {
    await renderPage(<AiPage />);
    await waitForCall(api, 'GET', /^\/platform-ai\/settings$/);
    expect(await screen.findByText('Aún sin conectar')).toBeInTheDocument();
    expect(button('Probar conexión')).toBeDisabled();
    expect(screen.getByRole('checkbox').checked).toBe(false);
  });

  it('cambiar de proveedor propone su modelo y muestra la Base URL', async () => {
    await renderPage(<AiPage />);
    await screen.findByText('Aún sin conectar');
    expect(screen.queryByPlaceholderText('https://api.groq.com/openai/v1')).toBeNull();
    await typeInto(screen.getByRole('combobox'), 'openai');
    expect(screen.getByDisplayValue('llama-3.3-70b-versatile')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://api.groq.com/openai/v1')).toBeInTheDocument();
  });

  it('guardar envía la configuración y la key nueva recortada; luego queda conectada', async () => {
    await renderPage(<AiPage />);
    await screen.findByText('Aún sin conectar');
    await click(screen.getByRole('checkbox'));
    await typeInto(placeholder('Pega aquí tu API key'), '  AIza-nueva-123  ');
    expect(button('Probar conexión')).not.toBeDisabled();
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PUT', /^\/platform-ai\/settings$/);
    expect(call.body).toEqual({ enabled: true, provider: 'gemini', model: 'gemini-3.6-flash', baseUrl: '', apiKey: 'AIza-nueva-123' });
    await expectToast('success', 'Configuración de IA guardada.');
    expect(await screen.findByText('IA conectada')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('•••••••••• (sin cambios)').value).toBe('');
  });

  it('con key guardada, guardar sin escribir otra no la pisa', async () => {
    api = aiApi(WITH_KEY);
    await renderPage(<AiPage />);
    expect(await screen.findByText('IA conectada')).toBeInTheDocument();
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PUT', /^\/platform-ai\/settings$/);
    expect(call.body).toEqual({ enabled: true, provider: 'gemini', model: 'gemini-3.6-flash', baseUrl: '' });
  });

  it('"Probar conexión" guarda, pide un ejemplo a la IA y muestra el resultado', async () => {
    api = aiApi(WITH_KEY);
    await renderPage(<AiPage />);
    await screen.findByText('IA conectada');
    await click(button('Probar conexión'));
    await waitForCall(api, 'PUT', /^\/platform-ai\/settings$/);
    const gen = await waitForCall(api, 'POST', /^\/platform-ai\/generate\/product$/);
    expect(gen.body).toEqual({ name: 'Audífonos Bluetooth de prueba' });
    expect(await screen.findByText(/Conexión exitosa/)).toBeInTheDocument();
    expect(screen.getByText(/Gran sonido y batería de 20 horas/)).toBeInTheDocument();
    await expectToast('success', '¡IA conectada y funcionando!');
  });

  it('si la IA falla, se muestra el error', async () => {
    api = aiApi(WITH_KEY);
    api.set('POST', /^\/platform-ai\/generate\/product$/, fail(400, 'API key inválida'));
    await renderPage(<AiPage />);
    await screen.findByText('IA conectada');
    await click(button('Probar conexión'));
    await waitForCall(api, 'POST', /^\/platform-ai\/generate\/product$/);
    expect(await screen.findByText(/API key inválida/)).toBeInTheDocument();
    await expectToast('error', 'API key inválida');
  });

  it('solo el administrador de plataforma entra', async () => {
    vi.restoreAllMocks();
    resetBehavior({ role: 'SUPER_ADMIN' });
    aiApi();
    await renderPage(<AiPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
