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
  fireEvent,
  act,
  click,
  typeInto,
  button,
  waitForCall,
  expectToast,
  router,
} from '@/test/behaviorHarness';
import FiscalPtPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const CFG = { legalName: 'PEGAZO SAS', nit: '901111222', dv: '3', softwareId: 'soft-1', testSetId: 'ts-1', env: 'HABILITACION', hasCertificate: false, hasSoftwarePin: true, certExpiresAt: null };

function ptApi() {
  return installApi([
    on('GET', /^\/fiscal-consumers\/pt-config$/, ok(CFG)),
    on('PATCH', /^\/fiscal-consumers\/pt-config$/, ok({})),
    on('POST', /^\/fiscal-consumers\/pt-config\/certificate$/, ok({})),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · Proveedor tecnológico (PT)', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = ptApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga la configuración y el estado del PT', async () => {
    await renderPage(<FiscalPtPage />);
    await waitForCall(api, 'GET', /^\/fiscal-consumers\/pt-config$/);
    expect(await screen.findByDisplayValue('PEGAZO SAS')).toBeInTheDocument();
    expect(screen.getByDisplayValue('901111222')).toBeInTheDocument();
    expect(screen.getByText('Pruebas')).toBeInTheDocument();
    expect(screen.getByText('Falta')).toBeInTheDocument();
    expect(screen.getAllByText('OK')).toHaveLength(2);
    expect(screen.getByPlaceholderText('•••• (guardado)')).toBeInTheDocument();
    expect(button('Subir certificado')).toBeInTheDocument();
  });

  it('guardar datos no envía el PIN si no se escribió y recarga', async () => {
    await renderPage(<FiscalPtPage />);
    await screen.findByDisplayValue('PEGAZO SAS');
    await typeInto(screen.getByDisplayValue('PEGAZO SAS'), 'PEGAZO S.A.S.');
    await typeInto(screen.getByRole('combobox'), 'PRODUCCION');
    await click(button('Guardar datos'));
    const call = await waitForCall(api, 'PATCH', /^\/fiscal-consumers\/pt-config$/);
    expect(call.body).toEqual({ legalName: 'PEGAZO S.A.S.', nit: '901111222', dv: '3', softwareId: 'soft-1', testSetId: 'ts-1', env: 'PRODUCCION' });
    await expectToast('success', 'Configuración del PT guardada.');
    await waitForCall(api, 'GET', /^\/fiscal-consumers\/pt-config$/, { count: 2 });
  });

  it('con PIN escrito, sí viaja', async () => {
    await renderPage(<FiscalPtPage />);
    await screen.findByDisplayValue('PEGAZO SAS');
    await typeInto(screen.getByPlaceholderText('•••• (guardado)'), '1234');
    await click(button('Guardar datos'));
    const call = await waitForCall(api, 'PATCH', /^\/fiscal-consumers\/pt-config$/);
    expect(call.body.softwarePin).toBe('1234');
  });

  it('subir certificado exige archivo y clave, y envía el .p12 en base64', async () => {
    await renderPage(<FiscalPtPage />);
    await screen.findByDisplayValue('PEGAZO SAS');
    await click(button('Subir certificado'));
    await expectToast('warning', 'Selecciona el .p12.');
    const fileInput = document.querySelector('input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [new File(['abc'], 'cert.p12', { type: 'application/x-pkcs12' })] } });
    });
    await click(button('Subir certificado'));
    await expectToast('warning', 'Escribe la clave del certificado.');
    expect(api.count('POST', /certificate$/)).toBe(0);
    await typeInto(document.querySelector('input[type="password"]'), 'clave-p12');
    await typeInto(document.querySelector('input[type="date"]'), '2027-01-01');
    await click(button('Subir certificado'));
    const call = await waitForCall(api, 'POST', /^\/fiscal-consumers\/pt-config\/certificate$/);
    expect(call.body).toEqual({ p12Base64: 'YWJj', password: 'clave-p12', expiresAt: '2027-01-01' });
    await expectToast('success', 'Certificado del PT cargado y cifrado.');
    await waitForCall(api, 'GET', /^\/fiscal-consumers\/pt-config$/, { count: 2 });
  });

  it('si el backend rechaza, se avisa', async () => {
    api.set('PATCH', /^\/fiscal-consumers\/pt-config$/, fail(400, 'NIT inválido'));
    await renderPage(<FiscalPtPage />);
    await screen.findByDisplayValue('PEGAZO SAS');
    await click(button('Guardar datos'));
    await expectToast('error', 'NIT inválido');
  });

  it('solo el administrador de plataforma entra', async () => {
    vi.restoreAllMocks();
    resetBehavior({ role: 'SUPER_ADMIN' });
    ptApi();
    await renderPage(<FiscalPtPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
