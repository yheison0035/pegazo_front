import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi,
  on,
  list,
  detail,
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
  setField,
  button,
  rowButton,
  queryRowButton,
  waitForCall,
  expectToast,
  submitForm,
  authState,
  router,
} from '@/test/behaviorHarness';
import AppointmentsPage from '../page';
import NewAppointmentPage from '../new/page';
import EditAppointmentPage from '../edit/[id]/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const TODAY = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

const CUSTOMER = { id: 1, name: 'ANA PÉREZ', document: '1001', phone: '3001234567', email: 'ana@test.com' };
const APPOINTMENTS = [
  { id: 1, date: `${TODAY}T00:00:00.000Z`, startTime: '09:00', status: 'CONFIRMADA', clientConfirmed: false, serviceId: 9, service: { id: 9, name: 'CORTE CLÁSICO' }, barberId: 3, barber: { id: 3, name: 'Barbero Uno' }, customerId: 1, customer: CUSTOMER, localId: 1, local: { id: 1, name: 'Sede Centro' }, notes: 'sin barba', sales: [] },
  { id: 2, date: `${TODAY}T00:00:00.000Z`, startTime: '10:00', status: 'COMPLETADA', clientConfirmed: true, serviceId: 9, service: { id: 9, name: 'CORTE CLÁSICO' }, barberId: 3, barber: { id: 3, name: 'Barbero Uno' }, customerId: 2, customer: { id: 2, name: 'LUIS GÓMEZ', phone: '', document: '1002' }, localId: 1, local: { id: 1, name: 'Sede Centro' }, notes: '', sales: [{ id: 77 }] },
];

function appointmentsApi() {
  return installApi([
    on('GET', /^\/appointments$/, list(APPOINTMENTS, { total: 2 })),
    on('GET', /^\/appointments\/month$/, ok(APPOINTMENTS)),
    on('GET', /^\/appointments\/availability$/, { off: false, reason: null, slots: ['09:00', '09:30', '10:00'] }),
    on('GET', /^\/appointments\/\d+$/, detail(APPOINTMENTS[0])),
    on('POST', /^\/appointments$/, ok({ id: 9 })),
    on('PUT', /^\/appointments\/\d+$/, ok({ id: 1 })),
    on('PATCH', /^\/appointments\/\d+\/client-confirm$/, ok()),
    on('DELETE', /^\/appointments\/\d+$/, ok()),
    on('GET', /^\/services$/, list([{ id: 9, name: 'CORTE CLÁSICO', duration: 30 }])),
    on('GET', /^\/users\/by-role$/, ok([{ id: 3, name: 'Barbero Uno' }])),
    on('GET', /^\/customers$/, list([CUSTOMER])),
    on('GET', /^\/rest-days/, ok([])),
    ...baseRoutes(),
  ]);
}

