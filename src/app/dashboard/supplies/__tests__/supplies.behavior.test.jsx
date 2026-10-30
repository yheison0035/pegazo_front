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
  waitForCall,
  expectToast,
} from '@/test/behaviorHarness';
import SuppliesPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const SUPPLIES = [
  { id: 1, name: 'CARNE MOLIDA', unit: 'KG', stock: 12, minStock: 5, cost: 18000, providerId: 7, provider: { id: 7, name: 'Proveedor Uno' }, localId: 1, local: { id: 1, name: 'Sede Centro' } },
  { id: 2, name: 'PAN HAMBURGUESA', unit: 'UNIDAD', stock: 3, minStock: 20, cost: 500, providerId: null, provider: null, localId: 1, local: { id: 1, name: 'Sede Centro' } },
];

function suppliesApi() {
  return installApi([
    on('GET', /^\/supplies$/, ok(SUPPLIES)),
    on('POST', /^\/supplies$/, ok({ id: 9 })),
    on('PUT', /^\/supplies\/\d+$/, ok({ id: 1 })),
    on('DELETE', /^\/supplies\/\d+$/, ok()),
    on('POST', /^\/supplies\/\d+\/adjust$/, ok({ id: 1, stock: 20 })),
    ...baseRoutes(),
  ]);
}

const modalOf = (text) => screen.getByText(text).closest('.fixed');

describe('Insumos', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'RESTAURANTE' });
    api = suppliesApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista los insumos con existencias, costo y proveedor', async () => {
    await renderPage(<SuppliesPage />);
    await waitForCall(api, 'GET', /^\/supplies$/);
    expect(await screen.findByText('CARNE MOLIDA')).toBeInTheDocument();
    expect(screen.getByText('PAN HAMBURGUESA')).toBeInTheDocument();
    expect(screen.getByText('Proveedor Uno')).toBeInTheDocument();
  });

  it('crea un insumo con unidad, existencia inicial, mínimo, costo, proveedor y sede', async () => {
    await renderPage(<SuppliesPage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await waitForCall(api, 'GET', /^\/providers$/);
    await settle();
    await click(button(/Nuevo insumo|Agregar/));
    const name = await screen.findByPlaceholderText('Ej: Carne molida');
    const modal = name.closest('.fixed');
    await typeInto(name, 'Queso mozzarella');
    const selects = within(modal).getAllByRole('combobox');
    await typeInto(selects[0], 'KG');
    await typeInto(within(modal).getByPlaceholderText('0'), '8');
    await typeInto(within(modal).getByPlaceholderText('—'), '2');
    await typeInto(within(modal).getByPlaceholderText('$ —'), '25000');
    const provider = selects.find((s) => [...s.options].some((o) => o.text === 'Proveedor Uno'));
    await typeInto(provider, '7');
    const local = selects.find((s) => [...s.options].some((o) => o.text === 'Sede Norte'));
    await typeInto(local, '2');
    await click(within(modal).getByRole('button', { name: 'Guardar' }));
    const call = await waitForCall(api, 'POST', /^\/supplies$/);
    expect(call.body).toEqual({ name: 'QUESO MOZZARELLA', unit: 'KG', minStock: 2, cost: 25000, providerId: 7, stock: 8, localId: 2 });
    await expectToast('success', 'Insumo guardado');
    await waitForCall(api, 'GET', /^\/supplies$/, { count: 2 });
  });

  it('sin nombre no guarda y avisa', async () => {
    await renderPage(<SuppliesPage />);
    await screen.findByText('CARNE MOLIDA');
    await click(button(/Nuevo insumo|Agregar/));
    const modal = (await screen.findByPlaceholderText('Ej: Carne molida')).closest('.fixed');
    await click(within(modal).getByRole('button', { name: 'Guardar' }));
    await expectToast('warning', 'Ponle un nombre');
    expect(api.count('POST', /^\/supplies$/)).toBe(0);
  });

  it('editar precarga el insumo y guarda con PUT sin tocar la existencia', async () => {
    await renderPage(<SuppliesPage />);
    await screen.findByText('CARNE MOLIDA');
    await click(screen.getAllByTitle('Editar')[0]);
    const name = await screen.findByPlaceholderText('Ej: Carne molida');
    expect(name.value).toBe('CARNE MOLIDA');
    const modal = name.closest('.fixed');
    await typeInto(within(modal).getByPlaceholderText('—'), '6');
    await click(within(modal).getByRole('button', { name: 'Guardar' }));
    const call = await waitForCall(api, 'PUT', /^\/supplies\/1$/);
    expect(call.body).toEqual({ name: 'CARNE MOLIDA', unit: 'KG', minStock: 6, cost: 18000, providerId: 7 });
    expect('stock' in call.body).toBe(false);
  });

  it('ajusta la existencia: entrada, salida o fijar, con motivo', async () => {
    await renderPage(<SuppliesPage />);
    await screen.findByText('CARNE MOLIDA');
    await click(screen.getAllByTitle('Ajustar existencia')[0]);
    const qty = await screen.findByPlaceholderText('0');
    const modal = qty.closest('.fixed');
    await typeInto(within(modal).getByRole('combobox'), 'SALIDA');
    await typeInto(qty, '3');
    await typeInto(within(modal).getByPlaceholderText('Ej: compra, consumo del día, merma'), 'consumo del día');
    await click(within(modal).getByRole('button', { name: 'Aplicar' }));
    const call = await waitForCall(api, 'POST', /^\/supplies\/1\/adjust$/);
    expect(call.body).toEqual({ type: 'SALIDA', quantity: 3, reason: 'consumo del día' });
    await expectToast('success', 'Existencia actualizada');
    await waitForCall(api, 'GET', /^\/supplies$/, { count: 2 });
  });

  it('una cantidad inválida en el ajuste no se envía', async () => {
    await renderPage(<SuppliesPage />);
    await screen.findByText('CARNE MOLIDA');
    await click(screen.getAllByTitle('Ajustar existencia')[0]);
    const qty = await screen.findByPlaceholderText('0');
    const modal = qty.closest('.fixed');
    await click(within(modal).getByRole('button', { name: 'Aplicar' }));
    await expectToast('warning', 'Cantidad no válida');
    expect(api.count('POST', /adjust/)).toBe(0);
  });

  it('eliminar pide confirmación y llama DELETE; si falla, avisa', async () => {
    await renderPage(<SuppliesPage />);
    await screen.findByText('CARNE MOLIDA');
    await click(screen.getAllByTitle('Eliminar')[1]);
    let confirm = screen.getByText('¿Eliminar insumo?').closest('.fixed');
    await click(within(confirm).getByRole('button', { name: 'Eliminar' }));
    await waitForCall(api, 'DELETE', /^\/supplies\/2$/);

    api.set('DELETE', /^\/supplies\/\d+$/, fail(400, 'El insumo se usa en recetas'));
    await click(screen.getAllByTitle('Eliminar')[0]);
    confirm = screen.getByText('¿Eliminar insumo?').closest('.fixed');
    await click(within(confirm).getByRole('button', { name: 'Eliminar' }));
    await expectToast('error', 'se usa en recetas');
  });
});
