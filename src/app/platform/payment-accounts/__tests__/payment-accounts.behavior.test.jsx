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
  click,
  typeInto,
  button,
  waitForCall,
  expectToast,
  router,
} from '@/test/behaviorHarness';
import PaymentAccountsPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const SETTINGS = { bankName: 'BANCOLOMBIA', accountType: 'AHORROS', accountNumber: '123456', accountHolder: 'PEGAZO SAS', whatsappNumber: '573001234567', instructions: '' };

function paymentApi() {
  return installApi([
    on('GET', /^\/platform-payment\/settings$/, ok(SETTINGS)),
    on('PUT', /^\/platform-payment\/settings$/, (c) => ok(c.body)),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · Cuentas de pago', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = paymentApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga los datos de la cuenta', async () => {
    await renderPage(<PaymentAccountsPage />);
    await waitForCall(api, 'GET', /^\/platform-payment\/settings$/);
    expect(await screen.findByDisplayValue('BANCOLOMBIA')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PEGAZO SAS')).toBeInTheDocument();
    expect(screen.getByRole('combobox').value).toBe('AHORROS');
  });

  it('guardar envía todos los campos editados', async () => {
    await renderPage(<PaymentAccountsPage />);
    await screen.findByDisplayValue('BANCOLOMBIA');
    await typeInto(screen.getByDisplayValue('123456'), '987654');
    await typeInto(screen.getByRole('combobox'), 'CORRIENTE');
    await typeInto(screen.getByPlaceholderText(/Texto que verá el negocio/), 'Enviar comprobante al WhatsApp');
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PUT', /^\/platform-payment\/settings$/);
    expect(call.body).toEqual({ ...SETTINGS, accountNumber: '987654', accountType: 'CORRIENTE', instructions: 'Enviar comprobante al WhatsApp' });
    await expectToast('success', 'Cuentas de pago actualizadas.');
  });

  it('si el backend rechaza, muestra el error', async () => {
    api.set('PUT', /^\/platform-payment\/settings$/, fail(400, 'Número inválido'));
    await renderPage(<PaymentAccountsPage />);
    await screen.findByDisplayValue('BANCOLOMBIA');
    await click(button('Guardar'));
    await waitForCall(api, 'PUT', /^\/platform-payment\/settings$/);
    await expectToast('error', 'Número inválido');
  });

  it('si falla la carga, se avisa', async () => {
    api.set('GET', /^\/platform-payment\/settings$/, fail(400, 'Sin acceso'));
    await renderPage(<PaymentAccountsPage />);
    await waitForCall(api, 'GET', /^\/platform-payment\/settings$/);
    await expectToast('error', 'Sin acceso');
  });

  it('solo el administrador de plataforma entra', async () => {
    vi.restoreAllMocks();
    resetBehavior({ role: 'SUPER_ADMIN' });
    paymentApi();
    await renderPage(<PaymentAccountsPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
