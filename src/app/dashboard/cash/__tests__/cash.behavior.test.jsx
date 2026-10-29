import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  queryButton,
  placeholder,
  waitForCall,
  expectToast,
  router,
  formatCOP,
  money,
} from '@/test/behaviorHarness';
import CashPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const OPEN_CASH = {
  id: 5,
  localId: 1,
  openingAmount: 100000,
  openedAt: new Date().toISOString(),
  openedBy: { name: 'Dueño Prueba' },
  status: 'ABIERTA',
  totals: { ingresos: 50000, egresos: 20000, expected: 130000 },
  movements: [{ id: 1, type: 'INGRESO', amount: 50000, concept: 'Venta mostrador' }],
};
const HISTORY = [
  { id: 2, openedAt: '2026-02-01T13:00:00.000Z', closedAt: '2026-02-01T23:00:00.000Z', openingAmount: 100000, expectedAmount: 120000, countedAmount: 120000, difference: 0, status: 'CERRADA' },
];

function cashApi({ current = null, history = HISTORY, locals } = {}) {
  const routes = [
    on('GET', /^\/cash\/current$/, ok(current)),
    on('GET', /^\/cash$/, ok(history)),
    on('POST', /^\/cash\/open$/, ok({ id: 6 })),
    on('POST', /^\/cash\/\d+\/movement$/, ok({ id: 9 })),
    on('POST', /^\/cash\/\d+\/close$/, ok({ id: 5, difference: 0 })),
    on('POST', /^\/cash\/\d+\/reopen$/, ok({ id: 2 })),
    on('PATCH', /^\/cash\/\d+\/opening$/, ok({ id: 5 })),
    on('DELETE', /^\/cash\/\d+$/, ok()),
  ];
  if (locals) routes.push(on('GET', /^\/locals$/, list(locals)));
  return installApi([...routes, ...baseRoutes()]);
}

describe('Caja · sin caja abierta', () => {
  afterEach(() => vi.restoreAllMocks());

  it('consulta la caja de la sede y ofrece abrirla con la base inicial', async () => {
    resetBehavior();
    const api = cashApi();
    await renderPage(<CashPage />);
    const call = await waitForCall(api, 'GET', /^\/cash\/current$/);
    expect(call.query.localId).toBe('1');
    expect(screen.getByText(/No hay una caja abierta/)).toBeInTheDocument();
    await typeInto(placeholder('Base inicial (ej: $ 100.000)'), '100000');
    expect(placeholder('Base inicial (ej: $ 100.000)').value).toBe(formatCOP(100000));
    await click(button('Abrir caja'));
    const open = await waitForCall(api, 'POST', /^\/cash\/open$/);
    expect(open.body).toEqual({ localId: 1, openingAmount: 100000 });
    await expectToast('success', 'Caja abierta');
    await waitForCall(api, 'GET', /^\/cash\/current$/, { count: 2 });
  });

  it('si el backend rechaza la apertura se avisa el motivo', async () => {
    resetBehavior();
    const api = cashApi();
    api.set('POST', /^\/cash\/open$/, fail(400, 'Ya existe una caja abierta en esta sede'));
    await renderPage(<CashPage />);
    await waitForCall(api, 'GET', /^\/cash\/current$/);
    await click(button('Abrir caja'));
    await expectToast('error', 'Ya existe una caja abierta');
  });

  it('con una caja cerrada en el historial, el dueño puede reabrirla', async () => {
    resetBehavior();
    const api = cashApi();
    await renderPage(<CashPage />);
    const hist = await waitForCall(api, 'GET', /^\/cash$/);
    expect(hist.query).toMatchObject({ localId: '1', status: 'CERRADA', limit: '8' });
    const reopen = await screen.findByRole('button', { name: 'Reabrir' });
    expect(reopen).not.toBeDisabled();
    await click(reopen);
    await waitForCall(api, 'POST', /^\/cash\/2\/reopen$/);
    await expectToast('success', 'Caja reabierta');
  });

  it('con varias sedes, cambiar la sede consulta la caja de esa sede', async () => {
    resetBehavior();
    const api = cashApi({ locals: [{ id: 1, name: 'Sede Centro' }, { id: 2, name: 'Sede Norte' }] });
    await renderPage(<CashPage />);
    await waitForCall(api, 'GET', /^\/cash\/current$/);
    const select = await screen.findByDisplayValue('Sede Centro');
    await typeInto(select, '2');
    const call = await waitForCall(api, 'GET', /^\/cash\/current$/, { count: 2 });
    expect(call.query.localId).toBe('2');
  });
});

