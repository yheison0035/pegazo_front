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
import ParkingPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
const printMock = vi.hoisted(() => ({ printParkingTicket: vi.fn() }));
vi.mock('@/utils/printParkingTicket', () => printMock);
const invoiceMock = vi.hoisted(() => ({ printSaleInvoice: vi.fn(), printCustodyTicket: vi.fn() }));
vi.mock('@/utils/printInvoice', () => invoiceMock);

const TYPES = [
  { id: 1, name: 'Carro', hourRate: 4000, dayMax: 25000, monthRate: 180000, capacity: 20 },
  { id: 2, name: 'Moto', hourRate: 2000, dayMax: 12000, monthRate: 90000, capacity: 30 },
];
const TICKETS = [
  { id: 10, code: 'PK-0010', plate: 'ABC123', vehicleTypeId: 1, vehicleTypeName: 'Carro', isMonthly: false, customerName: 'ANA PÉREZ', checkInAt: new Date(Date.now() - 90 * 60000).toISOString(), quote: { amount: 8000 } },
  { id: 11, code: 'PK-0011', plate: 'XYZ789', vehicleTypeId: 2, vehicleTypeName: 'Moto', isMonthly: true, customerName: '', checkInAt: new Date(Date.now() - 30 * 60000).toISOString(), quote: { amount: 0 } },
];

function parkingApi() {
  return installApi([
    on('GET', /^\/parking$/, { success: true, data: TICKETS, settings: { graceMinutes: 10 }, summary: { inside: 2, byType: { Carro: 1, Moto: 1 } } }),
    on('GET', /^\/parking\/types$/, ok(TYPES)),
    on('GET', /^\/parking\/settings$/, ok({ graceMinutes: 10 })),
    on('POST', /^\/parking\/checkin$/, ok({ id: 12, code: 'PK-0012', plate: 'NEW001' })),
    on('POST', /^\/parking\/\d+\/checkout$/, ok({ sale: { id: 77, code: 'FV-0077' } })),
    on('POST', /^\/parking\/\d+\/cancel$/, ok()),
    on('POST', /^\/parking\/types$/, ok({ id: 3 })),
    on('PATCH', /^\/parking\/types\/\d+$/, ok({ id: 1 })),
    on('DELETE', /^\/parking\/types\/\d+$/, ok()),
    on('PATCH', /^\/parking\/settings$/, ok({ graceMinutes: 15 })),
    ...baseRoutes(),
  ]);
}

