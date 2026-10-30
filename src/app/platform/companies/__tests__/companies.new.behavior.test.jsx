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
  setField,
  invalidFields,
  submitForm,
  waitForCall,
  expectToast,
  lastToast,
} from '@/test/behaviorHarness';
import NewCompanyPage from '../new/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

function newApi() {
  return installApi([
    on('GET', /^\/enums\/type-companies$/, ok([{ id: 'COMERCIO', name: 'COMERCIO' }, { id: 'BARBERIA', name: 'BARBERIA' }])),
    on('POST', /^\/companies$/, ok({ id: 9 })),
    ...baseRoutes(),
  ]);
}

async function fillCompany() {
  await setField('name', 'Negocio Nuevo');
  await setField('phone', '3001112233');
  await setField('manager', 'Ana');
  await setField('status', 'ACTIVO');
  await setField('adminEmail', 'ana@nuevo.test');
  await setField('adminPassword', 'Secreta1');
}

describe('Plataforma · Crear empresa', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = newApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('no envía sin los campos obligatorios', async () => {
    await renderPage(<NewCompanyPage />);
    await screen.findByText('Crear Empresa Nueva');
    // La validación nativa bloquea el envío: el formulario no llega al backend.
    const invalid = invalidFields().map((s) => s.split(':')[0]);
    for (const n of ['name', 'phone', 'manager', 'status', 'adminEmail', 'adminPassword']) expect(invalid).toContain(n);
    expect(api.count('POST', /^\/companies$/)).toBe(0);
  });

  it('crea la empresa con su administrador y avisa con el correo de acceso', async () => {
    await renderPage(<NewCompanyPage />);
    await screen.findByText('Crear Empresa Nueva');
    await fillCompany();
    await submitForm();
    const call = await waitForCall(api, 'POST', /^\/companies$/);
    expect(call.body.name.toUpperCase()).toBe('NEGOCIO NUEVO');
    expect(call.body).toMatchObject({
      phone: '3001112233',
      status: 'ACTIVO',
      billingMode: 'mensual',
      electronicInvoicingEnabled: false,
      adminEmail: 'ana@nuevo.test',
      adminPassword: 'Secreta1',
    });
    expect(call.body.manager.toUpperCase()).toBe('ANA');
    await expectToast('success', /ana@nuevo\.test/);
    expect(lastToast().url).toBe('/platform/companies');
  });

  it('si el backend rechaza, muestra el error', async () => {
    api.set('POST', /^\/companies$/, fail(400, 'Ya existe una empresa con ese correo'));
    await renderPage(<NewCompanyPage />);
    await screen.findByText('Crear Empresa Nueva');
    await fillCompany();
    await submitForm();
    await waitForCall(api, 'POST', /^\/companies$/);
    await expectToast('error', 'Ya existe una empresa con ese correo');
  });
});
