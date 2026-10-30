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
import LayawayPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
vi.mock('@/utils/printInvoice', () => ({ printSaleInvoice: vi.fn(), printCustodyTicket: vi.fn() }));

const PLAN = {
  id: 1,
  code: 'PS-0001',
  customer: { id: 1, name: 'ANA PÉREZ', phone: '3001234567' },
  saleDate: '2026-02-01T15:00:00.000Z',
  itemsCount: 2,
  total: 100000,
  paid: 40000,
  saldo: 60000,
  items: [{ id: 1, name: 'CAMISETA BÁSICA', quantity: 2, price: 50000 }],
  payments: [{ id: 1, amount: 40000, method: 'EFECTIVO', paidAt: '2026-02-01T15:00:00.000Z' }],
};
const PLAN2 = { ...PLAN, id: 2, code: 'PS-0002', customer: { id: 2, name: 'LUIS GÓMEZ', phone: '3109876543' }, saldo: 20000, paid: 80000 };

function layawayApi() {
  return installApi([
    on('GET', /^\/sales\/layaway\/list$/, { success: true, data: [PLAN, PLAN2], summary: { active: 2, totalBalance: 80000 } }),
    on('POST', /^\/sales\/\d+\/payments$/, ok({ pagada: false })),
    on('POST', /^\/sales\/\d+\/complete-layaway$/, ok({ id: 1 })),
    on('POST', /^\/sales\/\d+\/cancel-layaway$/, ok({ id: 1 })),
    ...baseRoutes(),
  ]);
}

async function openPlan(api) {
  await renderPage(<LayawayPage />);
  await waitForCall(api, 'GET', /^\/sales\/layaway\/list$/);
  await click((await screen.findByText(/PS-0001/)).closest('button'));
  await screen.findByText(/Saldar todo/);
}

describe('Plan separe', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = layawayApi();
    window.confirm = vi.fn(() => true);
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista los planes activos con su saldo y el resumen', async () => {
    await renderPage(<LayawayPage />);
    await waitForCall(api, 'GET', /^\/sales\/layaway\/list$/);
    expect(await screen.findByText(/PS-0001/)).toBeInTheDocument();
    expect(screen.getByText(/PS-0002/)).toBeInTheDocument();
    expect(screen.getAllByText(money(80000)).length).toBeGreaterThan(0);
  });

  it('el buscador por cliente consulta el backend con el filtro', async () => {
    await renderPage(<LayawayPage />);
    await waitForCall(api, 'GET', /^\/sales\/layaway\/list$/);
    await typeInto(placeholder('Buscar por cliente o teléfono…'), 'ana');
    const call = await waitForCall(api, 'GET', /^\/sales\/layaway\/list$/, { count: 2 });
    expect(call.query.customer).toBe('ana');
  });

  it('abrir un plan muestra total, abonado, saldo, ítems y abonos; enlaza a editar', async () => {
    await openPlan(api);
    const modal = screen.getByText(/Saldar todo/).closest('.fixed');
    expect(within(modal).getAllByText(/PS-0001/).length).toBeGreaterThan(0);
    expect(within(modal).getAllByText(/Saldo/).length).toBeGreaterThan(0);
    expect(within(modal).getByText('CAMISETA BÁSICA')).toBeInTheDocument();
    expect(modal.querySelector('a[href="/dashboard/layaway/edit/1"]')).toBeTruthy();
    expect(button('Registrar abono')).toBeDisabled();
  });

  it('un abono parcial se registra con su método y deja el plan abierto', async () => {
    await openPlan(api);
    const modal = screen.getByText(/Saldar todo/).closest('.fixed');
    await typeInto(within(modal).getByPlaceholderText('0'), '20000');
    await click(within(modal).getByRole('button', { name: 'Transferencia' }));
    await click(button('Registrar abono'));
    const call = await waitForCall(api, 'POST', /^\/sales\/1\/payments$/);
    expect(call.body).toEqual({ amount: 20000, method: 'TRANSFERENCIA' });
    await waitForCall(api, 'GET', /^\/sales\/layaway\/list$/, { count: 2 });
    expect(screen.getByText(/Saldar todo/)).toBeInTheDocument();
  });

  it('"Saldar todo" cambia el botón a "Abonar y entregar" y al saldar se entrega', async () => {
    api.set('POST', /^\/sales\/\d+\/payments$/, ok({ pagada: true }));
    await openPlan(api);
    await click(screen.getByRole('button', { name: /Saldar todo/ }));
    const btn = screen.getByRole('button', { name: 'Abonar y entregar' });
    await click(btn);
    const call = await waitForCall(api, 'POST', /^\/sales\/1\/payments$/);
    expect(call.body).toEqual({ amount: 60000, method: 'EFECTIVO' });
    await expectToast('success', 'Saldado y entregado');
    await waitFor(() => expect(screen.queryByText(/Saldar todo/)).toBeNull());
  });

  it('"Entregar ahora" con saldo pide confirmación y fuerza la entrega', async () => {
    await openPlan(api);
    await click(screen.getByRole('button', { name: /Entregar ahora/ }));
    expect(window.confirm).toHaveBeenCalledTimes(1);
    const call = await waitForCall(api, 'POST', /^\/sales\/1\/complete-layaway$/);
    expect(call.body).toEqual({ force: true });
    await expectToast('success', 'Entregado');
  });

  it('si no se confirma la entrega, no se llama al backend', async () => {
    window.confirm = vi.fn(() => false);
    await openPlan(api);
    await click(screen.getByRole('button', { name: /Entregar ahora/ }));
    await settle();
    expect(api.count('POST', /complete-layaway/)).toBe(0);
  });

  it('"Anular" pide confirmación y cancela el plan sin tocar stock', async () => {
    await openPlan(api);
    await click(screen.getByRole('button', { name: /Anular/ }));
    expect(String(window.confirm.mock.calls[0][0])).toContain('PS-0001');
    await waitForCall(api, 'POST', /^\/sales\/1\/cancel-layaway$/);
    await waitForCall(api, 'GET', /^\/sales\/layaway\/list$/, { count: 2 });
  });

  it('un error del backend al abonar se avisa', async () => {
    api.set('POST', /^\/sales\/\d+\/payments$/, fail(400, 'Caja cerrada'));
    await openPlan(api);
    const modal = screen.getByText(/Saldar todo/).closest('.fixed');
    await typeInto(within(modal).getByPlaceholderText('0'), '1000');
    await click(button('Registrar abono'));
    await waitForCall(api, 'POST', /^\/sales\/1\/payments$/);
    await expectToast('error', 'Caja cerrada');
  });

  it('el barbero no entra a plan separe', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    layawayApi();
    await renderPage(<LayawayPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
