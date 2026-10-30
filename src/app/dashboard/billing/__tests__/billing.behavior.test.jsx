import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi,
  on,
  ok,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  waitFor,
  click,
  button,
  waitForCall,
  router,
  money,
} from '@/test/behaviorHarness';
import BillingPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const SUB = {
  plan: 'ORBITA',
  billingMode: 'MENSUAL',
  monthlyPrice: 149000,
  startDate: '2025-10-01T00:00:00.000Z',
  paidUntil: '2026-03-01T00:00:00.000Z',
  daysLeft: 20,
  overdue: false,
  totalMonths: 5,
  totalPaid: 745000,
  count: 5,
  payments: [
    { id: 1, paidAt: '2026-02-01T10:00:00.000Z', months: 1, periodFrom: '2026-02-01', periodTo: '2026-03-01', amount: 149000, method: 'TRANSFERENCIA', note: 'Febrero' },
  ],
};
const PAY_SETTINGS = { bankName: 'Bancolombia', accountType: 'Ahorros', accountNumber: '123-456789-00', accountHolder: 'PEGAZO SAS', whatsappNumber: '3001112233' };

function billingApi(sub = SUB) {
  return installApi([
    on('GET', /^\/company\/subscription$/, ok(sub)),
    on('GET', /^\/platform-payment\/settings$/, ok(PAY_SETTINGS)),
    ...baseRoutes(),
  ]);
}

describe('Mi suscripción (facturación)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('muestra el estado de la suscripción y el historial de pagos', async () => {
    resetBehavior();
    const api = billingApi();
    await renderPage(<BillingPage />);
    await waitForCall(api, 'GET', /^\/company\/subscription$/);
    expect(await screen.findByText(/Al día · 20 días/)).toBeInTheDocument();
    expect(screen.getAllByText(money(149000)).length).toBeGreaterThan(0);
    expect(screen.getByText('Febrero')).toBeInTheDocument();
    expect(screen.getByText('Transferencia')).toBeInTheDocument();
  });

  it('avisa cuando está por vencer o vencida', async () => {
    resetBehavior();
    billingApi({ ...SUB, daysLeft: 3 });
    await renderPage(<BillingPage />);
    expect(await screen.findByText(/Vence en 3 días/)).toBeInTheDocument();
    vi.restoreAllMocks();

    resetBehavior();
    billingApi({ ...SUB, daysLeft: -4, overdue: true });
    await renderPage(<BillingPage />);
    expect(await screen.findByText(/Vencida hace 4 días/)).toBeInTheDocument();
  });

  it('"Cómo pagar" abre las instrucciones con la cuenta y el WhatsApp de la plataforma', async () => {
    resetBehavior();
    const api = billingApi();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
    await renderPage(<BillingPage />);
    await screen.findByText(/Al día/);
    await click(button(/Cómo pagar/));
    await waitForCall(api, 'GET', /^\/platform-payment\/settings$/);
    expect(await screen.findByText(/123-456789-00/)).toBeInTheDocument();
    expect(screen.getByText(/PEGAZO SAS/)).toBeInTheDocument();
    const wa = document.querySelector('a[href*="wa.me/573001112233"]');
    expect(wa).toBeTruthy();
  });

  it('solo dueño y administrador ven la facturación', async () => {
    resetBehavior({ role: 'CAJA' });
    billingApi();
    await renderPage(<BillingPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
