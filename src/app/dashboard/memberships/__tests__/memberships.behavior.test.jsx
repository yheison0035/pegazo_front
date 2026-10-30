import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi,
  on,
  list,
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
  waitForCall,
  expectToast,
  router,
  money,
} from '@/test/behaviorHarness';
import MembershipsPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const MEMBERSHIPS = [
  { id: 1, name: 'PLAN CANCHA MENSUAL', amount: 80000, dueDay: 5, customerId: 1, customer: { id: 1, name: 'ANA PÉREZ' }, notes: '', paidThisMonth: false, lastPayment: null },
  { id: 2, name: 'GUARDA CASCOS', amount: 20000, dueDay: 1, customerId: 2, customer: { id: 2, name: 'LUIS GÓMEZ' }, notes: '', paidThisMonth: true, lastPayment: { paidDate: '2026-02-01T10:00:00.000Z', amount: 20000 } },
];
const SUMMARY = { period: '2026-02', totalMonthly: 100000, count: 2, collected: 20000, upToDate: 1, overdueAmount: 80000, overdueCount: 1 };

function membershipsApi() {
  return installApi([
    on('GET', /^\/memberships$/, { success: true, data: MEMBERSHIPS, summary: SUMMARY }),
    on('POST', /^\/memberships$/, ok({ id: 9 })),
    on('PATCH', /^\/memberships\/\d+$/, ok({ id: 1 })),
    on('DELETE', /^\/memberships\/\d+$/, ok()),
    on('POST', /^\/memberships\/\d+\/charge$/, ok({ id: 1 })),
    on('POST', /^\/memberships\/\d+\/uncharge$/, ok({ id: 2 })),
    on('GET', /^\/customers$/, list([{ id: 1, name: 'ANA PÉREZ' }, { id: 2, name: 'LUIS GÓMEZ' }])),
    ...baseRoutes(),
  ]);
}

