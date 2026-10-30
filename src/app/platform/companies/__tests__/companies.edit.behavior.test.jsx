import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  ok,
  fail,
  detail,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  waitFor,
  click,
  setField,
  field,
  button,
  submitForm,
  waitForCall,
  expectToast,
  lastToast,
} from '@/test/behaviorHarness';
import EditCompanyPage from '../edit/[id]/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const COMPANY = {
  id: 1,
  name: 'NEGOCIO UNO',
  type: 'COMERCIO',
  phone: '3000000000',
  manager: 'ANA',
  status: 'ACTIVO',
  plan: 'ORBITA',
  domain: '',
  websiteEnabled: false,
  billingMode: 'mensual',
  startDate: '2026-01-15T00:00:00.000Z',
  paidUntil: '2026-03-15T00:00:00.000Z',
  monthlyPrice: 50000,
  paymentDay: 15,
  enabledModules: [],
  bankNotifyEnabled: false,
  electronicInvoicingEnabled: false,
  discountedPrice: null,
  discountUntil: null,
};

function editApi() {
  return installApi([
    on('GET', /^\/companies\/1$/, detail(COMPANY)),
    on('PUT', /^\/companies\/1$/, ok({ id: 1 })),
    on('GET', /^\/enums\/type-companies$/, ok([{ id: 'COMERCIO', name: 'COMERCIO' }])),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · Editar empresa', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = editApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga la empresa y deriva el día de pago de "Cliente desde"', async () => {
    await renderPage(<EditCompanyPage />);
    await waitForCall(api, 'GET', /^\/companies\/1$/);
    await waitFor(() => expect(field('name').value).toBe('NEGOCIO UNO'));
    expect(field('phone').value).toBe('3000000000');
    expect(String(field('paymentDay').value)).toBe('15');
    expect(field('paymentDay')).toBeDisabled();
  });

  it('guardar el formulario envía solo los campos editables (sin los del panel de módulos)', async () => {
    await renderPage(<EditCompanyPage />);
    await waitFor(() => expect(field('name').value).toBe('NEGOCIO UNO'));
    await setField('name', 'NEGOCIO UNO SAS');
    await submitForm();
    const call = await waitForCall(api, 'PUT', /^\/companies\/1$/);
    expect(call.body).toMatchObject({ name: 'NEGOCIO UNO SAS', phone: '3000000000', status: 'ACTIVO', monthlyPrice: 50000, paymentDay: 15 });
    expect(call.body.enabledModules).toBeUndefined();
    expect(call.body.electronicInvoicingEnabled).toBeUndefined();
    await expectToast('success', 'Empresa actualizada correctamente.');
    expect(lastToast().url).toBe('/platform/companies');
  });

  it('el panel de módulos guarda funciones, control manual y descuento por separado', async () => {
    await renderPage(<EditCompanyPage />);
    await waitFor(() => expect(field('name').value).toBe('NEGOCIO UNO'));
    await click(button(/Facturación electrónica DIAN/));
    await click(button('Activar control manual'));
    const parking = await screen.findByLabelText('Parqueadero');
    expect(parking.checked).toBe(true);
    await click(parking);
    await click(button('Guardar módulos y precio'));
    const call = await waitForCall(api, 'PUT', /^\/companies\/1$/);
    expect(call.body.enabledModules).not.toContain('parking');
    expect(call.body.enabledModules).toContain('sales');
    expect(call.body).toMatchObject({ electronicInvoicingEnabled: true, bankNotifyEnabled: false });
    expect(call.body.name).toBeUndefined();
    expect(await screen.findByText('Módulos, funciones y precio guardados.')).toBeInTheDocument();
    await waitForCall(api, 'GET', /^\/companies\/1$/, { count: 2 });
  });

  it('"Volver a automático" manda la lista vacía', async () => {
    api.set('GET', /^\/companies\/1$/, detail({ ...COMPANY, enabledModules: ['sales', 'inventory'] }));
    await renderPage(<EditCompanyPage />);
    await waitFor(() => expect(field('name').value).toBe('NEGOCIO UNO'));
    expect(await screen.findByText(/Control manual: el cliente solo ve/)).toBeInTheDocument();
    await click(button('Volver a automático'));
    await click(button('Guardar módulos y precio'));
    const call = await waitForCall(api, 'PUT', /^\/companies\/1$/);
    expect(call.body.enabledModules).toEqual([]);
  });

  it('si el backend rechaza el guardado, muestra el error', async () => {
    api.set('PUT', /^\/companies\/1$/, fail(400, 'Dominio en uso'));
    await renderPage(<EditCompanyPage />);
    await waitFor(() => expect(field('name').value).toBe('NEGOCIO UNO'));
    await submitForm();
    await waitForCall(api, 'PUT', /^\/companies\/1$/);
    await expectToast('error', 'Dominio en uso');
  });
});
