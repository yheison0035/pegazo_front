import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
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
  setField,
  field,
  button,
  rowButton,
  placeholder,
  waitForCall,
  money,
  router,
} from '@/test/behaviorHarness';
import CompanyDetailPage from '../[id]/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const DETAIL = {
  company: { id: 90, name: 'NEGOCIO UNO', type: 'COMERCIO', status: 'ACTIVO', plan: 'ORBITA', logo: '', billingMode: 'mensual', paymentDay: 15, monthlyPrice: 150000, manager: 'ANA', phone: '3000000000', websiteEnabled: true, domain: 'tienda.co', bankNotifyEnabled: false, electronicInvoicingEnabled: true, wompiEnabled: false, enabledModules: ['sales', 'inventory'], startDate: '2026-01-15T00:00:00.000Z' },
  billing: { paidUntil: '2026-11-15T00:00:00.000Z', daysLeft: 16, overdue: false },
  salesMonth: { total: 2500000, count: 42 },
  counts: { users: 3, locals: 2 },
  users: [
    { id: 11, name: 'Carlos Pérez', email: 'carlos@uno.test', role: 'ADMIN', status: 'ACTIVO', localId: 1 },
  ],
  locals: [{ id: 1, name: 'Sede Centro' }, { id: 2, name: 'Sede Norte' }],
  payments: [
    { id: 5, paidAt: '2026-10-15T00:00:00.000Z', months: 1, periodFrom: '2026-10-15', periodTo: '2026-11-15', unitPrice: 150000, discountType: null, discountValue: 0, amount: 150000, method: 'TRANSFERENCIA', note: '' },
  ],
  paymentsSummary: { count: 1, totalPaid: 150000, lastPaidAt: '2026-10-15T00:00:00.000Z' },
};

