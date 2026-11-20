import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi, on, list, ok, baseRoutes, resetBehavior, renderPage, settle, screen, click, typeInto, button, waitForCall, expectToast, money,
} from '@/test/behaviorHarness';
import PrestamosPage from '../page';
import ReportesPage from '../reportes/page';
import ProductosPage from '../productos/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
vi.mock('recharts', () => {
  const Box = ({ children }) => <div>{children}</div>;
  return { ResponsiveContainer: Box, BarChart: Box, Bar: () => null, XAxis: () => null, YAxis: () => null, CartesianGrid: () => null, Tooltip: () => null, Legend: () => null };
});

const SETTINGS = { defaultInterestRate: 3, defaultMoraRate: null, graceDays: 0, defaultFrequency: 'MENSUAL', defaultAmortization: 'SIMPLE', rateConversion: 'PROPORCIONAL', roundTo: 1, requireApproval: false, excludeWeekdays: [], allocationOrder: ['MORA', 'INTERES', 'CAPITAL'], usuryRateMonthly: null, collectorCanRegisterPayments: true, requireCashForDisbursement: false, maxTerm: null, minAmount: null, maxAmount: null, remindersEnabled: true, reminderDaysBefore: 1, alertsEnabled: true };
const INST = (number, dueDate, status, paid = false) => ({
  id: number, number, dueDate, capital: 100000, interest: 10000, total: 110000,
  capitalPaid: paid ? 100000 : 0, interestPaid: paid ? 10000 : 0, moraPaid: 0,
  pendingCapital: paid ? 0 : 100000, pendingInterest: paid ? 0 : 10000, moraAccrued: status === 'VENCIDA' ? 500 : 0,
  pendingTotal: paid ? 0 : status === 'VENCIDA' ? 110500 : 110000, status, daysLate: status === 'VENCIDA' ? 5 : 0,
});
const base = { principal: 300000, interestRate: 10, moraRate: 3, graceDays: 0, frequency: 'MENSUAL', amortization: 'SIMPLE', termCount: 3, totalInterest: 30000, totalAmount: 330000, customer: { id: 1, name: 'ANA PÉREZ', document: '123', phone: '3001112233', email: 'ana@x.com' }, collector: { id: 7, name: 'CARLOS COBRA' }, local: { id: 1, name: 'Sede' }, product: null };
const LOAN_MORA = { ...base, id: 1, code: 'PR-000001', status: 'DESEMBOLSADO',
  installments: [INST(1, '2026-01-10', 'PAGADA', true), INST(2, '2026-02-10', 'VENCIDA'), INST(3, '2026-03-10', 'PENDIENTE')],
  payments: [{ id: 50, amount: 110000, method: 'EFECTIVO', paidAt: '2026-01-10T15:00:00.000Z', capitalApplied: 100000, interestApplied: 10000, moraApplied: 0, status: 'ACTIVO', createdBy: { id: 1, name: 'Dueño Prueba' } }],
  summary: { paidTotal: 110000, pendingCapital: 200000, pendingInterest: 20000, moraAccrued: 500, pendingTotal: 220500, nextDueDate: '2026-02-10', nextInstallmentAmount: 110500, overdueInstallments: 1, overdueAmount: 110500, overdueDays: 5, progressPercent: 33, status: 'EN_MORA', principal: 300000, totalInterest: 30000, totalAmount: 330000 } };
const LOAN_OK = { ...base, id: 2, code: 'PR-000002', status: 'DESEMBOLSADO',
  installments: [INST(1, '2026-01-10', 'PAGADA', true), INST(2, '2099-02-10', 'PENDIENTE'), INST(3, '2099-03-10', 'PENDIENTE')], payments: [],
  summary: { paidTotal: 110000, pendingCapital: 200000, pendingInterest: 20000, moraAccrued: 0, pendingTotal: 220000, nextDueDate: '2099-02-10', nextInstallmentAmount: 110000, overdueInstallments: 0, overdueAmount: 0, overdueDays: 0, progressPercent: 33, status: 'AL_DIA', principal: 300000, totalInterest: 30000, totalAmount: 330000 } };
