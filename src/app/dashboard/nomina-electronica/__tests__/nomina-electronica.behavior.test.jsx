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
} from '@/test/behaviorHarness';
import NominaPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const STATUS = { linked: true, env: 'PRODUCCION', habilitacion: 'HABILITADO', hasCertificate: true, resolutions: [{ id: 1, documentType: 'NOMINA' }], pt: { legalName: 'PEGAZO SAS' } };
const PAYROLLS = [
  { id: 1, number: 'NE-0001', type: 'NOMINA', status: 'ACEPTADO', customer: 'CARLA VENDEDORA', total: 1300000, createdAt: '2026-02-01T10:00:00.000Z' },
];
const EMPLOYEES = [
  { id: 2, name: 'CARLA VENDEDORA', document: '1002', position: 'Asesora', salary: 1300000, role: 'ASESOR', status: 'ACTIVO' },
  { id: 3, name: 'PEDRO CAJA', document: '1003', position: 'Cajero', salary: 1200000, role: 'CAJA', status: 'ACTIVO' },
];

function nominaApi(status = STATUS) {
  return installApi([
    on('GET', /^\/fiscal\/status$/, ok(status)),
    on('GET', /^\/fiscal\/documents$/, { success: true, data: PAYROLLS, meta: { total: 1, page: 1, limit: 20, totalPages: 1 } }),
    on('POST', /^\/fiscal\/payroll$/, { number: 'NE-0002', employee: 'PEDRO CAJA' }),
    on('POST', /^\/fiscal\/payroll\/\d+\/replace$/, { number: 'NE-0003' }),
    on('POST', /^\/fiscal\/payroll\/\d+\/eliminate$/, { number: 'NE-0004' }),
    on('GET', /^\/users$/, list(EMPLOYEES)),
    ...baseRoutes().filter((r) => !/users\$/.test(String(r.path))),
  ]);
}

async function openNomina(api) {
  await renderPage(<NominaPage />);
  await waitForCall(api, 'GET', /^\/fiscal\/status$/);
  const docs = await waitForCall(api, 'GET', /^\/fiscal\/documents$/);
  expect(docs.query).toMatchObject({ type: 'NOMINA', limit: '20' });
  await settle();
}

