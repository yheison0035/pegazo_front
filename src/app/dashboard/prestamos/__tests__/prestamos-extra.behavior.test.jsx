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
import SimuladorPage from '../simulador/page';
import RutaPage from '../ruta/page';
import ProductosPage from '../productos/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const SETTINGS = { defaultInterestRate: 3, defaultMoraRate: null, graceDays: 0, defaultFrequency: 'MENSUAL', defaultAmortization: 'SIMPLE', rateConversion: 'PROPORCIONAL', roundTo: 1, requireApproval: false, excludeWeekdays: [], allocationOrder: ['MORA', 'INTERES', 'CAPITAL'], usuryRateMonthly: null, collectorCanRegisterPayments: true, requireCashForDisbursement: false, maxTerm: null, minAmount: null, maxAmount: null };
const ROUTE_LOAN = {
  id: 100, code: 'PR-000100', status: 'DESEMBOLSADO', principal: 300000, interestRate: 10, moraRate: 3, graceDays: 0, frequency: 'DIARIA', amortization: 'SIMPLE', termCount: 30, totalInterest: 30000, totalAmount: 330000,
  customer: { id: 1, name: 'ANA PÉREZ', phone: '3001112233', address: 'Calle 1 # 2-3', city: 'Cali' }, collectorId: 7,
  installments: [{ id: 1, number: 1, dueDate: '2026-02-10', capital: 10000, interest: 1000, total: 11000, capitalPaid: 0, interestPaid: 0, moraPaid: 0, pendingCapital: 10000, pendingInterest: 1000, moraAccrued: 0, pendingTotal: 11000, status: 'PENDIENTE', daysLate: 0 }],
  summary: { pendingCapital: 300000, pendingInterest: 30000, moraAccrued: 0, pendingTotal: 330000, paidTotal: 0, overdueAmount: 0, overdueDays: 0, overdueInstallments: 0, nextDueDate: '2026-02-10', nextInstallmentAmount: 11000, progressPercent: 0, status: 'AL_DIA' },
};

const common = () => [
  on('GET', /^\/loans\/settings$/, { success: true, data: SETTINGS }),
  on('GET', /^\/loans\/products$/, { success: true, data: [] }),
  on('POST', /^\/loans\/simulate$/, { success: true, data: { terms: { interestRate: 3, rateSource: 'COMPANY', frequency: 'MENSUAL', amortization: 'SIMPLE' }, warnings: [{ code: 'USURY', message: 'La tasa supera la de referencia.' }], availableCredit: null } }),
  on('GET', /^\/users$/, list([{ id: 7, name: 'CARLOS COBRA', role: 'COBRADOR', status: 'ACTIVO' }])),
  ...baseRoutes(),
];

describe('Simulador de crédito', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'FINANCIERA' });
    api = installApi(common());
  });
  afterEach(() => vi.restoreAllMocks());

  it('calcula al instante con la tasa de la empresa y consulta avisos al backend', async () => {
    await renderPage(<SimuladorPage />);
    await waitForCall(api, 'GET', /^\/loans\/settings$/);
    // Por defecto 1.000.000 a 12 cuotas al 3% mensual SIMPLE → intereses 360.000, cuota 113.333.
    expect((await screen.findAllByText(money(360000))).length).toBeGreaterThan(0);
    expect(screen.getAllByText(money(113333)).length).toBeGreaterThan(0);
    const sim = await waitForCall(api, 'POST', /^\/loans\/simulate$/);
    expect(sim.body).toMatchObject({ principal: 1000000, termCount: 12 });
    expect(await screen.findByText('La tasa supera la de referencia.')).toBeInTheDocument();
  });

  it('al cambiar capital, cuotas y tasa recalcula (motor local)', async () => {
    await renderPage(<SimuladorPage />);
    await waitForCall(api, 'GET', /^\/loans\/settings$/);
    await typeInto(document.querySelector('input[name="principal"]'), '1000000');
    await typeInto(document.querySelector('input[name="termCount"]'), '10');
    await typeInto(document.querySelector('input[name="interestRate"]'), '10');
    await settle();
    // 1.000.000 al 10% × 10 → cuota 200.000, intereses 1.000.000, total 2.000.000.
    expect(screen.getAllByText(money(200000)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(money(2000000)).length).toBeGreaterThan(0);
  });
});