describe('Citas · calendario y lista', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'BARBERIA' });
    api = appointmentsApi();
    window.open = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it('arranca en el calendario del mes con las citas del backend', async () => {
    await renderPage(<AppointmentsPage />);
    const call = await waitForCall(api, 'GET', /^\/appointments\/month$/);
    expect(call.query).toMatchObject({ year: String(today.getFullYear()), month: String(today.getMonth()) }); // el calendario usa mes 0-based
    // La celda del día muestra hora + nombre de pila.
    expect(await screen.findByText(/09:00\s+ANA$/)).toBeInTheDocument();
    expect(screen.getByText(/10:00\s+LUIS$/)).toBeInTheDocument();
    expect(screen.getByText('Agregar cita').closest('a')).toHaveAttribute('href', '/dashboard/appointments/new');
    expect(screen.getByText('Diseño de la página').closest('a')).toHaveAttribute('href', '/dashboard/appointments/design');
  });

  it('la vista de lista carga la tabla paginada y filtra', async () => {
    await renderPage(<AppointmentsPage />);
    await waitForCall(api, 'GET', /^\/appointments\/month$/);
    await click(button(/Lista/));
    const call = await waitForCall(api, 'GET', /^\/appointments$/);
    expect(call.query).toMatchObject({ page: '1', limit: '10' });
    expect(screen.getByText('Listado de Citas')).toBeInTheDocument();
    expect(screen.getAllByText('ANA PÉREZ').length).toBeGreaterThan(0);
    await typeInto(screen.getAllByPlaceholderText('Filtrar Estado')[0], 'CONF');
    const filtered = await waitForCall(api, 'GET', /^\/appointments$/, { count: 2 });
    expect(filtered.query.status).toBe('CONF');
  });

  it('en la lista: ver detalle, cobrar la cita pendiente y confirmar por WhatsApp', async () => {
    await renderPage(<AppointmentsPage />);
    await click(button(/Lista/));
    await waitForCall(api, 'GET', /^\/appointments$/);
    await click(rowButton('09:00', 'Ver detalle'));
    const modal = screen.getByText('Detalles de la Cita').closest('.fixed');
    expect(within(modal).getByText('CORTE CLÁSICO')).toBeInTheDocument();
    await click(within(modal).getAllByRole('button')[0]);

    // Cobrar: solo la cita sin venta enlaza al POS con su id.
    const row1 = screen.getByText('09:00').closest('tr');
    expect(within(row1).getByText('Cobrar').closest('a')).toHaveAttribute('href', '/dashboard/sales?appointment=1');
    const row2 = screen.getByText('10:00').closest('tr');
    expect(within(row2).queryByText('Cobrar')).toBeNull();

    // Confirmar con el cliente abre WhatsApp y marca la confirmación.
    await click(within(row1).getByRole('button', { name: /Confirmar/ }));
    expect(window.open).toHaveBeenCalledTimes(1);
    await waitForCall(api, 'PATCH', /^\/appointments\/1\/client-confirm$/);
  });

  it('eliminar una cita confirma y llama DELETE; un error se avisa', async () => {
    await renderPage(<AppointmentsPage />);
    await click(button(/Lista/));
    await waitForCall(api, 'GET', /^\/appointments$/);
    await click(rowButton('09:00', 'Eliminar'));
    let modal = screen.getByText('Confirmar eliminación').parentElement;
    await click(within(modal).getByRole('button', { name: 'Eliminar' }));
    await waitForCall(api, 'DELETE', /^\/appointments\/1$/);
    await waitForCall(api, 'GET', /^\/appointments$/, { count: 2 });

    api.set('DELETE', /^\/appointments\/\d+$/, fail(400, 'La cita ya fue cobrada'));
    await click(rowButton('10:00', 'Eliminar'));
    modal = screen.getByText('Confirmar eliminación').parentElement;
    await click(within(modal).getByRole('button', { name: 'Eliminar' }));
    await expectToast('error', 'ya fue cobrada');
  });

  it('el barbero puede entrar a su agenda (sin eliminar)', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    api = appointmentsApi();
    await renderPage(<AppointmentsPage />);
    await waitForCall(api, 'GET', /^\/appointments\/month$/);
    expect(router.push).not.toHaveBeenCalled();
    await click(button(/Lista/));
    await waitForCall(api, 'GET', /^\/appointments$/);
    expect(queryRowButton('09:00', 'Eliminar')).toBeNull();
  });
});

