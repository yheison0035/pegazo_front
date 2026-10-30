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
  placeholder,
  waitForCall,
  expectToast,
  router,
  money,
} from '@/test/behaviorHarness';
import EmployeeChargesPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const EMPLOYEES = [
  { id: 3, name: 'BARBERO UNO', role: 'BARBERO', status: 'ACTIVO' },
  { id: 4, name: 'BARBERO DOS', role: 'BARBERO', status: 'ACTIVO' },
];
const CATEGORIES = [{ id: 1, name: 'Daño de insumos', type: 'DESCUENTO' }, { id: 2, name: 'Préstamo', type: 'PRESTAMO' }];
const CHARGES = [
  { id: 10, userId: 3, userName: 'BARBERO UNO', concept: 'Corte membresía mal aplicado', amount: 15000, status: 'PENDIENTE', categoryName: 'Daño de insumos', type: 'DESCUENTO', notes: '', createdAt: '2026-02-10T10:00:00.000Z' },
  { id: 11, userId: 3, userName: 'BARBERO UNO', concept: 'Préstamo quincena', amount: 50000, status: 'PAGADO', categoryName: 'Préstamo', type: 'PRESTAMO', notes: '', createdAt: '2026-02-01T10:00:00.000Z' },
];
const SUMMARY = { pending: 15000, paid: 50000, discounted: 0 };

function chargesApi() {
  return installApi([
    on('GET', /^\/employee-charges$/, ok(CHARGES)),
    on('GET', /^\/employee-charges\/summary$/, ok(SUMMARY)),
    on('POST', /^\/employee-charges$/, ok({ id: 12 })),
    on('PATCH', /^\/employee-charges\/\d+\/settle$/, ok({ id: 10 })),
    on('PATCH', /^\/employee-charges\/\d+\/unsettle$/, ok({ id: 11 })),
    on('DELETE', /^\/employee-charges\/\d+$/, ok()),
    on('GET', /^\/users$/, list(EMPLOYEES)),
    on('GET', /^\/charge-categories$/, ok(CATEGORIES)),
    ...baseRoutes().filter((r) => !/users\$/.test(String(r.path))),
  ]);
}

async function pickEmployee(api) {
  await waitForCall(api, 'GET', /^\/users$/);
  const select = await waitFor(() => screen.getAllByRole('combobox').find((s) => [...s.options].some((o) => o.text.includes('BARBERO UNO'))));
  await typeInto(select, '3');
  const call = await waitForCall(api, 'GET', /^\/employee-charges$/);
  return call;
}

