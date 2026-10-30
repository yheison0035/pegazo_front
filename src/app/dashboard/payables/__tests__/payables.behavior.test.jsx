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
import PayablesPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const PENDING = [
  { id: 1, concept: 'Arriendo local febrero', paidTo: 'Inmobiliaria Sur', type: 'ARRIENDO', amount: 1200000, dueDate: '2026-02-05T00:00:00.000Z', localId: 1, status: 'PENDIENTE', notes: '', paidAt: null },
  { id: 2, concept: 'Compra OC-0001', paidTo: 'Proveedor Uno', type: 'PEDIDOS', amount: 50000, dueDate: null, localId: 1, status: 'PENDIENTE', notes: 'Generada automáticamente', paidAt: null },
];
const PAID = [{ id: 3, concept: 'Internet enero', paidTo: 'Claro', type: 'SERVICIOS_PUBLICOS', amount: 90000, dueDate: '2026-01-10T00:00:00.000Z', localId: 1, status: 'PAGADO', notes: '', paidAt: '2026-01-09T10:00:00.000Z' }];
const SUMMARY = { pending: 1250000, count: 2, overdue: 1200000, overdueCount: 1, dueSoon: 0, dueSoonCount: 0 };

function payablesApi() {
  return installApi([
    on('GET', /^\/payables$/, (call) => ok(call.query.status === 'PAGADO' ? PAID : call.query.status === 'PENDIENTE' ? PENDING : [...PENDING, ...PAID])),
    on('GET', /^\/payables\/summary$/, ok(SUMMARY)),
    on('POST', /^\/payables$/, ok({ id: 9 })),
    on('PATCH', /^\/payables\/\d+\/pay$/, ok({ id: 1 })),
    on('PATCH', /^\/payables\/\d+\/unpay$/, ok({ id: 3 })),
    on('PATCH', /^\/payables\/\d+$/, ok({ id: 1 })),
    on('DELETE', /^\/payables\/\d+$/, ok()),
    ...baseRoutes(),
  ]);
}