describe('Membresías', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'PARQUEADERO' });
    api = membershipsApi();
    window.confirm = vi.fn(() => true);
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista las membresías con cliente, valor y estado del mes; muestra el resumen', async () => {
    await renderPage(<MembershipsPage />);
    await waitForCall(api, 'GET', /^\/memberships$/);
    expect(await screen.findByText('PLAN CANCHA MENSUAL')).toBeInTheDocument();
    expect(screen.getByText('GUARDA CASCOS')).toBeInTheDocument();
    expect(screen.getAllByText(money(100000)).length).toBeGreaterThan(0);
    // Pendiente de cobro → botón Cobrar; ya cobrada → Deshacer.
    expect(screen.getAllByRole('button', { name: /Cobrar/ })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /Deshacer/ })).toHaveLength(1);
  });

  it('crea una membresía con valor, día de cobro y cliente', async () => {
    await renderPage(<MembershipsPage />);
    await waitForCall(api, 'GET', /^\/customers$/);
    await settle();
    await click(button('Nueva membresía'));
    const modal = (await screen.findByPlaceholderText('Ej: Mensualidad guarda cascos, Plan cancha…')).closest('.fixed');
    await typeInto(within(modal).getByPlaceholderText('Ej: Mensualidad guarda cascos, Plan cancha…'), 'parqueo mensual moto');
    await typeInto(modal.querySelector('input[inputmode="numeric"]'), '45000');
    await typeInto(within(modal).getByPlaceholderText('Ej: 5'), '10');
    await typeInto(within(modal).getByRole('combobox'), '1');
    await click(within(modal).getByRole('button', { name: 'Crear' }));
    const call = await waitForCall(api, 'POST', /^\/memberships$/);
    expect(call.body).toEqual({ name: 'PARQUEO MENSUAL MOTO', amount: 45000, dueDay: 10, customerId: 1 });
    await expectToast('success', 'Membresía creada');
    await waitForCall(api, 'GET', /^\/memberships$/, { count: 2 });
  });

  it('sin nombre o monto no guarda y avisa', async () => {
    await renderPage(<MembershipsPage />);
    await screen.findByText('PLAN CANCHA MENSUAL');
    await click(button('Nueva membresía'));
    const modal = (await screen.findByPlaceholderText('Ej: Mensualidad guarda cascos, Plan cancha…')).closest('.fixed');
    await click(within(modal).getByRole('button', { name: 'Crear' }));
    await expectToast('warning', 'Falta el nombre del plan o el monto');
    expect(api.count('POST', /^\/memberships$/)).toBe(0);
  });

  it('editar precarga y guarda con PATCH', async () => {
    await renderPage(<MembershipsPage />);
    await screen.findByText('PLAN CANCHA MENSUAL');
    await click(screen.getAllByTitle('Editar')[0]);
    const input = await screen.findByPlaceholderText('Ej: Mensualidad guarda cascos, Plan cancha…');
    expect(input.value).toBe('PLAN CANCHA MENSUAL');
    const modal = input.closest('.fixed');
    await typeInto(within(modal).getByPlaceholderText('Ej: 5'), '7');
    await click(within(modal).getByRole('button', { name: 'Guardar' }));
    const call = await waitForCall(api, 'PATCH', /^\/memberships\/1$/);
    expect(call.body).toMatchObject({ name: 'PLAN CANCHA MENSUAL', amount: 80000, dueDay: 7, customerId: 1 });
    await expectToast('success', 'Membresía actualizada');
  });

  it('cobrar el mes registra el cobro con fecha, método y nota', async () => {
    await renderPage(<MembershipsPage />);
    await screen.findByText('PLAN CANCHA MENSUAL');
    await click(screen.getByRole('button', { name: /Cobrar/ }));
    const modal = (await screen.findByText('Registrar cobro')).closest('.fixed');
    await typeInto(modal.querySelector('input[type="date"]'), '2026-02-06');
    await typeInto(within(modal).getByRole('combobox'), 'EFECTIVO');
    await typeInto(within(modal).getByPlaceholderText('Ej: Cobro mes de septiembre'), 'febrero');
    await click(within(modal).getByRole('button', { name: 'Confirmar cobro' }));
    const call = await waitForCall(api, 'POST', /^\/memberships\/1\/charge$/);
    expect(call.body).toMatchObject({ paymentMethod: 'EFECTIVO', notes: 'febrero' });
    expect(String(call.body.paidDate)).toMatch(/^2026-02-0/);
    await expectToast('success', 'Cobro registrado');
  });

  it('deshacer el cobro pide confirmación y llama /uncharge', async () => {
    await renderPage(<MembershipsPage />);
    await screen.findByText('GUARDA CASCOS');
    await click(screen.getByRole('button', { name: /Deshacer/ }));
    expect(String(window.confirm.mock.calls[0][0])).toContain('GUARDA CASCOS');
    await waitForCall(api, 'POST', /^\/memberships\/2\/uncharge$/);
    await waitForCall(api, 'GET', /^\/memberships$/, { count: 2 });
  });

  it('eliminar pide confirmación y llama DELETE; si no se confirma no pasa nada', async () => {
    await renderPage(<MembershipsPage />);
    await screen.findByText('PLAN CANCHA MENSUAL');
    window.confirm = vi.fn(() => false);
    await click(screen.getAllByTitle('Eliminar')[0]);
    await settle();
    expect(api.count('DELETE', /^\/memberships/)).toBe(0);
    window.confirm = vi.fn(() => true);
    await click(screen.getAllByTitle('Eliminar')[0]);
    await waitForCall(api, 'DELETE', /^\/memberships\/1$/);
  });

  it('un error del backend al cobrar se avisa', async () => {
    api.set('POST', /^\/memberships\/\d+\/charge$/, fail(400, 'Ya se cobró este mes'));
    await renderPage(<MembershipsPage />);
    await screen.findByText('PLAN CANCHA MENSUAL');
    await click(screen.getByRole('button', { name: /Cobrar/ }));
    const modal = (await screen.findByText('Registrar cobro')).closest('.fixed');
    await click(within(modal).getByRole('button', { name: 'Confirmar cobro' }));
    await waitForCall(api, 'POST', /^\/memberships\/1\/charge$/);
    await expectToast('error', 'Ya se cobró');
  });

  it('solo dueño, administrador y recepcionista entran', async () => {
    resetBehavior({ type: 'PARQUEADERO', role: 'CAJA' });
    membershipsApi();
    await renderPage(<MembershipsPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