function detailApi(detail = DETAIL) {
  return installApi([
    on('GET', /^\/companies\/platform\/1\/detail$/, ok(detail)),
    on('PATCH', /^\/companies\/1\/status$/, ok({})),
    on('PATCH', /^\/companies\/platform\/1\/renew$/, ok({})),
    on('POST', /^\/users\/platform\/company\/1$/, ok({ id: 99 })),
    on('PATCH', /^\/users\/platform\/\d+$/, ok({})),
    on('PATCH', /^\/users\/platform\/\d+\/reset-password$/, ok({})),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · Panel 360° de empresa', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = detailApi();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => vi.restoreAllMocks());

  it('muestra encabezado, KPIs, funciones, usuarios e historial de pagos', async () => {
    await renderPage(<CompanyDetailPage />);
    await waitForCall(api, 'GET', /^\/companies\/platform\/1\/detail$/);
    expect(await screen.findByRole('heading', { name: 'NEGOCIO UNO' })).toBeInTheDocument();
    expect(screen.getByText('16 días restantes')).toBeInTheDocument();
    expect(screen.getByText(money(2500000))).toBeInTheDocument();
    expect(screen.getByText('42 ventas')).toBeInTheDocument();
    expect(screen.getByText('Usuarios (1)')).toBeInTheDocument();
    expect(screen.getByText('Carlos Pérez')).toBeInTheDocument();
    expect(screen.getByText('Historial de pagos (1)')).toBeInTheDocument();
    expect(screen.getByText('sales')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Editar/ })).toHaveAttribute('href', '/platform/companies/edit/1');
  });

  it('registrar un pago calcula el total y lo envía', async () => {
    await renderPage(<CompanyDetailPage />);
    await screen.findByRole('heading', { name: 'NEGOCIO UNO' });
    await click(button(/Registrar pago/));
    const heading = await screen.findByRole('heading', { name: 'Registrar pago' });
    const modal = within(heading.closest('.fixed'));
    await typeInto(modal.getByDisplayValue('1'), '3');
    expect(modal.getAllByText(money(450000)).length).toBeGreaterThan(0);
    await click(modal.getByRole('button', { name: /Registrar pago|Confirmar|Guardar/ }));
    const call = await waitForCall(api, 'PATCH', /^\/companies\/platform\/1\/renew$/);
    expect(call.body).toMatchObject({ months: 3, unitPrice: 150000, method: 'TRANSFERENCIA' });
    await waitForCall(api, 'GET', /^\/companies\/platform\/1\/detail$/, { count: 2 });
    expect(await screen.findByText(/Pago registrado: \+3 mes/)).toBeInTheDocument();
  });

  it('suspender pide confirmación y cambia el estado', async () => {
    window.confirm.mockReturnValueOnce(false);
    await renderPage(<CompanyDetailPage />);
    await screen.findByRole('heading', { name: 'NEGOCIO UNO' });
    await click(button(/Suspender/));
    expect(api.count('PATCH', /status$/)).toBe(0);
    await click(button(/Suspender/));
    const call = await waitForCall(api, 'PATCH', /^\/companies\/1\/status$/);
    expect(call.body).toEqual({ status: 'INACTIVO' });
    await waitForCall(api, 'GET', /^\/companies\/platform\/1\/detail$/, { count: 2 });
  });

  it('agregar un usuario exige nombre, correo y clave y lo crea en la empresa', async () => {
    await renderPage(<CompanyDetailPage />);
    await screen.findByRole('heading', { name: 'NEGOCIO UNO' });
    await click(button(/Agregar usuario/));
    expect(await screen.findByText('Nuevo usuario')).toBeInTheDocument();
    await click(button('Crear usuario'));
    expect(await screen.findByText(/Nombre, correo y contraseña/)).toBeInTheDocument();
    expect(api.count('POST', /company\/90$/)).toBe(0);
    const modal = within(screen.getByText('Nuevo usuario').closest('.fixed'));
    await typeInto(modal.getByPlaceholderText('correo@negocio.com'), 'nuevo@uno.test');
    await typeInto(modal.getByPlaceholderText('Mínimo 6 caracteres'), 'secreto1');
    // nombre: primer input del modal
    await typeInto(modal.getAllByRole('textbox')[0], 'Nuevo Usuario');
    await typeInto(modal.getByDisplayValue('ASESOR'), 'CAJA');
    await typeInto(modal.getByDisplayValue('Sin sede'), '2');
    await click(button('Crear usuario'));
    const call = await waitForCall(api, 'POST', /^\/users\/platform\/company\/1$/);
    expect(call.body).toEqual({ name: 'Nuevo Usuario', email: 'nuevo@uno.test', password: 'secreto1', role: 'CAJA', localId: 2 });
    await waitForCall(api, 'GET', /^\/companies\/platform\/1\/detail$/, { count: 2 });
  });

  it('editar un usuario guarda rol/estado/sede y, si se escribe, la nueva clave', async () => {
    await renderPage(<CompanyDetailPage />);
    await screen.findByRole('heading', { name: 'NEGOCIO UNO' });
    await click(rowButton('Carlos Pérez', 'Editar usuario'));
    expect(await screen.findByText('Editar usuario')).toBeInTheDocument();
    const modal = within(screen.getByText('Editar usuario').closest('.fixed'));
    expect(modal.getByDisplayValue('carlos@uno.test')).toBeDisabled();
    await typeInto(modal.getByDisplayValue('ADMIN'), 'COORDINADOR');
    await typeInto(modal.getByDisplayValue('Activo'), 'INACTIVO');
    await typeInto(modal.getByPlaceholderText(/Déjalo vacío/), 'nuevaClave1');
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PATCH', /^\/users\/platform\/11$/);
    expect(call.body).toEqual({ name: 'Carlos Pérez', role: 'COORDINADOR', status: 'INACTIVO', localId: 1 });
    const reset = await waitForCall(api, 'PATCH', /^\/users\/platform\/11\/reset-password$/);
    expect(reset.body).toEqual({ password: 'nuevaClave1' });
  });

  it('si falla el registro de pago, el modal muestra el error', async () => {
    api.set('PATCH', /^\/companies\/platform\/1\/renew$/, fail(400, 'Pago rechazado'));
    await renderPage(<CompanyDetailPage />);
    await screen.findByRole('heading', { name: 'NEGOCIO UNO' });
    await click(button(/Registrar pago/));
    const heading = await screen.findByRole('heading', { name: 'Registrar pago' });
    const modal = within(heading.closest('.fixed'));
    await click(modal.getByRole('button', { name: /Registrar pago|Confirmar|Guardar/ }));
    expect(await screen.findByText('Pago rechazado')).toBeInTheDocument();
  });

  it('solo el administrador de plataforma entra', async () => {
    vi.restoreAllMocks();
    resetBehavior({ role: 'SUPER_ADMIN' });
    detailApi();
    await renderPage(<CompanyDetailPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