describe('Caja · con caja abierta', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = cashApi({ current: OPEN_CASH });
  });
  afterEach(() => vi.restoreAllMocks());

  it('muestra base, ingresos, egresos, esperado y los movimientos', async () => {
    await renderPage(<CashPage />);
    await waitForCall(api, 'GET', /^\/cash\/current$/);
    expect(await screen.findByText('Base inicial')).toBeInTheDocument();
    expect(screen.getAllByText(money(100000)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(money(130000)).length).toBeGreaterThan(0);
    expect(screen.getByText('Venta mostrador')).toBeInTheDocument();
    expect(screen.queryByText(/No hay una caja abierta/)).toBeNull();
    // Con caja abierta no se puede reabrir otra.
    expect(screen.getByRole('button', { name: 'Reabrir' })).toBeDisabled();
  });

  it('registra un egreso manual con monto y concepto', async () => {
    await renderPage(<CashPage />);
    await screen.findByText('Base inicial');
    expect(button('Registrar')).toBeDisabled();
    await click(screen.getByRole('button', { name: /Egreso/i }));
    await typeInto(placeholder('Monto'), '20000');
    await typeInto(placeholder('Concepto (ej: retiro, pago proveedor…)'), 'retiro para domicilios');
    await click(button('Registrar'));
    const call = await waitForCall(api, 'POST', /^\/cash\/5\/movement$/);
    expect(call.body).toEqual({ type: 'EGRESO', amount: 20000, concept: 'retiro para domicilios' });
    await waitForCall(api, 'GET', /^\/cash\/current$/, { count: 2 });
    expect(placeholder('Monto').value).toBe('');
  });

  it('cierra la caja con el efectivo contado y reporta si cuadra', async () => {
    await renderPage(<CashPage />);
    await screen.findByText('Base inicial');
    expect(button('Cerrar caja')).toBeDisabled();
    await typeInto(placeholder('Efectivo contado'), '130000');
    await click(button('Cerrar caja'));
    const call = await waitForCall(api, 'POST', /^\/cash\/5\/close$/);
    expect(call.body).toEqual({ countedAmount: 130000 });
    await expectToast('success', 'cuadra exactamente');
  });

  it('si el arqueo no cuadra, avisa la diferencia (faltante)', async () => {
    api.set('POST', /^\/cash\/\d+\/close$/, ok({ id: 5, difference: -5000 }));
    await renderPage(<CashPage />);
    await screen.findByText('Base inicial');
    await typeInto(placeholder('Efectivo contado'), '125000');
    await click(button('Cerrar caja'));
    await waitForCall(api, 'POST', /^\/cash\/5\/close$/);
    const t = await expectToast('warning', 'faltante');
    expect(t.message).toContain(formatCOP(5000));
  });

  it('corrige la base inicial con PATCH /opening', async () => {
    await renderPage(<CashPage />);
    await screen.findByText('Base inicial');
    await click(button('Corregir base inicial'));
    const input = placeholder('Base inicial (ej: $ 100.000)');
    expect(input.value).toBe(formatCOP(100000));
    await typeInto(input, '120000');
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PATCH', /^\/cash\/5\/opening$/);
    expect(call.body).toEqual({ openingAmount: 120000 });
    await expectToast('success', 'Base inicial actualizada');
  });

  it('cancelar la corrección de base no llama al backend', async () => {
    await renderPage(<CashPage />);
    await screen.findByText('Base inicial');
    await click(button('Corregir base inicial'));
    await click(button('Cancelar'));
    expect(screen.queryByPlaceholderText('Base inicial (ej: $ 100.000)')).toBeNull();
    expect(api.count('PATCH', /opening/)).toBe(0);
  });

  it('eliminar / reiniciar la caja pide confirmación y llama DELETE', async () => {
    await renderPage(<CashPage />);
    await screen.findByText('Base inicial');
    await click(button('Eliminar / reiniciar caja'));
    expect(screen.getByText('¿Eliminar / reiniciar caja?')).toBeInTheDocument();
    expect(api.count('DELETE', /^\/cash/)).toBe(0);
    await click(button('Eliminar caja'));
    await waitForCall(api, 'DELETE', /^\/cash\/5$/);
    await expectToast('success', 'Caja eliminada');
    await waitForCall(api, 'GET', /^\/cash\/current$/, { count: 2 });
  });
});

describe('Caja · permisos', () => {
  afterEach(() => vi.restoreAllMocks());

  it('el rol caja corrige la base pero no elimina ni reabre', async () => {
    resetBehavior({ role: 'CAJA' });
    const api = cashApi({ current: OPEN_CASH });
    await renderPage(<CashPage />);
    await screen.findByText('Base inicial');
    expect(queryButton('Corregir base inicial')).toBeTruthy();
    expect(queryButton('Eliminar / reiniciar caja')).toBeNull();
    expect(queryButton('Reabrir')).toBeNull();
    expect(api.count('GET', /^\/cash$/)).toBeGreaterThan(0);
  });

  it('el barbero no entra al módulo de caja', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    cashApi();
    await renderPage(<CashPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
    expect(screen.queryByText('Caja')).toBeNull();
  });
});