describe('Ruta de cobro (COBRADOR)', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'FINANCIERA', role: 'COBRADOR' });
    api = installApi([
      on('GET', /^\/loans\/collector\/route$/, { success: true, data: { date: '2026-02-10', collectorId: 7, dueToday: [ROUTE_LOAN], overdue: [], upcoming: [], totals: { loans: 1, toCollectToday: 11000, overdueAmount: 0, collectedToday: 0, collectedCashToday: 0, collectedCount: 0, portfolio: 330000 } } }),
      on('POST', /^\/loans\/100\/payments$/, { success: true, data: { payment: { id: 1, amount: 11000 }, settled: false, loan: ROUTE_LOAN } }),
      ...common(),
    ]);
  });
  afterEach(() => vi.restoreAllMocks());

  it('muestra las cuotas de hoy de SU cartera y registra el abono en un toque', async () => {
    await renderPage(<RutaPage />);
    const call = await waitForCall(api, 'GET', /^\/loans\/collector\/route$/);
    expect(call.query.collectorId).toBeUndefined(); // el cobrador no elige cobrador
    expect(await screen.findByText('ANA PÉREZ')).toBeInTheDocument();
    expect(screen.getByText('Vencen hoy · 1')).toBeInTheDocument();
    expect(screen.getAllByText(money(11000)).length).toBeGreaterThan(0);
    await click(screen.getByRole('button', { name: 'Abonar PR-000100' }));
    const pay = (await screen.findByText('Registrar abono', { selector: 'h3' })).closest('form');
    await click(within(pay).getByRole('button', { name: 'Registrar abono' }));
    const post = await waitForCall(api, 'POST', /^\/loans\/100\/payments$/);
    expect(post.body).toMatchObject({ amount: 11000, method: 'EFECTIVO' });
    await expectToast('success', 'Abono registrado');
  });
});

describe('Productos de crédito y configuración', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'FINANCIERA' });
    api = installApi([
      on('GET', /^\/loans\/products$/, { success: true, data: [{ id: 3, name: 'MICROCRÉDITO', interestRate: 4, moraRate: null, graceDays: 0, frequency: 'QUINCENAL', amortization: 'SIMPLE', roundTo: 1, status: 'ACTIVO' }] }),
      on('POST', /^\/loans\/products$/, ok({ id: 4 })),
      on('DELETE', /^\/loans\/products\/\d+$/, ok()),
      on('PATCH', /^\/loans\/settings$/, ok(SETTINGS)),
      ...common(),
    ]);
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista los productos y crea uno nuevo con tasa y frecuencia', async () => {
    await renderPage(<ProductosPage />);
    await waitForCall(api, 'GET', /^\/loans\/products$/);
    expect(await screen.findByText('MICROCRÉDITO')).toBeInTheDocument();
    expect(screen.getByText('4% mensual')).toBeInTheDocument();
    await click(button('Nuevo producto'));
    const modal = (await screen.findByPlaceholderText('Ej: Microcrédito, Paga diario, Cliente VIP')).closest('.fixed');
    await typeInto(within(modal).getByPlaceholderText('Ej: Microcrédito, Paga diario, Cliente VIP'), 'Paga diario');
    await typeInto(modal.querySelector('input[name="interestRate"]'), '20');
    const freq = modal.querySelector('select[name="frequency"]');
    freq.value = 'DIARIA';
    freq.dispatchEvent(new Event('change', { bubbles: true }));
    await click(within(modal).getByRole('button', { name: 'Crear' }));
    const call = await waitForCall(api, 'POST', /^\/loans\/products$/);
    expect(call.body).toMatchObject({ name: 'Paga diario', interestRate: 20, frequency: 'DIARIA', amortization: 'SIMPLE' });
    await expectToast('success', 'Producto de crédito creado');
    await waitForCall(api, 'GET', /^\/loans\/products$/, { count: 2 });
  });

  it('elimina un producto con confirmación', async () => {
    await renderPage(<ProductosPage />);
    await screen.findByText('MICROCRÉDITO');
    await click(screen.getByRole('button', { name: 'Eliminar MICROCRÉDITO' }));
    await click(await screen.findByRole('button', { name: 'Confirmar' }));
    await waitForCall(api, 'DELETE', /^\/loans\/products\/3$/);
    await expectToast('success', 'Producto eliminado');
  });

  it('guarda la configuración de préstamos (tasa por defecto y aprobación)', async () => {
    await renderPage(<ProductosPage />);
    await screen.findByText('MICROCRÉDITO');
    await click(button('Configuración de préstamos'));
    await waitForCall(api, 'GET', /^\/loans\/settings$/);
    const rate = await screen.findByDisplayValue('3');
    await typeInto(rate, '5');
    const approval = document.querySelector('input[name="requireApproval"]');
    await click(approval);
    await click(button('Guardar configuración'));
    const call = await waitForCall(api, 'PATCH', /^\/loans\/settings$/);
    expect(call.body).toMatchObject({ defaultInterestRate: 5, requireApproval: true, defaultFrequency: 'MENSUAL' });
    await expectToast('success', 'Configuración de préstamos guardada');
  });
});
