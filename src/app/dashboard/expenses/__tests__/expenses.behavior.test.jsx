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
  formatCOP,
} from '@/test/behaviorHarness';
import ExpensesPage from '../page';
import NewExpensePage from '../new/page';
import EditExpensePage from '../edit/[id]/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const EXPENSES = [
  {
    id: 1,
    concept: 'LUZ ENERO',
    type: 'OPERATIVO',
    amount: 150000,
    paymentMethod: 'EFECTIVO',
    paidTo: 'EPM',
    localId: 1,
    local: { id: 1, name: 'Sede Centro' },
    providerId: null,
    provider: null,
    expenseCategoryId: 11,
    expenseCategory: { id: 11, name: 'Servicios públicos' },
    expenseDate: '2026-01-15T00:00:00.000Z',
    status: 'ACTIVO',
    notes: '',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 2,
    concept: 'ARRIENDO ENERO',
    type: 'OPERATIVO',
    amount: 1200000,
    paymentMethod: 'TRANSFERENCIA',
    paidTo: 'INMOBILIARIA SUR',
    localId: 1,
    local: { id: 1, name: 'Sede Centro' },
    providerId: 7,
    provider: { id: 7, name: 'Proveedor Uno' },
    expenseCategoryId: 12,
    expenseCategory: { id: 12, name: 'Arriendo' },
    expenseDate: '2026-01-05T00:00:00.000Z',
    status: 'ACTIVO',
    notes: '',
    createdAt: '2026-01-05T10:00:00.000Z',
  },
];

function expensesApi() {
  return installApi([
    on('GET', /^\/expenses$/, list(EXPENSES, { total: 2 })),
    on('GET', /^\/expenses\/\d+$/, detail(EXPENSES[0])),
    on('DELETE', /^\/expenses\/\d+$/, ok()),
    on('POST', /^\/expenses$/, ok({ id: 9 })),
    on('PUT', /^\/expenses\/\d+$/, ok({ id: 1 })),
    on('GET', /^\/fixed-expenses$/, ok([])),
    ...baseRoutes(),
  ]);
}

describe('Gastos · listado', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = expensesApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga la lista con paginación y muestra los gastos', async () => {
    await renderPage(<ExpensesPage />);
    const call = await waitForCall(api, 'GET', /^\/expenses$/);
    expect(call.query).toMatchObject({ page: '1', limit: '10' });
    expect(screen.getByText('LUZ ENERO')).toBeInTheDocument();
    expect(screen.getByText('ARRIENDO ENERO')).toBeInTheDocument();
    expect(screen.getByText('Agregar Gastos').closest('a')).toHaveAttribute('href', '/dashboard/expenses/new');
  });

  it('filtra por concepto y por fecha', async () => {
    await renderPage(<ExpensesPage />);
    await waitForCall(api, 'GET', /^\/expenses$/);
    await typeInto(screen.getAllByPlaceholderText('Filtrar Concepto')[0], 'LUZ');
    let call = await waitForCall(api, 'GET', /^\/expenses$/, { count: 2 });
    expect(call.query.concept).toBe('LUZ');
    await typeInto(screen.getAllByPlaceholderText('Filtrar por fecha')[0], '2026-01-15');
    call = await waitForCall(api, 'GET', /^\/expenses$/, { count: 3 });
    expect(call.query).toMatchObject({ concept: 'LUZ', expenseDate: '2026-01-15' });
  });

  it('la pestaña "Gastos fijos" carga los recurrentes y vuelve a movimientos', async () => {
    await renderPage(<ExpensesPage />);
    await waitForCall(api, 'GET', /^\/expenses$/);
    await click(button('Gastos fijos'));
    await waitForCall(api, 'GET', /^\/fixed-expenses$/);
    expect(screen.getByRole('heading', { name: 'Gastos fijos' })).toBeInTheDocument();
    await click(button('Movimientos'));
    expect(screen.getByRole('heading', { name: 'Listado de Gastos' })).toBeInTheDocument();
  });

  it('ver detalle abre la ficha del pago', async () => {
    await renderPage(<ExpensesPage />);
    await waitForCall(api, 'GET', /^\/expenses$/);
    await click(rowButton('ARRIENDO ENERO', 'Ver detalle'));
    const modal = screen.getByText('Detalles del Pago').closest('.fixed');
    expect(within(modal).getByText('ARRIENDO ENERO')).toBeInTheDocument();
    expect(within(modal).getByText('Proveedor Uno')).toBeInTheDocument();
  });

  it('eliminar confirma, llama DELETE y recarga', async () => {
    await renderPage(<ExpensesPage />);
    await waitForCall(api, 'GET', /^\/expenses$/);
    await click(rowButton('LUZ ENERO', 'Eliminar'));
    const modal = screen.getByText('Confirmar eliminación').parentElement;
    expect(within(modal).getByText('LUZ ENERO')).toBeInTheDocument();
    await click(within(modal).getByRole('button', { name: 'Eliminar' }));
    await waitForCall(api, 'DELETE', /^\/expenses\/1$/);
    await waitForCall(api, 'GET', /^\/expenses$/, { count: 2 });
    expect(screen.queryByText('Confirmar eliminación')).not.toBeInTheDocument();
  });

  it('si el borrado falla se avisa y se cierra la confirmación', async () => {
    api.set('DELETE', /^\/expenses\/\d+$/, fail(400, 'Gasto ya contabilizado'));
    await renderPage(<ExpensesPage />);
    await waitForCall(api, 'GET', /^\/expenses$/);
    await click(rowButton('LUZ ENERO', 'Eliminar'));
    const modal = screen.getByText('Confirmar eliminación').parentElement;
    await click(within(modal).getByRole('button', { name: 'Eliminar' }));
    await expectToast('error', 'Gasto ya contabilizado');
    expect(screen.queryByText('Confirmar eliminación')).not.toBeInTheDocument();
  });
});

