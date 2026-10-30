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
  buttons,
  waitForCall,
  expectToast,
  router,
} from '@/test/behaviorHarness';
import PlansPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const PLANS = {
  plans: [
    { id: 'IMPULSO', name: 'Impulso', emoji: '⚡', tagline: '', priceMonthly: 89000, maxUsers: 5, maxLocals: 2, maxProducts: 1000, maxCustomers: null, order: 2 },
    { id: 'DESPEGUE', name: 'Despegue', emoji: '🚀', tagline: '', priceMonthly: 49000, maxUsers: 2, maxLocals: 1, maxProducts: 200, maxCustomers: null, order: 1 },
  ],
  gates: { parking: 'IMPULSO', 'facturacion-electronica': 'DESPEGUE' },
};

const gateSelect = (label) => screen.getByText(label).parentElement.querySelector('select');
// Los selects de puertas muestran el nombre del plan elegido: se acota a los inputs de nombre.
const planName = (name) => screen.getAllByDisplayValue(name).find((el) => el.tagName === 'INPUT');
const findPlanName = async (name) => (await screen.findAllByDisplayValue(name)).find((el) => el.tagName === 'INPUT');

function plansApi() {
  return installApi([
    on('GET', /^\/platform\/plans$/, ok(PLANS)),
    on('PUT', /^\/platform\/plans\/gates$/, ok({})),
    on('PUT', /^\/platform\/plans\/[A-Z]+$/, ok({})),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · Planes y funciones', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = plansApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga los planes ordenados y el plan mínimo de cada módulo', async () => {
    await renderPage(<PlansPage />);
    await waitForCall(api, 'GET', /^\/platform\/plans$/);
    const names = (await screen.findAllByDisplayValue(/^(Despegue|Impulso)$/)).filter((el) => el.tagName === 'INPUT');
    expect(names.map((i) => i.value)).toEqual(['Despegue', 'Impulso']);
    expect(gateSelect('Parqueadero').value).toBe('IMPULSO');
    expect(gateSelect('Facturación electrónica DIAN').value).toBe('DESPEGUE');
    expect(gateSelect('Citas').value).toBe('BASE');
    expect(button('Guardar cambios')).toBeDisabled();
  });

  it('"Guardar plan" envía nombre, precio y límites del plan editado', async () => {
    await renderPage(<PlansPage />);
    await findPlanName('Despegue');
    await typeInto(planName('Despegue'), 'Despegue Pro');
    await typeInto(screen.getAllByLabelText('Usuarios')[0], '3');
    await click(buttons('Guardar plan')[0]);
    const call = await waitForCall(api, 'PUT', /^\/platform\/plans\/DESPEGUE$/);
    expect(call.body).toMatchObject({ name: 'Despegue Pro', priceMonthly: 49000, maxUsers: 3, maxLocals: 1, maxProducts: 200, maxCustomers: null });
    await expectToast('success', 'Plan Despegue Pro guardado.');
  });

  it('cambiar el plan mínimo de un módulo habilita "Guardar cambios" y envía todas las puertas', async () => {
    await renderPage(<PlansPage />);
    await findPlanName('Despegue');
    await typeInto(gateSelect('Parqueadero'), 'BASE');
    expect(button('Guardar cambios')).not.toBeDisabled();
    await click(button('Guardar cambios'));
    const call = await waitForCall(api, 'PUT', /^\/platform\/plans\/gates$/);
    expect(call.body).toEqual({ gates: { parking: 'BASE', 'facturacion-electronica': 'DESPEGUE' } });
    await expectToast('success', 'Módulos por plan guardados.');
    await waitFor(() => expect(button('Guardar cambios')).toBeDisabled());
  });

  it('"Recargar" vuelve a consultar y descarta cambios sin guardar', async () => {
    await renderPage(<PlansPage />);
    await findPlanName('Despegue');
    await typeInto(gateSelect('Parqueadero'), 'BASE');
    await click(button('Recargar'));
    await waitForCall(api, 'GET', /^\/platform\/plans$/, { count: 2 });
    await waitFor(() => expect(gateSelect('Parqueadero').value).toBe('IMPULSO'));
    expect(button('Guardar cambios')).toBeDisabled();
  });

  it('si el backend rechaza el guardado, se avisa', async () => {
    api.set('PUT', /^\/platform\/plans\/[A-Z]+$/, fail(400, 'Precio inválido'));
    await renderPage(<PlansPage />);
    await findPlanName('Despegue');
    await click(buttons('Guardar plan')[0]);
    await expectToast('error', 'Precio inválido');
  });

  it('solo el administrador de plataforma entra', async () => {
    vi.restoreAllMocks();
    resetBehavior({ role: 'SUPER_ADMIN' });
    plansApi();
    await renderPage(<PlansPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