describe('Cargos a empleados', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'BARBERIA' });
    api = chargesApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('el dueño elige un empleado y ve sus cargos con el resumen', async () => {
    await renderPage(<EmployeeChargesPage />);
    const call = await pickEmployee(api);
    expect(call.query.userId).toBe('3');
    expect(await screen.findByText('Corte membresía mal aplicado')).toBeInTheDocument();
    expect(screen.getByText('Préstamo quincena')).toBeInTheDocument();
    expect(screen.getAllByText(money(15000)).length).toBeGreaterThan(0);
  });

  it('registra un cargo con categoría, concepto, valor y notas', async () => {
    await renderPage(<EmployeeChargesPage />);
    await pickEmployee(api);
    await screen.findByText('Corte membresía mal aplicado');
    const catSelect = screen.getAllByRole('combobox').find((s) => [...s.options].some((o) => o.text === 'Préstamo'));
    await typeInto(catSelect, '2');
    await typeInto(placeholder('Ej: Corte membresía mal aplicado'), 'Adelanto de quincena');
    await typeInto(document.querySelector('input[inputmode="numeric"]'), '30000');
    await click(button('Agregar cargo'));
    const call = await waitForCall(api, 'POST', /^\/employee-charges$/);
    expect(call.body).toEqual({ userId: 3, chargeCategoryId: 2, concept: 'Adelanto de quincena', amount: 30000 });
    await expectToast('success', 'Cargo registrado');
    await waitForCall(api, 'GET', /^\/employee-charges$/, { count: 2 });
    expect(placeholder('Ej: Corte membresía mal aplicado').value).toBe('');
  });

  it('sin empleado, o sin concepto/valor, no registra y avisa', async () => {
    await renderPage(<EmployeeChargesPage />);
    await waitForCall(api, 'GET', /^\/users$/);
    await settle();
    await click(button('Agregar cargo'));
    await expectToast('warning', 'Elige el empleado primero');
    await pickEmployee(api);
    await click(button('Agregar cargo'));
    await expectToast('warning', 'Falta concepto o valor');
    expect(api.count('POST', /^\/employee-charges$/)).toBe(0);
  });

  it('saldar en efectivo pide la fecha y llama /settle con el método', async () => {
    await renderPage(<EmployeeChargesPage />);
    await pickEmployee(api);
    await screen.findByText('Corte membresía mal aplicado');
    await click(screen.getByTitle('Pagó en efectivo'));
    const date = await waitFor(() => document.querySelector('.fixed input[type="date"]'));
    await typeInto(date, '2026-02-15');
    await click(screen.getByRole('button', { name: 'Confirmar' }));
    const call = await waitForCall(api, 'PATCH', /^\/employee-charges\/10\/settle$/);
    expect(call.body.method).toBe('EFECTIVO');
    expect(String(call.body.settledAt)).toMatch(/^2026-02-1/);
    await waitForCall(api, 'GET', /^\/employee-charges$/, { count: 2 });
  });

  it('descontar de la comisión usa el método COMISION', async () => {
    await renderPage(<EmployeeChargesPage />);
    await pickEmployee(api);
    await screen.findByText('Corte membresía mal aplicado');
    await click(screen.getByTitle('Descontar de su comisión'));
    await waitFor(() => document.querySelector('.fixed input[type="date"]'));
    await click(screen.getByRole('button', { name: 'Confirmar' }));
    const call = await waitForCall(api, 'PATCH', /^\/employee-charges\/10\/settle$/);
    expect(call.body.method).toBe('COMISION');
  });

  it('reabrir un cargo pagado llama /unsettle y eliminar llama DELETE', async () => {
    await renderPage(<EmployeeChargesPage />);
    await pickEmployee(api);
    await screen.findByText('Préstamo quincena');
    await click(screen.getByTitle('Reabrir'));
    await waitForCall(api, 'PATCH', /^\/employee-charges\/11\/unsettle$/);
    await click(screen.getAllByLabelText('Eliminar')[0]);
    await waitForCall(api, 'DELETE', /^\/employee-charges\/\d+$/);
  });

  it('un error del backend al saldar se avisa', async () => {
    api.set('PATCH', /^\/employee-charges\/\d+\/settle$/, fail(400, 'Caja cerrada'));
    await renderPage(<EmployeeChargesPage />);
    await pickEmployee(api);
    await screen.findByText('Corte membresía mal aplicado');
    await click(screen.getByTitle('Pagó en efectivo'));
    await waitFor(() => document.querySelector('.fixed input[type="date"]'));
    await click(screen.getByRole('button', { name: 'Confirmar' }));
    await expectToast('error', 'Caja cerrada');
  });

  it('el barbero ve solo sus cargos (sin elegir empleado ni registrar)', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    api = chargesApi();
    await renderPage(<EmployeeChargesPage />);
    const call = await waitForCall(api, 'GET', /^\/employee-charges$/);
    // No es dueño: consulta solo sus propios cargos.
    expect(call.query.userId).toBe('1');
    expect(await screen.findByText('Corte membresía mal aplicado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agregar cargo' })).toBeNull();
    expect(screen.queryByTitle('Pagó en efectivo')).toBeNull();
  });

  it('la caja no entra a cargos de empleados', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'CAJA' });
    chargesApi();
    await renderPage(<EmployeeChargesPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