describe('Cuentas por pagar', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = payablesApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga las pendientes y el resumen; las pestañas cambian el estado consultado', async () => {
    await renderPage(<PayablesPage />);
    const call = await waitForCall(api, 'GET', /^\/payables$/);
    expect(call.query).toMatchObject({ status: 'PENDIENTE', limit: '100' });
    await waitForCall(api, 'GET', /^\/payables\/summary$/);
    expect(await screen.findByText('Arriendo local febrero')).toBeInTheDocument();
    expect(screen.getByText('Compra OC-0001')).toBeInTheDocument();
    expect(screen.getAllByText(money(1250000)).length).toBeGreaterThan(0);

    await click(button(/Pagadas/));
    const paid = await waitForCall(api, 'GET', /^\/payables$/, { count: 2 });
    expect(paid.query.status).toBe('PAGADO');
    expect(await screen.findByText('Internet enero')).toBeInTheDocument();

    await click(button(/Todas/));
    const all = await waitForCall(api, 'GET', /^\/payables$/, { count: 3 });
    expect(all.query.status ?? '').toBe('');
  });

  it('crea una cuenta por pagar con concepto, categoría, valor, vencimiento y sede', async () => {
    await renderPage(<PayablesPage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    await click(button('Nueva cuenta'));
    const modal = (await screen.findByText('Nueva cuenta por pagar')).closest('.fixed');
    await typeInto(within(modal).getByPlaceholderText('Ej: Arriendo local, pedido proveedor X'), 'Plan celular marzo');
    const selects = within(modal).getAllByRole('combobox');
    await typeInto(selects[0], 'PLAN_CELULAR');
    await typeInto(within(modal).getByDisplayValue('Sede Centro'), '2');
    await typeInto(modal.querySelector('input[inputmode="numeric"]'), '65000');
    await typeInto(modal.querySelector('input[type="date"]'), '2026-03-05');
    await click(within(modal).getByRole('button', { name: 'Guardar' }));
    const call = await waitForCall(api, 'POST', /^\/payables$/);
    expect(call.body).toEqual({ concept: 'Plan celular marzo', type: 'PLAN_CELULAR', amount: 65000, dueDate: '2026-03-05', localId: 2 });
    await expectToast('success', 'Guardada correctamente');
    await waitForCall(api, 'GET', /^\/payables$/, { count: 2 });
  });

  it('sin concepto o valor no guarda y avisa', async () => {
    await renderPage(<PayablesPage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    await click(button('Nueva cuenta'));
    const modal = (await screen.findByText('Nueva cuenta por pagar')).closest('.fixed');
    await click(within(modal).getByRole('button', { name: 'Guardar' }));
    await expectToast('warning', 'Falta concepto, valor o sede');
    expect(api.count('POST', /^\/payables$/)).toBe(0);
  });

  it('"Pagar" registra el pago con fecha y método, y genera el gasto', async () => {
    await renderPage(<PayablesPage />);
    await screen.findByText('Arriendo local febrero');
    const row = screen.getByText('Arriendo local febrero').closest('tr') || screen.getByText('Arriendo local febrero').closest('div');
    await click(within(row).getByRole('button', { name: /Pagar/ }));
    const modal = (await screen.findByText('Registrar pago')).closest('.fixed');
    await click(within(modal).getByRole('button', { name: 'Transferencia' }));
    await typeInto(modal.querySelector('input[type="date"]'), '2026-02-04');
    await click(within(modal).getByRole('button', { name: 'Confirmar pago' }));
    const call = await waitForCall(api, 'PATCH', /^\/payables\/1\/pay$/);
    expect(call.body.paymentMethod).toBe('TRANSFERENCIA');
    expect(String(call.body.paidAt)).toMatch(/^2026-02-0/);
    await expectToast('success', 'Pago registrado');
  });

  it('"Deshacer el pago" en una pagada llama /unpay', async () => {
    await renderPage(<PayablesPage />);
    await screen.findByText('Arriendo local febrero');
    await click(button(/Pagadas/));
    await screen.findByText('Internet enero');
    await click(screen.getByTitle('Deshacer el pago (borra el gasto)'));
    await waitForCall(api, 'PATCH', /^\/payables\/3\/unpay$/);
    await waitForCall(api, 'GET', /^\/payables$/, { count: 3 });
  });

  it('editar precarga la cuenta y guarda con PATCH', async () => {
    await renderPage(<PayablesPage />);
    await screen.findByText('Arriendo local febrero');
    const row = screen.getByText('Arriendo local febrero').closest('tr');
    await click(within(row).getByLabelText('Editar'));
    const modal = (await screen.findByText('Editar cuenta por pagar')).closest('.fixed');
    const concept = within(modal).getByPlaceholderText('Ej: Arriendo local, pedido proveedor X');
    expect(concept.value).toBe('Arriendo local febrero');
    await typeInto(concept, 'Arriendo local febrero (ajustado)');
    await click(within(modal).getByRole('button', { name: 'Guardar' }));
    const call = await waitForCall(api, 'PATCH', /^\/payables\/1$/);
    expect(call.body).toMatchObject({ concept: 'Arriendo local febrero (ajustado)', amount: 1200000, type: 'ARRIENDO', localId: 1 });
  });

  it('eliminar llama DELETE; un error se avisa', async () => {
    await renderPage(<PayablesPage />);
    await screen.findByText('Arriendo local febrero');
    const row = screen.getByText('Compra OC-0001').closest('tr');
    await click(within(row).getByLabelText('Eliminar'));
    await waitForCall(api, 'DELETE', /^\/payables\/2$/);

    api.set('DELETE', /^\/payables\/\d+$/, fail(400, 'No se puede eliminar una cuenta pagada'));
    const row1 = screen.getByText('Arriendo local febrero').closest('tr');
    await click(within(row1).getByLabelText('Eliminar'));
    await expectToast('error', 'cuenta pagada');
  });

  it('solo dueño, administrador y recepcionista entran', async () => {
    resetBehavior({ role: 'ASESOR' });
    payablesApi();
    await renderPage(<PayablesPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