const SUMMARY = { portfolio: 440000, pendingCapital: 400000, pendingInterest: 40000, moraAccrued: 500, activeLoans: 2, pendingApproval: 0, approvedNotDisbursed: 0, overdueLoans: 1, overdueAmount: 110500, moraIndex: 25.11, aging: { d0_30: 110500, d31_60: 0, d61_90: 0, d90p: 0 }, placedMonth: { amount: 600000, count: 2 }, collectedToday: { amount: 0, count: 0, capital: 0, interest: 0, mora: 0 }, collectedMonth: { amount: 220000, count: 2, capital: 200000, interest: 20000, mora: 0 }, upcoming7: { count: 0, amount: 0 }, byCollector: [{ id: 7, name: 'CARLOS COBRA', loans: 2, portfolio: 440000, overdue: 110500, collectedMonth: 220000, collectedCount: 2, commissionRate: 5, commission: 11000 }], topOverdue: [{ id: 1, code: 'PR-000001', customer: { name: 'ANA PÉREZ' }, overdueDays: 5, overdueAmount: 110500, collector: { name: 'CARLOS COBRA' } }] };
const MONTHLY = { months: [{ month: '2026-01', placed: 300000, placedCount: 1, collected: 110000, capital: 100000, interest: 10000, mora: 0, paymentsCount: 1 }, { month: '2026-02', placed: 300000, placedCount: 1, collected: 110000, capital: 100000, interest: 10000, mora: 0, paymentsCount: 1 }], totals: { placed: 600000, collected: 220000, interest: 20000, mora: 0 } };

function api() {
  return installApi([
    on('GET', /^\/loans$/, { success: true, data: { items: [LOAN_MORA, LOAN_OK], kpis: { count: 2, activeCount: 2, portfolio: 440000, pendingCapital: 400000, pendingInterest: 40000, moraAccrued: 500, overdueCount: 1, overdueAmount: 110500, pendingTotal: 440500 } } }),
    on('GET', /^\/loans\/summary$/, { success: true, data: SUMMARY }),
    on('GET', /^\/loans\/reports\/monthly$/, { success: true, data: MONTHLY }),
    on('GET', /^\/loans\/settings$/, { success: true, data: SETTINGS }),
    on('GET', /^\/loans\/products$/, { success: true, data: [{ id: 3, name: 'MICROCRÉDITO', interestRate: 4, moraRate: null, graceDays: 0, frequency: 'QUINCENAL', amortization: 'SIMPLE', roundTo: 1, status: 'ACTIVO' }] }),
    on('PATCH', /^\/loans\/settings$/, ok(SETTINGS)),
    on('GET', /^\/loans\/1$/, { success: true, data: LOAN_MORA }),
    on('GET', /^\/loans\/2$/, { success: true, data: LOAN_OK }),
    on('GET', /^\/loans\/2\/extra-capital\/quote$/, { success: true, data: { settled: false, remainingCapital: 100000, removedNumbers: [2, 3], newInstallments: [{ number: 2 }, { number: 3 }], newTermCount: 3, interestBefore: 20000, interestAfter: 10000, installmentBefore: 110000, installmentAfter: 55000, pendingCapitalBefore: 200000 } }),
    on('POST', /^\/loans\/2\/extra-capital$/, { success: true, data: LOAN_OK }),
    on('GET', /^\/loans\/1\/settlement\/quote$/, { success: true, data: { capital: 200000, interest: 20000, mora: 500, total: 220500, forgivenInterest: 0, installmentNumbersDue: [2, 3], pendingTotalNormal: 220500 } }),
    on('POST', /^\/loans\/1\/settle$/, { success: true, data: { ...LOAN_MORA, status: 'PAGADO' } }),
    on('POST', /^\/loans\/1\/refinance$/, ok({ id: 9, code: 'PR-000009' })),
    on('POST', /^\/loans\/1\/reminder$/, ok({ sent: true, to: 'ana@x.com' })),
    on('POST', /^\/loans\/1\/payments$/, { success: true, data: { payment: { id: 51, amount: 110500, method: 'EFECTIVO', paidAt: '2026-02-15T15:00:00.000Z', capitalApplied: 100000, interestApplied: 10000, moraApplied: 500 }, settled: false, loan: { ...LOAN_MORA, summary: { ...LOAN_MORA.summary, pendingTotal: 110000, nextDueDate: '2026-03-10', nextInstallmentAmount: 110000 } } } }),
    on('GET', /^\/loans\/collectors$/, { success: true, data: [{ id: 7, name: 'CARLOS COBRA', phone: '', localId: 1, commissionCollectionRate: 5 }] }),
    on('GET', /^\/users$/, list([{ id: 7, name: 'CARLOS COBRA', role: 'COBRADOR', status: 'ACTIVO' }])),
    on('GET', /^\/customers$/, list([])),
    ...baseRoutes(),
  ]);
}

