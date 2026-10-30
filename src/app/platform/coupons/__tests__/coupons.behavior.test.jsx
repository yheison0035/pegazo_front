import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  ok,
  fail,
  list,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  waitFor,
  click,
  typeInto,
  button,
  rowWith,
  submitForm,
  waitForCall,
  expectToast,
  router,
} from '@/test/behaviorHarness';
import CouponsPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const LIST_RE = /^\/coupons$/;
const COUPONS = [
  { id: 1, code: 'BIENVENIDO10', description: 'Para nuevos negocios', discountType: 'PERCENT', discountValue: 10, appliesToPlan: '', maxRedemptions: 100, timesRedeemed: 3, expiresAt: '2026-12-31T00:00:00.000Z', active: true },
  { id: 2, code: 'FIJO5K', description: '', discountType: 'FIXED', discountValue: 5000, appliesToPlan: 'IMPULSO', maxRedemptions: null, timesRedeemed: 0, expiresAt: null, active: false },
];
// Los botones de editar/eliminar de cada fila son solo ícono (lápiz, papelera).
const rowAction = (code, index) => rowWith(code).querySelectorAll('button')[index];

function couponsApi() {
  return installApi([
    on('GET', LIST_RE, list(COUPONS)),
    on('POST', LIST_RE, ok({ id: 3 })),
    on('PUT', /^\/coupons\/\d+$/, ok({ id: 1 })),
    on('DELETE', /^\/coupons\/\d+$/, ok({ id: 1 })),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · Cupones', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = couponsApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista los cupones con descuento, plan, usos, vencimiento y estado', async () => {
    await renderPage(<CouponsPage />);
    const call = await waitForCall(api, 'GET', LIST_RE);
    expect(call.query).toMatchObject({ page: '1', limit: '100' });
    expect(await screen.findByText('BIENVENIDO10')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('Todos los planes')).toBeInTheDocument();
    expect(screen.getByText('3 / 100')).toBeInTheDocument();
    expect(screen.getByText('2026-12-31')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('FIJO5K')).toBeInTheDocument();
    expect(screen.getByText(/5\.000/)).toBeInTheDocument();
    expect(screen.getByText('Impulso')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('crea un cupón: el código va en mayúsculas y los vacíos no viajan', async () => {
    await renderPage(<CouponsPage />);
    await screen.findByText('BIENVENIDO10');
    await click(button('Crear cupón'));
    expect(await screen.findByText('Nuevo cupón')).toBeInTheDocument();
    await typeInto(screen.getByLabelText(/Código/), 'promo20');
    expect(screen.getByLabelText(/Código/).value).toBe('PROMO20');
    await typeInto(screen.getByLabelText(/^Valor/), '20');
    await typeInto(screen.getByLabelText('Aplica al plan'), 'ALTURA');
    await typeInto(screen.getByLabelText(/Máx\. usos/), '50');
    await submitForm();
    const call = await waitForCall(api, 'POST', LIST_RE);
    expect(call.body).toEqual({ code: 'PROMO20', discountType: 'PERCENT', discountValue: 20, appliesToPlan: 'ALTURA', maxRedemptions: 50, active: true });
    await expectToast('success', 'Cupón creado');
    await waitForCall(api, 'GET', LIST_RE, { count: 2 });
    expect(screen.queryByText('Nuevo cupón')).toBeNull();
  });

  it('edita un cupón existente', async () => {
    await renderPage(<CouponsPage />);
    await screen.findByText('BIENVENIDO10');
    await click(rowAction('BIENVENIDO10', 0));
    expect(await screen.findByText('Editar cupón')).toBeInTheDocument();
    expect(screen.getByLabelText(/Código/).value).toBe('BIENVENIDO10');
    await typeInto(screen.getByLabelText('Descripción'), 'Solo octubre');
    await click(screen.getByLabelText('Activo'));
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PUT', /^\/coupons\/1$/);
    expect(call.body).toMatchObject({ code: 'BIENVENIDO10', description: 'Solo octubre', discountValue: 10, maxRedemptions: 100, expiresAt: '2026-12-31', active: false });
    await expectToast('success', 'Cupón actualizado');
  });

  it('cancelar cierra el formulario sin enviar', async () => {
    await renderPage(<CouponsPage />);
    await screen.findByText('BIENVENIDO10');
    await click(button('Crear cupón'));
    await screen.findByText('Nuevo cupón');
    await click(button('Cancelar'));
    expect(screen.queryByText('Nuevo cupón')).toBeNull();
    expect(api.count('POST', LIST_RE)).toBe(0);
  });

  it('eliminar pide confirmación y borra', async () => {
    await renderPage(<CouponsPage />);
    await screen.findByText('BIENVENIDO10');
    await click(rowAction('BIENVENIDO10', 1));
    expect(await screen.findByText('¿Eliminar cupón?')).toBeInTheDocument();
    await click(button('Cancelar'));
    expect(api.count('DELETE', /^\/coupons\/\d+$/)).toBe(0);
    await click(rowAction('BIENVENIDO10', 1));
    await click(button('Eliminar'));
    await waitForCall(api, 'DELETE', /^\/coupons\/1$/);
    await expectToast('success', 'Cupón eliminado');
    await waitForCall(api, 'GET', LIST_RE, { count: 2 });
  });

  it('si el backend rechaza, se avisa', async () => {
    api.set('POST', LIST_RE, fail(400, 'El código ya existe'));
    await renderPage(<CouponsPage />);
    await screen.findByText('BIENVENIDO10');
    await click(button('Crear cupón'));
    await screen.findByText('Nuevo cupón');
    await typeInto(screen.getByLabelText(/Código/), 'BIENVENIDO10');
    await submitForm();
    await waitForCall(api, 'POST', LIST_RE);
    await expectToast('error', 'El código ya existe');
  });

  it('solo el administrador de plataforma entra', async () => {
    vi.restoreAllMocks();
    resetBehavior({ role: 'SUPER_ADMIN' });
    couponsApi();
    await renderPage(<CouponsPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