describe('Nómina electrónica', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ company: { einvoicingReleased: true } });
    api = nominaApi();
    window.prompt = vi.fn(() => 'Error en el salario');
  });
  afterEach(() => vi.restoreAllMocks());

  it('si la plataforma no ha liberado el módulo, no consulta nada', async () => {
    resetBehavior({ company: { einvoicingReleased: false } });
    api = nominaApi();
    await renderPage(<NominaPage />);
    await settle();
    expect(api.count('GET', /^\/fiscal\/status$/)).toBe(0);
    expect(screen.queryByRole('button', { name: /Emitir nómina/ })).toBeNull();
  });

  it('lista las nóminas emitidas con empleado, total y estado', async () => {
    await openNomina(api);
    expect(await screen.findByText('NE-0001')).toBeInTheDocument();
    expect(screen.getByText('CARLA VENDEDORA')).toBeInTheDocument();
    expect(screen.getByTitle('Corregir con nota de ajuste (reemplazo)')).toBeInTheDocument();
    expect(screen.getByTitle('Eliminar con nota de ajuste')).toBeInTheDocument();
  });

  it('emite una nómina: elige el empleado, el periodo y los conceptos', async () => {
    await openNomina(api);
    await click(screen.getAllByRole('button', { name: /Emitir nómina/ })[0]);
    const modal = (await screen.findByText('Emitir nómina electrónica')).closest('.fixed');
    await waitForCall(api, 'GET', /^\/users$/);
    await typeInto(within(modal).getByPlaceholderText('Busca por nombre o documento…'), 'pedro');
    await click(await within(modal).findByText(/PEDRO CAJA/));
    // El empleado se precarga: nombre, documento, cargo y sueldo.
    expect(within(modal).getByDisplayValue('PEDRO CAJA')).toBeInTheDocument();
    expect(within(modal).getByDisplayValue('1003')).toBeInTheDocument();
    const dates = modal.querySelectorAll('input[type="date"]');
    await typeInto(dates[0], '2026-02-01');
    await typeInto(dates[1], '2026-02-28');
    await click(within(modal).getByRole('button', { name: /Emitir nómina/ }));
    const call = await waitForCall(api, 'POST', /^\/fiscal\/payroll$/);
    expect(call.body.employee).toMatchObject({ name: 'PEDRO CAJA', identification: '1003', position: 'Cajero', salary: 1200000 });
    expect(call.body.period).toEqual({ startDate: '2026-02-01', endDate: '2026-02-28' });
    expect(call.body.earnings[0]).toMatchObject({ concept: 'Sueldo', amount: 1200000 });
    expect(Array.isArray(call.body.deductions)).toBe(true);
    const t = await expectToast('success', 'Nómina NE-0002 emitida');
    expect(t.message).toContain('PEDRO CAJA');
    await waitForCall(api, 'GET', /^\/fiscal\/documents$/, { count: 2 });
  });

  it('sin empleado no emite y avisa', async () => {
    await openNomina(api);
    await click(screen.getAllByRole('button', { name: /Emitir nómina/ })[0]);
    const modal = (await screen.findByText('Emitir nómina electrónica')).closest('.fixed');
    await click(within(modal).getByRole('button', { name: /Emitir nómina/ }));
    await expectToast('error', 'Ingresa el nombre y el documento del empleado');
    expect(api.count('POST', /^\/fiscal\/payroll$/)).toBe(0);
  });

  it('corregir abre el modal de reemplazo y emite la nota de ajuste', async () => {
    await openNomina(api);
    await click(screen.getByTitle('Corregir con nota de ajuste (reemplazo)'));
    const modal = (await screen.findByText('Corregir nómina (nota de ajuste)')).closest('.fixed');
    await waitForCall(api, 'GET', /^\/users$/);
    await typeInto(within(modal).getByPlaceholderText('Busca por nombre o documento…'), 'carla');
    await click(await within(modal).findByText(/CARLA VENDEDORA/));
    const dates = modal.querySelectorAll('input[type="date"]');
    await typeInto(dates[0], '2026-02-01');
    await click(within(modal).getByRole('button', { name: /Emitir nómina/ }));
    const call = await waitForCall(api, 'POST', /^\/fiscal\/payroll\/1\/replace$/);
    expect(call.body.employee.identification).toBe('1002');
    await expectToast('success', 'Nota de ajuste NE-0003 (reemplazo) emitida');
  });

  it('eliminar pide el motivo y emite la nota de ajuste de eliminación', async () => {
    await openNomina(api);
    await click(screen.getByTitle('Eliminar con nota de ajuste'));
    expect(window.prompt).toHaveBeenCalledTimes(1);
    const call = await waitForCall(api, 'POST', /^\/fiscal\/payroll\/1\/eliminate$/);
    expect(call.body).toEqual({ reason: 'Error en el salario' });
    await expectToast('success', 'Nota de ajuste NE-0004 (eliminación) emitida');
  });

  it('si se cancela el motivo, no elimina', async () => {
    window.prompt = vi.fn(() => null);
    await openNomina(api);
    await click(screen.getByTitle('Eliminar con nota de ajuste'));
    await settle();
    expect(api.count('POST', /eliminate/)).toBe(0);
  });

  it('un rechazo de la DIAN se muestra', async () => {
    api.set('POST', /^\/fiscal\/payroll\/\d+\/eliminate$/, fail(400, 'Documento ya eliminado'));
    await openNomina(api);
    await click(screen.getByTitle('Eliminar con nota de ajuste'));
    await expectToast('error', 'Documento ya eliminado');
  });

  it('solo dueño y administrador entran', async () => {
    resetBehavior({ role: 'CAJA', company: { einvoicingReleased: true } });
    nominaApi();
    await renderPage(<NominaPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