describe('Citas · crear y editar', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'BARBERIA' });
    authState.params = { id: '1' };
    api = appointmentsApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('agenda una cita: sede → servicio → profesional → fecha → hora disponible → cliente', async () => {
    await renderPage(<NewAppointmentPage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await waitForCall(api, 'GET', /^\/services$/);
    await settle();
    setField('localId', '1');
    await settle();
    const byRole = await waitForCall(api, 'GET', /^\/users\/by-role$/);
    expect(byRole.query).toMatchObject({ role: 'barbero', localId: '1' });
    setField('serviceId', '9');
    await settle();
    await waitFor(() => expect(document.querySelector('[name="barberId"] option[value="3"]')).toBeTruthy());
    setField('barberId', '3');
    setField('date', '2026-03-02');
    await settle();
    const avail = await waitForCall(api, 'GET', /^\/appointments\/availability$/);
    expect(avail.query).toMatchObject({ localId: '1', serviceId: '9', barberId: '3', date: '2026-03-02' });
    await waitFor(() => expect(document.querySelector('[name="startTime"] option[value="09:30"]')).toBeTruthy());
    setField('startTime', '09:30');

    // Cliente: selector buscable (clic, buscar, elegir).
    await click(screen.getByRole('button', { name: /Seleccionar cliente/i }));
    await typeInto(screen.getByPlaceholderText(/Buscar cliente/i), 'ana');
    await click(screen.getByText('ANA PÉREZ'));
    setField('notes', 'quiere degradado');
    await submitForm();
    const call = await waitForCall(api, 'POST', /^\/appointments$/);
    expect(call.body).toMatchObject({
      localId: 1,
      serviceId: 9,
      barberId: 3,
      customerId: 1,
      date: '2026-03-02',
      startTime: '09:30',
      status: 'CONFIRMADA',
      notes: 'quiere degradado',
    });
    const t = await expectToast('success', 'Cita creada');
    expect(t.url).toBe('/dashboard/appointments');
  });

  it('si el profesional descansa ese día, la hora muestra el aviso y no hay horarios', async () => {
    api.set('GET', /^\/appointments\/availability$/, { off: true, reason: 'día de descanso', slots: [] });
    await renderPage(<NewAppointmentPage />);
    await waitForCall(api, 'GET', /^\/services$/);
    await settle();
    setField('localId', '1');
    await settle();
    await waitForCall(api, 'GET', /^\/users\/by-role$/);
    setField('serviceId', '9');
    await settle();
    await waitFor(() => expect(document.querySelector('[name="barberId"] option[value="3"]')).toBeTruthy());
    setField('barberId', '3');
    setField('date', '2026-03-02');
    await waitForCall(api, 'GET', /^\/appointments\/availability$/);
    await waitFor(() => expect(screen.getByText(/De descanso ese día/)).toBeInTheDocument());
    expect(document.querySelector('[name="startTime"] option[value="09:00"]')).toBeNull();
  });

  it('sin cliente elegido el formulario no se envía', async () => {
    await renderPage(<NewAppointmentPage />);
    await waitForCall(api, 'GET', /^\/services$/);
    await settle();
    setField('localId', '1');
    await settle();
    await waitForCall(api, 'GET', /^\/users\/by-role$/);
    setField('serviceId', '9');
    await settle();
    await waitFor(() => expect(document.querySelector('[name="barberId"] option[value="3"]')).toBeTruthy());
    setField('barberId', '3');
    setField('date', '2026-03-02');
    await waitForCall(api, 'GET', /^\/appointments\/availability$/);
    await waitFor(() => expect(document.querySelector('[name="startTime"] option[value="09:00"]')).toBeTruthy());
    setField('startTime', '09:00');
    await submitForm();
    await settle();
    expect(screen.getByText('Este campo es obligatorio')).toBeInTheDocument();
    expect(api.count('POST', /^\/appointments$/)).toBe(0);
  });

  it('edita la cita y guarda con PUT solo los campos permitidos', async () => {
    await renderPage(<EditAppointmentPage />);
    await waitForCall(api, 'GET', /^\/appointments\/1$/);
    await waitFor(() => expect(document.querySelector('[name="notes"]').value).toBe('sin barba'));
    await settle();
    setField('status', 'EN_PROCESO');
    await submitForm();
    const call = await waitForCall(api, 'PUT', /^\/appointments\/1$/);
    expect(call.body).toMatchObject({ status: 'EN_PROCESO', serviceId: 9, barberId: 3, localId: 1, customerId: 1, notes: 'sin barba' });
    expect(Object.keys(call.body).sort()).toEqual(['barberId', 'customerId', 'date', 'localId', 'notes', 'serviceId', 'startTime', 'status']);
    await expectToast('success', /actualizad/i);
  });
});
