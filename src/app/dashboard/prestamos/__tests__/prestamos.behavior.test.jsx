import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi,
  on,
  list,
  ok,
  baseRoutes,
  resetBehavior,
  renderPage,
  settle,
  screen,
  click,
  typeInto,
  button,
  waitForCall,
  expectToast,
  money,
} from '@/test/behaviorHarness';
import PrestamosPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const SETTINGS = { defaultInterestRate: 3, defaultMoraRate: null, graceDays: 0, defaultFrequency: 'MENSUAL', defaultAmortization: 'SIMPLE', rateConversion: 'PROPORCIONAL', roundTo: 1, requireApproval: false, excludeWeekdays: [], allocationOrder: ['MORA', 'INTERES', 'CAPITAL'], usuryRateMonthly: null, collectorCanRegisterPayments: true, requireCashForDisbursement: false, maxTerm: null, minAmount: null, maxAmount: null };

const INST = (number, dueDate, status, paid = false) => ({
  id: number, number, dueDate, capital: 100000, interest: 10000, total: 110000,
  capitalPaid: paid ? 100000 : 0, interestPaid: paid ? 10000 : 0, moraPaid: 0,
  pendingCapital: paid ? 0 : 100000, pendingInterest: paid ? 0 : 10000, moraAccrued: status === 'VENCIDA' ? 500 : 0,
  pendingTotal: paid ? 0 : status === 'VENCIDA' ? 110500 : 110000, status, daysLate: status === 'VENCIDA' ? 5 : 0,
});
const LOAN = {
  id: 1, code: 'PR-000001', status: 'DESEMBOLSADO', principal: 300000, interestRate: 10, moraRate: 3, graceDays: 0,
  frequency: 'MENSUAL', amortization: 'SIMPLE', termCount: 3, totalInterest: 30000, totalAmount: 330000,
  customer: { id: 1, name: 'ANA PÉREZ', document: '123', phone: '3001112233' }, collector: { id: 7, name: 'CARLOS COBRA' }, local: { id: 1, name: 'Sede' },
  installments: [INST(1, '2026-01-10', 'PAGADA', true), INST(2, '2026-02-10', 'VENCIDA'), INST(3, '2026-03-10', 'PENDIENTE')],
  payments: [{ id: 50, amount: 110000, method: 'EFECTIVO', paidAt: '2026-01-10T15:00:00.000Z', capitalApplied: 100000, interestApplied: 10000, moraApplied: 0, status: 'ACTIVO', createdBy: { id: 1, name: 'Dueño Prueba' } }],
  summary: { principal: 300000, totalInterest: 30000, totalAmount: 330000, paidCapital: 100000, paidInterest: 10000, paidMora: 0, paidTotal: 110000, pendingCapital: 200000, pendingInterest: 20000, moraAccrued: 500, pendingTotal: 220500, nextDueDate: '2026-02-10', nextInstallmentAmount: 110500, overdueInstallments: 1, overdueAmount: 110500, overdueDays: 5, progressPercent: 33, status: 'EN_MORA' },
};
const KPIS = { count: 1, activeCount: 1, portfolio: 220000, pendingCapital: 200000, pendingInterest: 20000, moraAccrued: 500, overdueCount: 1, overdueAmount: 110500, pendingTotal: 220500 };
const SUMMARY = { portfolio: 220000, pendingCapital: 200000, pendingInterest: 20000, moraAccrued: 500, activeLoans: 1, pendingApproval: 0, approvedNotDisbursed: 0, overdueLoans: 1, overdueAmount: 110500, moraIndex: 50.23, aging: { d0_30: 110500, d31_60: 0, d61_90: 0, d90p: 0 }, placedMonth: { amount: 300000, count: 1 }, collectedToday: { amount: 0, count: 0, capital: 0, interest: 0, mora: 0 }, collectedMonth: { amount: 110000, count: 1, capital: 100000, interest: 10000, mora: 0 }, upcoming7: { count: 0, amount: 0 }, byCollector: [], topOverdue: [] };

function loansApi() {
  return installApi([
    on('GET', /^\/loans$/, { success: true, data: { items: [LOAN], kpis: KPIS } }),
    on('GET', /^\/loans\/summary$/, { success: true, data: SUMMARY }),
    on('GET', /^\/loans\/settings$/, { success: true, data: SETTINGS }),
    on('GET', /^\/loans\/products$/, { success: true, data: [{ id: 3, name: 'MICROCRÉDITO', interestRate: 4, frequency: 'QUINCENAL', amortization: 'SIMPLE', roundTo: 1 }] }),
    on('POST', /^\/loans\/simulate$/, { success: true, data: { terms: { interestRate: 3, rateSource: 'COMPANY', frequency: 'MENSUAL', amortization: 'SIMPLE' }, warnings: [], availableCredit: null } }),
    on('GET', /^\/loans\/1$/, { success: true, data: LOAN }),
    on('POST', /^\/loans$/, ok({ id: 9, code: 'PR-000009', status: 'DESEMBOLSADO' })),
    on('POST', /^\/loans\/1\/payments$/, { success: true, data: { payment: { id: 51, amount: 110500 }, settled: false, loan: LOAN } }),
    on('GET', /^\/customers$/, list([{ id: 1, name: 'ANA PÉREZ', document: '123', phone: '3001112233' }, { id: 2, name: 'LUIS GÓMEZ' }])),
    on('GET', /^\/loans\/collectors$/, { success: true, data: [{ id: 7, name: 'CARLOS COBRA', phone: '', localId: 1, commissionCollectionRate: 5 }] }),
    on('GET', /^\/users$/, list([{ id: 1, name: 'Dueño Prueba', role: 'SUPER_ADMIN', status: 'ACTIVO' }, { id: 7, name: 'CARLOS COBRA', role: 'COBRADOR', status: 'ACTIVO' }])),
    ...baseRoutes(),
  ]);
}

