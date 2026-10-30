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
import AssetsPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
vi.mock('@/lib/accounting/xlsxIO', () => ({ downloadWorkbook: vi.fn(), readAllSheets: vi.fn(), readSheetRows: vi.fn() }));
const csvMock = vi.hoisted(() => ({ downloadCsv: vi.fn() }));
vi.mock('@/utils/exportCsv', () => csvMock);

const ASSETS = [
  { id: 1, name: 'COMPUTADOR MOSTRADOR', category: 'Equipos de cómputo', reference: 'PC-01', acquisitionDate: '2025-06-01T00:00:00.000Z', quantity: 1, unitCost: 2400000, cost: 2400000, salvageValue: 0, usefulLifeMonths: 60, accumulatedDepreciation: 320000, bookValue: 2080000, status: 'ACTIVE', notes: '' },
  { id: 2, name: 'VITRINA', category: 'Muebles', reference: '', acquisitionDate: '2024-01-15T00:00:00.000Z', quantity: 2, unitCost: 600000, cost: 1200000, salvageValue: 0, usefulLifeMonths: 120, accumulatedDepreciation: 240000, bookValue: 960000, status: 'ACTIVE', notes: '' },
];
const SUMMARY = { count: 2, activeCount: 2, totalCost: 3600000, totalAccumulated: 560000, totalBookValue: 3040000, monthlyDepreciation: 50000 };

function assetsApi() {
  return installApi([
    on('GET', /^\/assets$/, { success: true, data: ASSETS, summary: SUMMARY }),
    on('POST', /^\/assets$/, ok({ id: 9 })),
    on('PATCH', /^\/assets\/\d+\/dispose$/, ok({ id: 1 })),
    on('PATCH', /^\/assets\/\d+$/, ok({ id: 1 })),
    on('DELETE', /^\/assets\/\d+$/, ok()),
    on('POST', /^\/assets\/import$/, ok({ total: 1, created: 1, updated: 0, errors: [] })),
    ...baseRoutes(),
  ]);
}