describe('Gastos · permisos', () => {
  afterEach(() => vi.restoreAllMocks());

  it('el asesor crea y edita pero no elimina', async () => {
    resetBehavior({ role: 'ASESOR' });
    const api = expensesApi();
    await renderPage(<ExpensesPage />);
    await waitForCall(api, 'GET', /^\/expenses$/);
    expect(screen.getByText('Agregar Gastos')).toBeInTheDocument();
    expect(rowButton('LUZ ENERO', 'Editar')).toBeTruthy();
    expect(queryRowButton('LUZ ENERO', 'Eliminar')).toBeNull();
  });

  it('el auxiliar no ve el botón de agregar ni acciones de edición', async () => {
    resetBehavior({ role: 'AUXILIAR' });
    const api = expensesApi();
    await renderPage(<ExpensesPage />);
    await waitForCall(api, 'GET', /^\/expenses$/);
    expect(screen.queryByText('Agregar Gastos')).toBeNull();
    expect(queryRowButton('LUZ ENERO', 'Editar')).toBeNull();
    expect(queryRowButton('LUZ ENERO', 'Eliminar')).toBeNull();
  });
});

describe('Gastos · crear', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = expensesApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga tipos de gasto, proveedores, sedes y métodos de pago', async () => {
    await renderPage(<NewExpensePage />);
    await waitForCall(api, 'GET', /^\/expense-categories$/);
    await waitForCall(api, 'GET', /^\/providers$/);
    await waitForCall(api, 'GET', /^\/locals$/);
    await waitForCall(api, 'GET', /^\/enums\/payment-methods$/);
    await waitFor(() => expect(screen.getByText('Servicios públicos')).toBeInTheDocument());
    expect(screen.getByText('Proveedor Uno')).toBeInTheDocument();
    expect(screen.getByText('Sede Centro')).toBeInTheDocument();
  });

  it('registra el gasto con POST /expenses y el cuerpo normalizado', async () => {
    await renderPage(<NewExpensePage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    setField('concept', 'luz febrero');
    setField('expenseCategoryId', '11');
    setField('amount', '250000');
    setField('paymentMethod', 'EFECTIVO');
    setField('paidTo', 'epm');
    setField('providerId', '7');
    setField('localId', '1');
    setField('expenseDate', '2026-02-10');
    setField('status', 'ACTIVO');
    expect(document.querySelector('[name="amount"]').value).toBe(formatCOP(250000));
    await submitForm();
    const call = await waitForCall(api, 'POST', /^\/expenses$/);
    expect(call.body).toMatchObject({
      concept: 'LUZ FEBRERO',
      expenseCategoryId: 11,
      amount: 250000,
      paymentMethod: 'EFECTIVO',
      paidTo: 'EPM',
      providerId: 7,
      localId: 1,
      status: 'ACTIVO',
    });
    expect(String(call.body.expenseDate)).toMatch(/^2026-02-10/);
    // El tipo (enum) lo deriva el backend desde la categoría: no se manda vacío.
    expect('type' in call.body).toBe(false);
    const t = await expectToast('success', 'Gasto añadido');
    expect(t.url).toBe('/dashboard/expenses');
  });

  it('sin proveedor se envía null (la sede sí es obligatoria)', async () => {
    await renderPage(<NewExpensePage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    setField('concept', 'taxi');
    setField('expenseCategoryId', '12');
    setField('amount', '20000');
    setField('paymentMethod', 'EFECTIVO');
    setField('paidTo', 'conductor');
    setField('localId', '1');
    setField('expenseDate', '2026-02-11');
    setField('status', 'ACTIVO');
    await submitForm();
    const call = await waitForCall(api, 'POST', /^\/expenses$/);
    expect(call.body.providerId).toBeNull();
    expect(call.body.localId).toBe(1);
  });

  it('un error del backend se muestra como aviso', async () => {
    api.set('POST', /^\/expenses$/, fail(400, 'La fecha está en un periodo cerrado'));
    await renderPage(<NewExpensePage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    setField('concept', 'luz');
    setField('expenseCategoryId', '11');
    setField('amount', '1000');
    setField('paymentMethod', 'EFECTIVO');
    setField('paidTo', 'epm');
    setField('localId', '1');
    setField('expenseDate', '2025-01-10');
    setField('status', 'ACTIVO');
    await submitForm();
    await waitForCall(api, 'POST', /^\/expenses$/);
    const t = await expectToast('error', 'periodo cerrado');
    expect(t.url).toBeFalsy();
  });
});

describe('Gastos · editar', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    authState.params = { id: '1' };
    api = expensesApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('precarga el gasto y guarda con PUT sin relaciones ni campos de solo lectura', async () => {
    await renderPage(<EditExpensePage />);
    await waitForCall(api, 'GET', /^\/expenses\/1$/);
    await waitFor(() => expect(document.querySelector('[name="concept"]').value).toBe('LUZ ENERO'));
    await settle();
    setField('amount', '175000');
    await submitForm();
    const call = await waitForCall(api, 'PUT', /^\/expenses\/1$/);
    expect(call.body.amount).toBe(175000);
    expect(call.body.concept).toBe('LUZ ENERO');
    for (const k of ['id', 'createdAt', 'updatedAt', 'local', 'provider', 'expenseCategory']) {
      expect(k in call.body, `no debe viajar ${k}`).toBe(false);
    }
    await expectToast('success', /actualizado/i);
  });
});