describe('Préstamos (FINANCIERA)', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'FINANCIERA' });
    api = loansApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista la cartera con cliente, deuda a hoy, mora y KPIs del resumen', async () => {
    await renderPage(<PrestamosPage />);
    await waitForCall(api, 'GET', /^\/loans$/);
    expect(await screen.findByText('PR-000001')).toBeInTheDocument();
    expect(screen.getByText('ANA PÉREZ')).toBeInTheDocument();
    expect(screen.getAllByText('CARLOS COBRA').length).toBeGreaterThan(0);
    // Deuda a hoy (220.500) y cartera activa del resumen (220.000).
    expect(screen.getAllByText(money(220500)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(money(220000)).length).toBeGreaterThan(0);
    expect(screen.getByText('Cartera activa')).toBeInTheDocument();
    // Semáforo de mora de la fila.
    expect(screen.getByText('5 días')).toBeInTheDocument();
  });

  it('filtra por estado y por "solo en mora" enviando los parámetros correctos', async () => {
    await renderPage(<PrestamosPage />);
    await waitForCall(api, 'GET', /^\/loans$/);
    const sel = screen.getByLabelText('Estado');
    await click(sel);
    sel.value = 'PAGADO';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    await settle();
    const call = await waitForCall(api, 'GET', /^\/loans$/, { count: 2 });
    expect(call.query.status).toBe('PAGADO');
  });

  it('crea un préstamo: busca el cliente, pone capital y cuotas, y desembolsa', async () => {
    await renderPage(<PrestamosPage />);
    await waitForCall(api, 'GET', /^\/loans$/);
    await click(button('Nuevo préstamo'));
    const modal = (await screen.findByPlaceholderText('Buscar cliente por nombre…')).closest('.fixed');
    await typeInto(within(modal).getByPlaceholderText('Buscar cliente por nombre…'), 'ana');
    await waitForCall(api, 'GET', /^\/customers$/);
    await click(await within(modal).findByText('ANA PÉREZ'));
    await typeInto(modal.querySelector('input[name="principal"]'), '500000');
    await typeInto(modal.querySelector('input[name="termCount"]'), '5');
    await waitForCall(api, 'POST', /^\/loans\/simulate$/);
    // Vista previa local: SIMPLE 3% × 5 → intereses 75.000, cuota 115.000.
    expect(within(modal).getAllByText(money(115000)).length).toBeGreaterThan(0);
    await click(within(modal).getByRole('button', { name: 'Crear y desembolsar' }));
    const call = await waitForCall(api, 'POST', /^\/loans$/);
    expect(call.body).toMatchObject({ customerId: 1, principal: 500000, termCount: 5, frequency: 'MENSUAL', amortization: 'SIMPLE', disburseNow: true, disbursementMethod: 'EFECTIVO' });
    await expectToast('success', /PR-000009/);
  });

  it('abre el detalle y registra un abono con la cuota precargada', async () => {
    await renderPage(<PrestamosPage />);
    await waitForCall(api, 'GET', /^\/loans$/);
    await click(screen.getByText('PR-000001'));
    await waitForCall(api, 'GET', /^\/loans\/1$/);
    const detail = (await screen.findByText('Plan de pagos')).closest('.fixed');
    expect(within(detail).getByText('Total a pagar')).toBeInTheDocument();
    await click(within(detail).getByRole('button', { name: /Registrar abono/ }));
    const pay = (await screen.findByText('Registrar abono', { selector: 'h3' })).closest('form');
    // Precarga la próxima cuota pendiente (la vencida: 110.000 + 500 de mora).
    expect(pay.querySelector('input[name="amount"]').value).toBe(money(110500).replace(/ /g, ' '));
    await click(within(pay).getByRole('button', { name: 'Registrar abono' }));
    const call = await waitForCall(api, 'POST', /^\/loans\/1\/payments$/);
    expect(call.body).toMatchObject({ amount: 110500, method: 'EFECTIVO' });
    await expectToast('success', 'Abono registrado');
  });

  it('no deja abonar más que la deuda a hoy', async () => {
    await renderPage(<PrestamosPage />);
    await waitForCall(api, 'GET', /^\/loans$/);
    await click(screen.getByText('PR-000001'));
    const detail = (await screen.findByText('Plan de pagos')).closest('.fixed');
    await click(within(detail).getByRole('button', { name: /Registrar abono/ }));
    const pay = (await screen.findByText('Registrar abono', { selector: 'h3' })).closest('form');
    await typeInto(pay.querySelector('input[name="amount"]'), '999999999');
    await click(within(pay).getByRole('button', { name: 'Registrar abono' }));
    await expectToast('error', /supera la deuda/);
    expect(api.count('POST', /^\/loans\/1\/payments$/)).toBe(0);
  });

  it('el COBRADOR ve la lista pero no el botón de crear', async () => {
    resetBehavior({ type: 'FINANCIERA', role: 'COBRADOR' });
    api = loansApi();
    await renderPage(<PrestamosPage />);
    await waitForCall(api, 'GET', /^\/loans$/);
    expect(await screen.findByText('PR-000001')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Nuevo préstamo/ })).toBeNull();
  });

  it('un negocio sin el módulo (COMERCIO) no ve el módulo', async () => {
    resetBehavior({ type: 'COMERCIO' });
    api = loansApi();
    await renderPage(<PrestamosPage />);
    expect(await screen.findByText(/no está habilitado para tu negocio/)).toBeInTheDocument();
    expect(api.count('GET', /^\/loans$/)).toBe(0);
  });
});
