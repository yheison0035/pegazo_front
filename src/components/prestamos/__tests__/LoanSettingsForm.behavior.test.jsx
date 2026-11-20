import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { installApi, on, ok, resetBehavior, renderPage, screen, click, typeInto, button, waitForCall, expectToast } from '@/test/behaviorHarness';
import LoanSettingsForm from '../LoanSettingsForm';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());

const SETTINGS = { defaultInterestRate: 3, defaultMoraRate: null, graceDays: 0, defaultFrequency: 'MENSUAL', defaultAmortization: 'SIMPLE', rateConversion: 'PROPORCIONAL', roundTo: 1, requireApproval: false, excludeWeekdays: [], allocationOrder: ['MORA', 'INTERES', 'CAPITAL'], usuryRateMonthly: null, collectorCanRegisterPayments: true, requireCashForDisbursement: false, maxTerm: null, minAmount: null, maxAmount: null, remindersEnabled: true, reminderDaysBefore: 1, alertsEnabled: true };

// La configuración de préstamos vive en Configuración → "Préstamos y cobranza".
describe('Configuración de préstamos (Configuración → Préstamos y cobranza)', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'FINANCIERA' });
    api = installApi([
      on('GET', /^\/loans\/settings$/, { success: true, data: SETTINGS }),
      on('PATCH', /^\/loans\/settings$/, ok(SETTINGS)),
    ]);
  });
  afterEach(() => vi.restoreAllMocks());

  it('guarda tasa por defecto, aprobación obligatoria y días sin cobro', async () => {
    await renderPage(<LoanSettingsForm />);
    await waitForCall(api, 'GET', /^\/loans\/settings$/);
    const rate = await screen.findByDisplayValue('3');
    await typeInto(rate, '5');
    await click(document.querySelector('input[name="requireApproval"]'));
    await click(screen.getByRole('button', { name: 'Dom' }));
    await click(button('Guardar configuración'));
    const call = await waitForCall(api, 'PATCH', /^\/loans\/settings$/);
    expect(call.body).toMatchObject({ defaultInterestRate: 5, requireApproval: true, defaultFrequency: 'MENSUAL', excludeWeekdays: [0] });
    await expectToast('success', 'Configuración de préstamos guardada');
  });

  it('guarda recordatorios al cliente y alertas al equipo', async () => {
    await renderPage(<LoanSettingsForm />);
    await screen.findByDisplayValue('3');
    await click(document.querySelector('input[name="alertsEnabled"]'));
    await typeInto(document.querySelector('input[name="reminderDaysBefore"]'), '3');
    await click(button('Guardar configuración'));
    const call = await waitForCall(api, 'PATCH', /^\/loans\/settings$/);
    expect(call.body).toMatchObject({ remindersEnabled: true, reminderDaysBefore: 3, alertsEnabled: false });
  });
});
