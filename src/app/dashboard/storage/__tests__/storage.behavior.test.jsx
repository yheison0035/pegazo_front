import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi,
  on,
  list,
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
import StoragePage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const SETTINGS = { hourRate: 2000, dayRate: 8000, weekRate: 30000, monthRate: 90000, washPrice: 5000, graceMinutes: 10, defaultMode: 'HORA' };
const TICKETS = [
  { id: 10, code: 'GC-0010', customerName: 'ANA PÉREZ', customerPhone: '3001234567', customerEmail: '', plate: '', billingMode: 'HORA', washRequested: true, washDone: false, washCount: 1, helmetCount: 1, lockerCount: 1, checkInAt: new Date(Date.now() - 2 * 3600000).toISOString(), receivedByName: 'Dueño Prueba' },
  { id: 11, code: 'GC-0011', customerName: '', customerPhone: '', customerEmail: '', plate: 'ABC12D', billingMode: 'DIA', washRequested: false, washDone: false, washCount: 0, helmetCount: 2, lockerCount: 1, checkInAt: new Date(Date.now() - 30 * 60000).toISOString(), receivedByName: '' },
];

function storageApi() {
  return installApi([
    on('GET', /^\/storage$/, { success: true, data: TICKETS, settings: SETTINGS, summary: { active: 2, washPending: 1 } }),
    on('GET', /^\/storage\/settings$/, ok(SETTINGS)),
    on('GET', /^\/storage\/history$/, ok([])),
    on('POST', /^\/storage\/checkin$/, ok({ id: 12, code: 'GC-0012', customerName: 'PEDRO', checkInAt: new Date().toISOString() })),
    on('PATCH', /^\/storage\/\d+\/wash$/, ok({})),
    on('POST', /^\/storage\/\d+\/cancel$/, ok()),
    on('POST', /^\/storage\/\d+\/checkout$/, ok({ sale: { id: 77, code: 'FV-0077', totalAmount: 9000 }, total: 9000 })),
    on('PATCH', /^\/storage\/settings$/, ok(SETTINGS)),
    on('GET', /^\/inventory$/, list([])),
    ...baseRoutes(),
  ]);
}

