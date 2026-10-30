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
} from '@/test/behaviorHarness';
import PlanCuentasPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
vi.mock('@/lib/accounting/xlsxIO', () => ({ downloadWorkbook: vi.fn(), readAllSheets: vi.fn(), readSheetRows: vi.fn() }));
const csvMock = vi.hoisted(() => ({ downloadCsv: vi.fn() }));
vi.mock('@/utils/exportCsv', () => csvMock);

const ACCOUNTS = [
  { id: 1, code: '1105', name: 'CAJA', type: 'ASSET', nature: 'DEBIT', isBase: true, active: true },
  { id: 2, code: '4135', name: 'COMERCIO AL POR MAYOR Y AL POR MENOR', type: 'INCOME', nature: 'CREDIT', isBase: true, active: true },
  { id: 3, code: '519530', name: 'PUBLICIDAD DIGITAL', type: 'EXPENSE', nature: 'DEBIT', isBase: false, active: true },
];

function accountsApi() {
  return installApi([
    on('GET', /^\/ledger-accounts$/, ok(ACCOUNTS)),
    on('POST', /^\/ledger-accounts$/, ok({ id: 9 })),
    on('PATCH', /^\/ledger-accounts\/\d+$/, ok({ id: 3 })),
    on('DELETE', /^\/ledger-accounts\/\d+$/, ok()),
    on('POST', /^\/ledger-accounts\/import$/, ok({ total: 1, created: 1, updated: 0, errors: [] })),
    ...baseRoutes(),
  ]);
}

describe('Plan de cuentas (PUC)', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = accountsApi();
    csvMock.downloadCsv.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista las cuentas agrupadas por tipo; las cuentas base se editan pero no se eliminan', async () => {
    await renderPage(<PlanCuentasPage />);
    await waitForCall(api, 'GET', /^\/ledger-accounts$/);
    expect(await screen.findByText('CAJA')).toBeInTheDocument();
    expect(screen.getByText('PUBLICIDAD DIGITAL')).toBeInTheDocument();
    const base = screen.getByText('CAJA').closest('tr');
    expect(within(base).getByLabelText('Editar')).toBeInTheDocument();
    expect(within(base).queryByLabelText('Eliminar')).toBeNull();
    const own = screen.getByText('PUBLICIDAD DIGITAL').closest('tr');
    expect(within(own).getByLabelText('Editar')).toBeInTheDocument();
    expect(within(own).getByLabelText('Eliminar')).toBeInTheDocument();
  });

  it('crea una cuenta propia con código, nombre en mayúsculas, tipo y naturaleza', async () => {
    await renderPage(<PlanCuentasPage />);
    await screen.findByText('CAJA');
    await click(button('Nueva cuenta'));
    const code = await screen.findByPlaceholderText('Ej: 4135');
    const modal = code.closest('.fixed');
    await click(within(modal).getByRole('button', { name: 'Guardar' }));
    await expectToast('error', 'Completa código y nombre');
    await typeInto(code, '523540');
    await typeInto(within(modal).getByPlaceholderText('Ej: INGRESOS POR VENTAS'), 'Arriendo local');
    // Orden en el modal: naturaleza y luego tipo.
    const selects = within(modal).getAllByRole('combobox');
    await typeInto(selects[0], 'DEBIT');
    await typeInto(selects[1], 'EXPENSE');
    await click(within(modal).getByRole('button', { name: 'Guardar' }));
    const call = await waitForCall(api, 'POST', /^\/ledger-accounts$/);
    expect(call.body).toEqual({ code: '523540', name: 'ARRIENDO LOCAL', type: 'EXPENSE', nature: 'DEBIT' });
    await waitForCall(api, 'GET', /^\/ledger-accounts$/, { count: 2 });
  });

  it('edita una cuenta propia y guarda con PATCH', async () => {
    await renderPage(<PlanCuentasPage />);
    await screen.findByText('PUBLICIDAD DIGITAL');
    const own = screen.getByText('PUBLICIDAD DIGITAL').closest('tr');
    await click(within(own).getByLabelText('Editar'));
    const name = await screen.findByPlaceholderText('Ej: INGRESOS POR VENTAS');
    expect(name.value).toBe('PUBLICIDAD DIGITAL');
    await typeInto(name, 'Publicidad en redes');
    const modal = name.closest('.fixed');
    await click(within(modal).getByRole('button', { name: 'Guardar' }));
    const call = await waitForCall(api, 'PATCH', /^\/ledger-accounts\/3$/);
    expect(call.body).toEqual({ code: '519530', name: 'PUBLICIDAD EN REDES', type: 'EXPENSE', nature: 'DEBIT' });
  });

  it('eliminar pide confirmación y llama DELETE; si falla, avisa', async () => {
    await renderPage(<PlanCuentasPage />);
    await screen.findByText('PUBLICIDAD DIGITAL');
    const own = screen.getByText('PUBLICIDAD DIGITAL').closest('tr');
    await click(within(own).getByLabelText('Eliminar'));
    let confirm = (await screen.findByText('Eliminar cuenta')).closest('.fixed');
    await click(within(confirm).getByRole('button', { name: 'Eliminar' }));
    await waitForCall(api, 'DELETE', /^\/ledger-accounts\/3$/);

    api.set('DELETE', /^\/ledger-accounts\/\d+$/, fail(400, 'La cuenta tiene movimientos'));
    await click(within(screen.getByText('PUBLICIDAD DIGITAL').closest('tr')).getByLabelText('Eliminar'));
    confirm = (await screen.findByText('Eliminar cuenta')).closest('.fixed');
    await click(within(confirm).getByRole('button', { name: 'Eliminar' }));
    await expectToast('error', 'tiene movimientos');
  });

  it('exporta el plan a CSV', async () => {
    await renderPage(<PlanCuentasPage />);
    await screen.findByText('CAJA');
    await click(screen.getByRole('button', { name: /Exportar/ }));
    await waitFor(() => expect(csvMock.downloadCsv).toHaveBeenCalledTimes(1));
    expect(csvMock.downloadCsv.mock.calls[0][1].length).toBe(3);
  });

  it('el contador entra; la caja no', async () => {
    resetBehavior({ role: 'CONTADOR' });
    api = accountsApi();
    await renderPage(<PlanCuentasPage />);
    expect(await screen.findByText('CAJA')).toBeInTheDocument();
    vi.restoreAllMocks();
    resetBehavior({ role: 'CAJA' });
    accountsApi();
    await renderPage(<PlanCuentasPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