describe('Activos fijos', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = assetsApi();
    csvMock.downloadCsv.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista los activos con costo, depreciación y valor en libros', async () => {
    await renderPage(<AssetsPage />);
    await waitForCall(api, 'GET', /^\/assets$/);
    expect(await screen.findByText('COMPUTADOR MOSTRADOR')).toBeInTheDocument();
    expect(screen.getByText('VITRINA')).toBeInTheDocument();
    expect(screen.getAllByText(money(2080000)).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Exportar/ })).toBeInTheDocument();
    expect(screen.getByText('Importar Excel')).toBeInTheDocument();
  });

  it('crea un activo con fecha de compra, cantidad, costo unitario y vida útil', async () => {
    await renderPage(<AssetsPage />);
    await screen.findByText('COMPUTADOR MOSTRADOR');
    await click(button('Nuevo activo'));
    const name = await screen.findByPlaceholderText('Ej: Computador mostrador, Vitrina, Moto de domicilios');
    const modal = name.closest('.fixed');
    await click(within(modal).getByRole('button', { name: 'Guardar' }));
    await expectToast('error', 'Completa nombre, fecha de compra y valor unitario');
    await typeInto(name, 'Moto de domicilios');
    await typeInto(modal.querySelector('input[type="date"]'), '2026-02-01');
    await typeInto(within(modal).getByPlaceholderText('1'), '1');
    await typeInto(within(modal).getByPlaceholderText('$ por unidad'), '8500000');
    await typeInto(within(modal).getByPlaceholderText('Ej: 60 (vacío = no se deprecia)'), '60');
    await typeInto(within(modal).getByPlaceholderText('$ 0 (valor residual estimado)'), '500000');
    await click(within(modal).getByRole('button', { name: 'Guardar' }));
    const call = await waitForCall(api, 'POST', /^\/assets$/);
    expect(call.body).toEqual({
      name: 'MOTO DE DOMICILIOS',
      category: null,
      reference: null,
      acquisitionDate: '2026-02-01',
      quantity: 1,
      unitCost: 8500000,
      salvageValue: 500000,
      usefulLifeMonths: 60,
      notes: null,
    });
    await waitForCall(api, 'GET', /^\/assets$/, { count: 2 });
  });

  it('editar precarga el activo y guarda con PATCH', async () => {
    await renderPage(<AssetsPage />);
    await screen.findByText('COMPUTADOR MOSTRADOR');
    await click(screen.getAllByLabelText('Editar')[0]);
    const name = await screen.findByPlaceholderText('Ej: Computador mostrador, Vitrina, Moto de domicilios');
    expect(name.value).toBe('COMPUTADOR MOSTRADOR');
    const modal = name.closest('.fixed');
    await typeInto(within(modal).getByPlaceholderText('Ej: 60 (vacío = no se deprecia)'), '48');
    await click(within(modal).getByRole('button', { name: 'Guardar' }));
    const call = await waitForCall(api, 'PATCH', /^\/assets\/1$/);
    expect(call.body).toMatchObject({ name: 'COMPUTADOR MOSTRADOR', usefulLifeMonths: 48, unitCost: 2400000, reference: 'PC-01' });
  });

  it('dar de baja o vender registra la fecha y el valor de venta', async () => {
    await renderPage(<AssetsPage />);
    await screen.findByText('COMPUTADOR MOSTRADOR');
    await click(screen.getAllByLabelText('Dar de baja / vender')[0]);
    const modal = (await screen.findByText('Dar de baja o vender')).closest('.fixed');
    await typeInto(modal.querySelector('input[type="date"]'), '2026-03-01');
    await typeInto(within(modal).getByPlaceholderText('Vacío = baja sin venta'), '1500000');
    await click(within(modal).getByRole('button', { name: 'Registrar' }));
    const call = await waitForCall(api, 'PATCH', /^\/assets\/1\/dispose$/);
    expect(call.body).toEqual({ disposalDate: '2026-03-01', disposalValue: 1500000 });
    await waitForCall(api, 'GET', /^\/assets$/, { count: 2 });
  });

  it('eliminar pide confirmación y llama DELETE; un error se avisa', async () => {
    await renderPage(<AssetsPage />);
    await screen.findByText('COMPUTADOR MOSTRADOR');
    await click(screen.getAllByLabelText('Eliminar')[1]);
    let confirm = (await screen.findByText('Eliminar activo')).closest('.fixed');
    await click(within(confirm).getByRole('button', { name: 'Eliminar' }));
    await waitForCall(api, 'DELETE', /^\/assets\/2$/);

    api.set('DELETE', /^\/assets\/\d+$/, fail(400, 'El activo tiene asientos registrados'));
    await click(screen.getAllByLabelText('Eliminar')[0]);
    confirm = (await screen.findByText('Eliminar activo')).closest('.fixed');
    await click(within(confirm).getByRole('button', { name: 'Eliminar' }));
    await expectToast('error', 'asientos registrados');
  });

  it('exportar descarga el CSV con los activos', async () => {
    await renderPage(<AssetsPage />);
    await screen.findByText('COMPUTADOR MOSTRADOR');
    await click(screen.getByRole('button', { name: /Exportar/ }));
    await waitFor(() => expect(csvMock.downloadCsv).toHaveBeenCalledTimes(1));
    expect(csvMock.downloadCsv.mock.calls[0][0]).toBe('activos-fijos.csv');
    expect(csvMock.downloadCsv.mock.calls[0][1].length).toBe(2);
  });

  it('el contador entra; la caja no', async () => {
    resetBehavior({ role: 'CONTADOR' });
    api = assetsApi();
    await renderPage(<AssetsPage />);
    expect(await screen.findByText('COMPUTADOR MOSTRADOR')).toBeInTheDocument();
    vi.restoreAllMocks();
    resetBehavior({ role: 'CAJA' });
    assetsApi();
    await renderPage(<AssetsPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