describe('Guarda cascos (custodia)', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'PARQUEADERO' });
    api = storageApi();
    window.confirm = vi.fn(() => true);
    // El comprobante se imprime en una ventana aparte: se simula.
    window.open = vi.fn(() => ({ document: { write: vi.fn(), close: vi.fn() }, close: vi.fn(), focus: vi.fn(), print: vi.fn() }));
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga los cascos en custodia con su resumen y el buscador filtra en pantalla', async () => {
    await renderPage(<StoragePage />);
    await waitForCall(api, 'GET', /^\/storage$/);
    expect(await screen.findByText('ANA PÉREZ')).toBeInTheDocument();
    expect(screen.getByText('ABC12D')).toBeInTheDocument();
    await typeInto(placeholder('Buscar por # de ticket o nombre…'), 'ana');
    expect(screen.getByText('ANA PÉREZ')).toBeInTheDocument();
    expect(screen.queryByText('ABC12D')).toBeNull();
    expect(api.count('GET', /^\/storage$/)).toBe(1);
  });

  it('recibir un casco valida nombre y contacto, registra el ingreso e imprime el comprobante', async () => {
    await renderPage(<StoragePage />);
    await screen.findByText('ANA PÉREZ');
    await click(screen.getAllByRole('button', { name: /Recibir casco/ })[0]);
    await click(button('Recibir'));
    await expectToast('warning', 'Falta el nombre del cliente');
    await typeInto(placeholder('EJ: JUAN PÉREZ'), 'pedro gómez');
    await click(button('Recibir'));
    await expectToast('warning', 'Indica celular o correo');
    await typeInto(placeholder('3001234567'), '3105550000');
    await click(button('Recibir'));
    const call = await waitForCall(api, 'POST', /^\/storage\/checkin$/);
    expect(call.body).toMatchObject({ customerName: 'PEDRO GÓMEZ', customerPhone: '3105550000', billingMode: 'HORA', washRequested: false, washCount: 0, helmetCount: 1, lockerCount: 1 });
    expect(call.body.plate).toBeUndefined();
    await waitForCall(api, 'GET', /^\/storage$/, { count: 2 });
  });

  it('con lavado solicitado, el ingreso lleva la cantidad de lavados', async () => {
    await renderPage(<StoragePage />);
    await screen.findByText('ANA PÉREZ');
    await click(screen.getAllByRole('button', { name: /Recibir casco/ })[0]);
    await typeInto(placeholder('EJ: JUAN PÉREZ'), 'Luis');
    await typeInto(placeholder('3001234567'), '3105550000');
    const wash = document.querySelector('.fixed input[type="checkbox"]');
    await click(wash);
    await click(button('Recibir'));
    const call = await waitForCall(api, 'POST', /^\/storage\/checkin$/);
    expect(call.body).toMatchObject({ washRequested: true, washCount: 1 });
  });

  it('un celular inválido no registra', async () => {
    await renderPage(<StoragePage />);
    await screen.findByText('ANA PÉREZ');
    await click(screen.getAllByRole('button', { name: /Recibir casco/ })[0]);
    await typeInto(placeholder('EJ: JUAN PÉREZ'), 'Luis');
    await typeInto(placeholder('3001234567'), '12345');
    await click(button('Recibir'));
    await expectToast('warning', /celular debe tener 10 dígitos/);
    expect(api.count('POST', /checkin/)).toBe(0);
  });

  it('marcar el lavado listo llama PATCH /wash', async () => {
    await renderPage(<StoragePage />);
    await screen.findByText('ANA PÉREZ');
    await click(screen.getByRole('button', { name: /Marcar lavado listo/ }));
    const call = await waitForCall(api, 'PATCH', /^\/storage\/10\/wash$/);
    expect(call.body).toEqual({ done: true });
    await waitForCall(api, 'GET', /^\/storage$/, { count: 2 });
  });

  it('cobrar y entregar abre el detalle, permite elegir el método y registra la venta', async () => {
    await renderPage(<StoragePage />);
    await screen.findByText('ANA PÉREZ');
    const card = screen.getByText('ANA PÉREZ').closest('div.rounded-2xl') || screen.getByText('ANA PÉREZ').closest('li') || screen.getByText('ANA PÉREZ').parentElement.parentElement.parentElement;
    await click(within(card).getByRole('button', { name: /Cobrar y entregar/ }));
    const modal = (await screen.findByText('Detalle del cobro')).closest('.fixed');
    await click(within(modal).getByRole('button', { name: 'Transferencia' }));
    await click(within(modal).getByRole('button', { name: /Cobrar y entregar/ }));
    const call = await waitForCall(api, 'POST', /^\/storage\/10\/checkout$/);
    // El ticket pidió lavado: por defecto se incluye en el cobro.
    expect(call.body).toEqual({ paymentMethod: 'TRANSFERENCIA', includeWash: true, products: [] });
    await waitForCall(api, 'GET', /^\/storage$/, { count: 2 });
  });

  it('anular pide confirmación y no cobra', async () => {
    await renderPage(<StoragePage />);
    await screen.findByText('ANA PÉREZ');
    await click(screen.getAllByRole('button', { name: 'Anular' })[0]);
    expect(String(window.confirm.mock.calls[0][0])).toContain('ANA PÉREZ');
    await waitForCall(api, 'POST', /^\/storage\/10\/cancel$/);
    await waitForCall(api, 'GET', /^\/storage$/, { count: 2 });
  });

  it('las tarifas se editan y guardan con PATCH /storage/settings', async () => {
    await renderPage(<StoragePage />);
    await screen.findByText('ANA PÉREZ');
    await click(screen.getByRole('button', { name: /Tarifas/ }));
    const modal = (await screen.findByText('Tarifas de guarda cascos')).closest('.fixed');
    const inputs = modal.querySelectorAll('input');
    await typeInto(inputs[0], '2500');
    await click(within(modal).getByRole('button', { name: /Guardar tarifas/ }));
    const call = await waitForCall(api, 'PATCH', /^\/storage\/settings$/);
    expect(call.body).toMatchObject({ hourRate: 2500, dayRate: 8000, weekRate: 30000, monthRate: 90000, washPrice: 5000, graceMinutes: 10, defaultMode: 'HORA' });
  });

  it('si el backend rechaza el cobro, se avisa', async () => {
    api.set('POST', /^\/storage\/\d+\/checkout$/, fail(400, 'Abre la caja para cobrar'));
    await renderPage(<StoragePage />);
    await screen.findByText('ANA PÉREZ');
    await click(screen.getAllByRole('button', { name: /Cobrar y entregar/ })[0]);
    const modal = (await screen.findByText('Detalle del cobro')).closest('.fixed');
    await click(within(modal).getByRole('button', { name: /Cobrar y entregar/ }));
    await expectToast('error', 'Abre la caja');
  });

  it('el barbero no entra a guarda cascos', async () => {
    resetBehavior({ type: 'PARQUEADERO', role: 'BARBERO' });
    storageApi();
    await renderPage(<StoragePage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