describe('Parqueadero · operar', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'PARQUEADERO' });
    api = parkingApi();
    window.confirm = vi.fn(() => true);
    printMock.printParkingTicket.mockClear();
    invoiceMock.printSaleInvoice.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga los vehículos adentro y los tipos', async () => {
    await renderPage(<ParkingPage />);
    await waitForCall(api, 'GET', /^\/parking$/);
    await waitForCall(api, 'GET', /^\/parking\/types$/);
    expect(await screen.findByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('XYZ789')).toBeInTheDocument();
    expect(screen.getAllByText(money(8000)).length).toBeGreaterThan(0);
  });

  it('registra una entrada con placa, tipo y nombre, e imprime el ticket', async () => {
    await renderPage(<ParkingPage />);
    await screen.findByText('ABC123');
    await typeInto(placeholder('ABC123'), 'new001');
    const typeSelect = screen.getAllByRole('combobox').find((s) => [...s.options].some((o) => o.text.includes('Carro')));
    await typeInto(typeSelect, '1');
    await typeInto(placeholder('Nombre del cliente (opcional)'), 'Pedro');
    await click(button(/Registrar e imprimir ticket/));
    const call = await waitForCall(api, 'POST', /^\/parking\/checkin$/);
    expect(call.body).toMatchObject({ plate: 'NEW001', vehicleTypeId: 1, isMonthly: false, customerName: 'Pedro' });
    await waitFor(() => expect(printMock.printParkingTicket).toHaveBeenCalledTimes(1));
    await waitForCall(api, 'GET', /^\/parking$/, { count: 2 });
    expect(placeholder('ABC123').value).toBe('');
  });

  it('la mensualidad se marca y viaja en el registro', async () => {
    await renderPage(<ParkingPage />);
    await screen.findByText('ABC123');
    await typeInto(placeholder('ABC123'), 'mes001');
    await click(screen.getByLabelText(/Mensualidad/));
    await click(button(/Registrar e imprimir ticket/));
    const call = await waitForCall(api, 'POST', /^\/parking\/checkin$/);
    expect(call.body.isMonthly).toBe(true);
  });

  it('sin placa ni nombre no registra y avisa', async () => {
    await renderPage(<ParkingPage />);
    await screen.findByText('ABC123');
    await click(button(/Registrar e imprimir ticket/));
    await expectToast('error', 'Indica la placa o el nombre');
    expect(api.count('POST', /checkin/)).toBe(0);
  });

  it('la salida cobra con el método elegido, imprime la factura y recarga', async () => {
    await renderPage(<ParkingPage />);
    await screen.findByText('ABC123');
    const card = screen.getByText('ABC123').closest('div.rounded-2xl') || screen.getByText('ABC123').parentElement.parentElement;
    await click(within(card).getByRole('button', { name: /Salida/ }));
    const modal = (await screen.findByText('Total a cobrar')).closest('.fixed');
    expect(within(modal).getAllByText(money(8000)).length).toBeGreaterThan(0);
    await typeInto(within(modal).getByDisplayValue('Efectivo'), 'TRANSFERENCIA');
    expect(modal.querySelector('input[inputmode="numeric"]')).toBeNull();
    await click(within(modal).getByRole('button', { name: /Cobrar y facturar/ }));
    const call = await waitForCall(api, 'POST', /^\/parking\/10\/checkout$/);
    expect(call.body).toEqual({ paymentMethod: 'TRANSFERENCIA' });
    await waitFor(() => expect(invoiceMock.printSaleInvoice).toHaveBeenCalledTimes(1));
    await waitForCall(api, 'GET', /^\/parking$/, { count: 2 });
    expect(screen.queryByText('Total a cobrar')).toBeNull();
  });

  it('en efectivo manda el efectivo recibido para el cambio', async () => {
    await renderPage(<ParkingPage />);
    await screen.findByText('ABC123');
    const card = screen.getByText('ABC123').closest('div.rounded-2xl') || screen.getByText('ABC123').parentElement.parentElement;
    await click(within(card).getByRole('button', { name: /Salida/ }));
    const modal = (await screen.findByText('Total a cobrar')).closest('.fixed');
    await typeInto(modal.querySelector('input[inputmode="numeric"]'), '10000');
    expect(within(modal).getByText(/Cambio/)).toBeInTheDocument();
    await click(within(modal).getByRole('button', { name: /Cobrar y facturar/ }));
    const call = await waitForCall(api, 'POST', /^\/parking\/10\/checkout$/);
    expect(call.body).toEqual({ paymentMethod: 'EFECTIVO', cashReceived: 10000 });
  });

  it('anular un ingreso pide confirmación y no genera cobro', async () => {
    await renderPage(<ParkingPage />);
    await screen.findByText('ABC123');
    await click(screen.getAllByTitle('Anular')[0]);
    expect(String(window.confirm.mock.calls[0][0])).toContain('ABC123');
    await waitForCall(api, 'POST', /^\/parking\/10\/cancel$/);
    await waitForCall(api, 'GET', /^\/parking$/, { count: 2 });
  });

  it('si el backend rechaza el cobro, se avisa', async () => {
    api.set('POST', /^\/parking\/\d+\/checkout$/, fail(400, 'Abre la caja para cobrar'));
    await renderPage(<ParkingPage />);
    await screen.findByText('ABC123');
    const card = screen.getByText('ABC123').closest('div.rounded-2xl') || screen.getByText('ABC123').parentElement.parentElement;
    await click(within(card).getByRole('button', { name: /Salida/ }));
    const modal = (await screen.findByText('Total a cobrar')).closest('.fixed');
    await click(within(modal).getByRole('button', { name: /Cobrar y facturar/ }));
    await expectToast('error', 'Abre la caja');
  });

  it('el barbero no entra al parqueadero', async () => {
    resetBehavior({ type: 'PARQUEADERO', role: 'BARBERO' });
    parkingApi();
    await renderPage(<ParkingPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});

describe('Parqueadero · tarifas', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'PARQUEADERO' });
    api = parkingApi();
    window.confirm = vi.fn(() => true);
  });
  afterEach(() => vi.restoreAllMocks());

  async function openRates() {
    await renderPage(<ParkingPage />);
    await screen.findByText('ABC123');
    await click(screen.getByRole('button', { name: /Tarifas/i }));
    await screen.findByDisplayValue('Carro');
  }

  it('muestra los tipos con sus tarifas y guarda cambios con PATCH', async () => {
    await openRates();
    const row = screen.getByDisplayValue('Carro').closest('tr');
    const numbers = row.querySelectorAll('input[type="number"]');
    await typeInto(numbers[0], '4500');
    await click(within(row).getByRole('button', { name: 'Guardar' }));
    const call = await waitForCall(api, 'PATCH', /^\/parking\/types\/1$/);
    expect(call.body).toMatchObject({ name: 'Carro', hourRate: '4500' });
    await expectToast('success', 'Tipo de vehículo guardado');
  });

  it('agrega un tipo nuevo con POST y exige nombre', async () => {
    await openRates();
    await click(screen.getByRole('button', { name: /Agregar|Nuevo tipo|Añadir/ }));
    const newInput = screen.getAllByPlaceholderText('Carro, Moto…').pop();
    const row = newInput.closest('tr');
    await click(within(row).getByRole('button', { name: 'Guardar' }));
    await expectToast('error', 'El nombre del tipo es obligatorio');
    await typeInto(newInput, 'Bicicleta');
    await typeInto(row.querySelectorAll('input[type="number"]')[0], '1000');
    await click(within(row).getByRole('button', { name: 'Guardar' }));
    const call = await waitForCall(api, 'POST', /^\/parking\/types$/);
    expect(call.body).toMatchObject({ name: 'Bicicleta', hourRate: '1000' });
  });

  it('elimina un tipo con confirmación', async () => {
    await openRates();
    const row = screen.getByDisplayValue('Moto').closest('tr');
    await click(within(row).getAllByRole('button').pop());
    expect(String(window.confirm.mock.calls[0][0])).toContain('Moto');
    await waitForCall(api, 'DELETE', /^\/parking\/types\/2$/);
  });

  it('guarda los minutos de gracia en la configuración', async () => {
    await openRates();
    const grace = screen.getByDisplayValue('10');
    await typeInto(grace, '15');
    await click(screen.getAllByRole('button', { name: /Guardar/ }).pop());
    const call = await waitForCall(api, 'PATCH', /^\/parking\/settings$/);
    expect(call.body).toMatchObject({ graceMinutes: 15 });
    await expectToast('success', 'Configuración guardada');
  });
});
