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
  money,
  router,
} from '@/test/behaviorHarness';
import FiscalApiPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const CONSUMERS = [
  { id: 1, name: 'ERP Cliente X', planName: 'Prepago 500', period: 'BOLSA', includedDocs: 500, used: 120, cost: 150000, apiKeys: 2, active: true, contactEmail: '', contactPhone: '' },
];
const KEYS = [
  { id: 10, label: 'producción', prefix: 'pzk_abc', lastUsedAt: '2026-10-28T10:00:00.000Z', active: true },
  { id: 11, label: 'vieja', prefix: 'pzk_old', lastUsedAt: null, active: false },
];

function fiscalApi() {
  return installApi([
    on('GET', /^\/fiscal-consumers$/, ok(CONSUMERS)),
    on('POST', /^\/fiscal-consumers$/, ok({ name: 'Nuevo ERP', apiKey: 'pzk_live_secreta_123' })),
    on('PATCH', /^\/fiscal-consumers\/\d+$/, ok({})),
    on('PATCH', /^\/fiscal-consumers\/\d+\/plan$/, ok({})),
    on('GET', /^\/fiscal-consumers\/\d+\/keys$/, ok(KEYS)),
    on('POST', /^\/fiscal-consumers\/\d+\/keys$/, ok({ apiKey: 'pzk_live_nueva_456' })),
    on('PATCH', /^\/fiscal-consumers\/keys\/\d+\/revoke$/, ok({})),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · API de facturación DIAN', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = fiscalApi();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista los consumidores con su plan, consumo y costo', async () => {
    await renderPage(<FiscalApiPage />);
    await waitForCall(api, 'GET', /^\/fiscal-consumers$/);
    expect(await screen.findByText('ERP Cliente X')).toBeInTheDocument();
    expect(screen.getByText(/Prepago 500 ·/)).toBeInTheDocument();
    expect(screen.getByText(money(150000))).toBeInTheDocument();
    expect(screen.getByText(/2 keys/)).toBeInTheDocument();
  });

  it('crear un consumidor genera la API key y la muestra una sola vez', async () => {
    await renderPage(<FiscalApiPage />);
    await screen.findByText('ERP Cliente X');
    await typeInto(placeholder(/Nombre del consumidor/), 'Nuevo ERP');
    await click(button('Crear y generar API key'));
    const call = await waitForCall(api, 'POST', /^\/fiscal-consumers$/);
    expect(call.body).toEqual({ name: 'Nuevo ERP' });
    expect(await screen.findByText('pzk_live_secreta_123')).toBeInTheDocument();
    expect(screen.getByText(/Cópiala ahora/)).toBeInTheDocument();
    await waitForCall(api, 'GET', /^\/fiscal-consumers$/, { count: 2 });
    await click(button(/Listo, ya la copié/));
    expect(screen.queryByText('pzk_live_secreta_123')).toBeNull();
  });

  it('expandir carga las keys y permite guardar el plan', async () => {
    await renderPage(<FiscalApiPage />);
    await screen.findByText('ERP Cliente X');
    await click(screen.getByText('ERP Cliente X'));
    await waitForCall(api, 'GET', /^\/fiscal-consumers\/1\/keys$/);
    expect(await screen.findByText('producción')).toBeInTheDocument();
    expect(screen.getByText('pzk_abc…')).toBeInTheDocument();
    expect(screen.getByText('Revocada')).toBeInTheDocument();
    await click(button('Pro'));
    await click(button('Guardar plan'));
    const call = await waitForCall(api, 'PATCH', /^\/fiscal-consumers\/1\/plan$/);
    expect(call.body).toMatchObject({ planName: 'Pro (600/año)', period: 'ANUAL', includedDocs: 600, price: 180000 });
    await expectToast('success', 'Plan guardado.');
  });

  it('emitir una nueva key la muestra; revocar pide confirmación', async () => {
    await renderPage(<FiscalApiPage />);
    await screen.findByText('ERP Cliente X');
    await click(screen.getByText('ERP Cliente X'));
    await screen.findByText('producción');
    await typeInto(placeholder(/Etiqueta de la key/), 'staging');
    await click(button('Emitir API key'));
    const call = await waitForCall(api, 'POST', /^\/fiscal-consumers\/1\/keys$/);
    expect(call.body).toEqual({ label: 'staging' });
    expect(await screen.findByText('pzk_live_nueva_456')).toBeInTheDocument();
    await click(button(/Listo, ya la copié/));
    window.confirm.mockReturnValueOnce(false);
    const revokeBtn = screen.getByText('producción').closest('tr').querySelector('button[title="Revocar"]');
    await click(revokeBtn);
    expect(api.count('PATCH', /revoke$/)).toBe(0);
    await click(screen.getByText('producción').closest('tr').querySelector('button[title="Revocar"]'));
    await waitForCall(api, 'PATCH', /^\/fiscal-consumers\/keys\/10\/revoke$/);
  });

  it('activar/desactivar el consumidor', async () => {
    await renderPage(<FiscalApiPage />);
    await screen.findByText('ERP Cliente X');
    await click(screen.getByRole('checkbox'));
    const call = await waitForCall(api, 'PATCH', /^\/fiscal-consumers\/1$/);
    expect(call.body).toEqual({ active: false });
  });

  it('si falla la carga, se avisa', async () => {
    api.set('GET', /^\/fiscal-consumers$/, fail(400, 'Sin acceso'));
    await renderPage(<FiscalApiPage />);
    await waitForCall(api, 'GET', /^\/fiscal-consumers$/);
    await expectToast('error', 'Sin acceso');
  });

  it('solo el administrador de plataforma entra', async () => {
    vi.restoreAllMocks();
    resetBehavior({ role: 'SUPER_ADMIN' });
    fiscalApi();
    await renderPage(<FiscalApiPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