let a;
const openDetail = async (code) => {
  await renderPage(<PrestamosPage />);
  await waitForCall(a, 'GET', /^\/loans$/);
  await click(screen.getByText(code));
  return (await screen.findByText('Plan de pagos')).closest('.fixed');
};

describe('Préstamos · fase 2', () => {
  beforeEach(() => {
    resetBehavior({ type: 'FINANCIERA' });
    a = api();
  });
  afterEach(() => vi.restoreAllMocks());

  it('abono a capital: cotiza en vivo y aplica bajando la cuota', async () => {
    const detail = await openDetail('PR-000002');
    await click(within(detail).getByRole('button', { name: 'Abono a capital' }));
    const modal = (await screen.findByText('Abono a capital', { selector: 'h3' })).closest('.fixed');
    await typeInto(modal.querySelector('input[name="amount"]'), '100000');
    const q = await waitForCall(a, 'GET', /^\/loans\/2\/extra-capital\/quote$/);
    expect(q.query).toMatchObject({ amount: '100000', mode: 'REDUCE_INSTALLMENT' });
    expect(await within(modal).findByText(/Te ahorras/)).toHaveTextContent(money(10000));
    await click(within(modal).getByRole('button', { name: 'Aplicar abono a capital' }));
    const post = await waitForCall(a, 'POST', /^\/loans\/2\/extra-capital$/);
    expect(post.body).toEqual({ amount: 100000, mode: 'REDUCE_INSTALLMENT', method: 'EFECTIVO' });
    await expectToast('success', 'Abono a capital aplicado');
  });

  it('liquidación anticipada: muestra la cotización y salda', async () => {
    const detail = await openDetail('PR-000001');
    await click(within(detail).getByRole('button', { name: 'Liquidar hoy' }));
    await waitForCall(a, 'GET', /^\/loans\/1\/settlement\/quote$/);
    const modal = (await screen.findByText('Total para saldar hoy')).closest('.fixed');
    expect(within(modal).getAllByText(money(220500)).length).toBeGreaterThan(0);
    await click(within(modal).getByRole('button', { name: /Liquidar por/ }));
    const post = await waitForCall(a, 'POST', /^\/loans\/1\/settle$/);
    expect(post.body).toEqual({ method: 'EFECTIVO' });
    await expectToast('success', '¡Préstamo liquidado!');
  });

  it('refinanciación: nuevo capital = deuda a hoy, con opción de perdonar la mora', async () => {
    const detail = await openDetail('PR-000001');
    await click(within(detail).getByRole('button', { name: 'Refinanciar' }));
    await waitForCall(a, 'GET', /^\/loans\/1\/settlement\/quote$/);
    const modal = (await screen.findByText('Nuevo capital')).closest('.fixed');
    expect(within(modal).getByText(money(220500))).toBeInTheDocument();
    await click(modal.querySelector('input[name="forgiveMora"]'));
    expect(within(modal).getByText(money(220000))).toBeInTheDocument();
    await typeInto(modal.querySelector('input[name="termCount"]'), '6');
    await click(within(modal).getByRole('button', { name: 'Refinanciar' }));
    const post = await waitForCall(a, 'POST', /^\/loans\/1\/refinance$/);
    expect(post.body).toEqual({ termCount: 6, frequency: 'MENSUAL', amortization: 'SIMPLE', forgiveMora: true });
    await expectToast('success', /PR-000009/);
  });

  it('recordatorio por correo con un clic', async () => {
    const detail = await openDetail('PR-000001');
    await click(within(detail).getByRole('button', { name: /Recordar por correo/ }));
    await waitForCall(a, 'POST', /^\/loans\/1\/reminder$/);
    await expectToast('success', /ana@x\.com/);
  });

  it('tras registrar un abono muestra el recibo con enlace de WhatsApp', async () => {
    const detail = await openDetail('PR-000001');
    await click(within(detail).getByRole('button', { name: /Registrar abono/ }));
    const pay = (await screen.findByText('Registrar abono', { selector: 'h3' })).closest('form');
    await click(within(pay).getByRole('button', { name: 'Registrar abono' }));
    await waitForCall(a, 'POST', /^\/loans\/1\/payments$/);
    const receipt = (await screen.findByText('Recibo de abono')).closest('.fixed');
    expect(within(receipt).getByText(money(110500))).toBeInTheDocument();
    expect(within(receipt).getByText(/Saldo pendiente/)).toHaveTextContent(money(110000));
    const wa = within(receipt).getByRole('link', { name: 'Enviar por WhatsApp' });
    expect(wa.getAttribute('href')).toMatch(/wa\.me\/3001112233/);
    expect(within(detail).getByRole('button', { name: 'Recibo abono 50' })).toBeInTheDocument();
  });

  it('el COBRADOR no ve abono a capital, liquidar ni refinanciar', async () => {
    resetBehavior({ type: 'FINANCIERA', role: 'COBRADOR' });
    a = api();
    const detail = await openDetail('PR-000001');
    expect(within(detail).queryByRole('button', { name: 'Abono a capital' })).toBeNull();
    expect(within(detail).queryByRole('button', { name: 'Liquidar hoy' })).toBeNull();
    expect(within(detail).queryByRole('button', { name: 'Refinanciar' })).toBeNull();
    expect(within(detail).getByRole('button', { name: /Registrar abono/ })).toBeInTheDocument();
  });

  it('reportes: KPIs, colocación vs recaudo, mora por edades y comisión por cobrador', async () => {
    await renderPage(<ReportesPage />);
    const call = await waitForCall(a, 'GET', /^\/loans\/reports\/monthly$/);
    expect(call.query.months).toBe('6');
    expect(await screen.findByText('Cartera activa')).toBeInTheDocument();
    expect(screen.getByText('25.11%')).toBeInTheDocument();
    expect(screen.getByText('CARLOS COBRA')).toBeInTheDocument();
    expect(screen.getByText(money(11000))).toBeInTheDocument(); // comisión 5% de 220.000
    expect(screen.getByText('1 – 30 días')).toBeInTheDocument();
    const sel = screen.getByLabelText('Periodo');
    sel.value = '12';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    await settle();
    const again = await waitForCall(a, 'GET', /^\/loans\/reports\/monthly$/, { count: 2 });
    expect(again.query.months).toBe('12');
  });

  it('configuración: guarda recordatorios y alertas', async () => {
    await renderPage(<ProductosPage />);
    await screen.findByText('MICROCRÉDITO');
    await click(button('Configuración de préstamos'));
    await waitForCall(a, 'GET', /^\/loans\/settings$/);
    await screen.findByDisplayValue('3');
    await click(document.querySelector('input[name="alertsEnabled"]'));
    await click(button('Guardar configuración'));
    const call = await waitForCall(a, 'PATCH', /^\/loans\/settings$/);
    expect(call.body).toMatchObject({ remindersEnabled: true, reminderDaysBefore: 1, alertsEnabled: false });
  });
});
