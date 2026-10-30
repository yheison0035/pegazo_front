import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  ok,
  fail,
  baseRoutes,
  resetBehavior,
  renderPage,
  settle,
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
import RestDaysPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(d)}`;
const PROS = [
  { id: 3, name: 'Barbero Uno', role: 'BARBERO' },
  { id: 4, name: 'Barbero Dos', role: 'BARBERO' },
];
// El descanso puntual existente es HOY (los días pasados están deshabilitados en el calendario).
const TODAY = ymd(today.getDate());
const CONFIG = { restWeekdays: [], timeOff: [{ id: 50, date: `${TODAY}T00:00:00.000Z`, reason: 'Cita médica' }] };

function restApi() {
  return installApi([
    on('GET', /^\/rest-days\/professionals$/, ok(PROS)),
    on('GET', /^\/rest-days\/\d+$/, ok(CONFIG)),
    on('PUT', /^\/rest-days\/\d+\/weekdays$/, ok({})),
    on('POST', /^\/rest-days\/\d+\/time-off$/, ok({ id: 51 })),
    on('DELETE', /^\/rest-days\/time-off\/\d+$/, ok()),
    ...baseRoutes(),
  ]);
}

describe('Días de descanso del equipo', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'BARBERIA' });
    api = restApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga los profesionales, selecciona el primero y muestra su configuración', async () => {
    await renderPage(<RestDaysPage />);
    await waitForCall(api, 'GET', /^\/rest-days\/professionals$/);
    const call = await waitForCall(api, 'GET', /^\/rest-days\/3$/);
    expect(call).toBeTruthy();
    expect(await screen.findByText('Barbero Uno')).toBeInTheDocument();
    expect(screen.getByText('Cita médica')).toBeInTheDocument();
    expect(button('Dom')).toBeInTheDocument();
  });

  it('cambiar de profesional consulta su configuración', async () => {
    await renderPage(<RestDaysPage />);
    await waitForCall(api, 'GET', /^\/rest-days\/3$/);
    await click(screen.getByText('Barbero Dos'));
    await waitForCall(api, 'GET', /^\/rest-days\/4$/);
  });

  it('activar o quitar un día fijo de la semana guarda la lista completa', async () => {
    await renderPage(<RestDaysPage />);
    await waitForCall(api, 'GET', /^\/rest-days\/3$/);
    await screen.findByText('Cita médica');
    await click(button('Lun'));
    let call = await waitForCall(api, 'PUT', /^\/rest-days\/3\/weekdays$/);
    expect(call.body.restWeekdays).toEqual([1]);
    await click(button('Lun'));
    call = await waitForCall(api, 'PUT', /^\/rest-days\/3\/weekdays$/, { count: 2 });
    expect(call.body.restWeekdays).toEqual([]);
  });

  it('clic en un día del calendario lo marca como descanso; otro clic lo quita', async () => {
    await renderPage(<RestDaysPage />);
    await waitForCall(api, 'GET', /^\/rest-days\/3$/);
    await screen.findByText('Cita médica');
    // Hoy ya es descanso → se quita.
    await click(screen.getByTitle('Quitar descanso'));
    await waitForCall(api, 'DELETE', /^\/rest-days\/time-off\/50$/);
    // El primer día futuro habilitado del mes → se programa (si hoy no es el último del mes).
    const futuro = screen.getAllByTitle('Programar descanso').find((b) => !b.disabled);
    if (futuro) {
      await click(futuro);
      const add = await waitForCall(api, 'POST', /^\/rest-days\/3\/time-off$/);
      expect(add.body).toEqual({ date: ymd(Number(futuro.textContent)), reason: 'Programado' });
    }
  });

  it('agrega un descanso puntual con fecha y motivo desde el formulario', async () => {
    await renderPage(<RestDaysPage />);
    await waitForCall(api, 'GET', /^\/rest-days\/3$/);
    await screen.findByText('Cita médica');
    await typeInto(document.querySelector('input[type="date"]'), '2026-12-24');
    await typeInto(placeholder('Ej: Vacaciones'), 'Navidad');
    await click(button('Agregar'));
    const call = await waitForCall(api, 'POST', /^\/rest-days\/3\/time-off$/);
    expect(call.body).toEqual({ date: '2026-12-24', reason: 'Navidad' });
    await waitForCall(api, 'GET', /^\/rest-days\/3$/, { count: 2 });
  });

  it('"Quitar" elimina el descanso puntual', async () => {
    await renderPage(<RestDaysPage />);
    await waitForCall(api, 'GET', /^\/rest-days\/3$/);
    await screen.findByText('Cita médica');
    await click(screen.getByLabelText('Quitar'));
    await waitForCall(api, 'DELETE', /^\/rest-days\/time-off\/50$/);
  });

  it('un error del backend al guardar se avisa', async () => {
    api.set('POST', /^\/rest-days\/\d+\/time-off$/, fail(400, 'Ya tiene citas ese día'));
    await renderPage(<RestDaysPage />);
    await waitForCall(api, 'GET', /^\/rest-days\/3$/);
    await screen.findByText('Cita médica');
    await typeInto(placeholder('Ej: Vacaciones'), 'x');
    await click(button('Agregar'));
    await expectToast('error', 'Ya tiene citas');
  });

  it('solo dueño y administrador entran', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    restApi();
    await renderPage(<RestDaysPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
