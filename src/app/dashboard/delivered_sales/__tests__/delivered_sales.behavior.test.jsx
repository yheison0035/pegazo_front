import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi,
  on,
  list,
  detail,
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
  fireEvent,
  button,
  rowButton,
  queryRowButton,
  waitForCall,
  expectToast,
  authState,
  navState,
  router,
  money,
} from '@/test/behaviorHarness';
import DeliveredSalesPage from '../page';
import EditSalePage from '../edit/[id]/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const printMock = vi.hoisted(() => ({ printSaleInvoice: vi.fn(), printCustodyTicket: vi.fn() }));
vi.mock('@/utils/printInvoice', () => printMock);
const csvMock = vi.hoisted(() => ({ downloadCsv: vi.fn() }));
vi.mock('@/utils/exportCsv', () => csvMock);
const waMock = vi.hoisted(() => ({ sendInvoiceWhatsapp: vi.fn() }));
vi.mock('@/utils/invoiceWhatsapp', () => waMock);

const SALES = [
  {
    id: 1,
    code: 'FV-0001',
    saleDate: '2026-02-10T15:00:00.000Z',
    totalAmount: 50000,
    paymentMethod: 'EFECTIVO',
    paymentStatus: 'PAGADA',
    invoiceType: 'NORMAL',
    customer: { id: 1, name: 'ANA PÉREZ', phone: '3001234567', document: '1001' },
    local: { id: 1, name: 'Sede Centro' },
    localId: 1,
    user: { id: 1, name: 'Dueño Prueba' },
    userId: 1,
    notes: '',
    items: [{ id: 1, inventoryVariantId: 5, name: 'CAMISETA BÁSICA', quantity: 2, price: 25000, discount: 0, stock: 10, trackStock: true }],
  },
  {
    id: 2,
    code: 'FV-0002',
    saleDate: '2026-02-11T15:00:00.000Z',
    totalAmount: 20000,
    paymentMethod: 'TRANSFERENCIA',
    paymentStatus: 'PAGADA',
    invoiceType: 'NORMAL',
    customer: { id: 99, name: 'Consumidor Final', phone: '', document: '222222222222' },
    local: { id: 1, name: 'Sede Centro' },
    localId: 1,
    user: { id: 1, name: 'Dueño Prueba' },
    userId: 1,
    notes: '',
    items: [],
  },
];

function salesApi() {
  return installApi([
    on('GET', /^\/sales$/, list(SALES, { total: 2 })),
    on('GET', /^\/sales\/\d+$/, detail(SALES[0])),
    on('DELETE', /^\/sales\/\d+$/, ok()),
    on('PUT', /^\/sales\/\d+$/, ok({ id: 1 })),
    on('POST', /^\/sales\/reports\/daily$/, ok({ date: '2026-02-10', total: { total: 80000, users: [{ name: 'Dueño Prueba', total: 80000 }] }, methods: { EFECTIVO: { total: 80000, users: { 'Dueño Prueba': 80000 } } } })),
    on('POST', /^\/sales\/reports\/range$/, ok({ startDate: '2026-02-01', endDate: '2026-02-07', total: { total: 120000, users: [{ userId: 1, name: 'Dueño Prueba', total: 120000, services: 0 }] }, daily: [{ date: '2026-02-01', total: 120000 }], methods: { EFECTIVO: { total: 120000 } } })),
    on('POST', /^\/sales\/reports\/range\/general$/, ok({ startDate: '2026-02-01', endDate: '2026-02-28', total: { total: 300000, users: [{ name: 'Dueño Prueba', total: 300000 }] }, daily: [{ date: '2026-02-01', total: 300000 }], methods: { EFECTIVO: { total: 300000 } } })),
    on('POST', /^\/sales\/reports\/service-performance$/, { success: true, data: {}, paymentBreakdown: { EFECTIVO: 45000 } }),
    on('GET', /^\/sales\/inactive-customers$/, ok([{ id: 1, name: 'ANA PÉREZ', phone: '3001234567', days: 25, visits: 3, lastService: 'Corte', contacted: false }])),
    on('PATCH', /^\/sales\/inactive-customers\/\d+\/contacted$/, ok()),
    ...baseRoutes(),
  ]);
}

describe('Ventas realizadas · listado', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = salesApi();
    printMock.printSaleInvoice.mockClear();
    csvMock.downloadCsv.mockClear();
    waMock.sendInvoiceWhatsapp.mockClear();
    window.open = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga las ventas con paginación', async () => {
    await renderPage(<DeliveredSalesPage />);
    const call = await waitForCall(api, 'GET', /^\/sales$/);
    expect(call.query).toMatchObject({ page: '1', limit: '10' });
    expect(screen.getByText('FV-0001')).toBeInTheDocument();
    expect(screen.getByText('FV-0002')).toBeInTheDocument();
    expect(screen.getByText('ANA PÉREZ')).toBeInTheDocument();
  });

  it('filtra por número de factura y por fecha', async () => {
    await renderPage(<DeliveredSalesPage />);
    await waitForCall(api, 'GET', /^\/sales$/);
    await typeInto(screen.getAllByPlaceholderText('Filtrar Factura / Venta #')[0], 'FV-0002');
    let call = await waitForCall(api, 'GET', /^\/sales$/, { count: 2 });
    expect(call.query.code).toBe('FV-0002');
    await typeInto(screen.getAllByPlaceholderText('Filtrar por fecha')[0], '2026-02-11');
    call = await waitForCall(api, 'GET', /^\/sales$/, { count: 3 });
    expect(call.query.saleDate).toBe('2026-02-11');
  });

  it('ver detalle muestra la factura y permite imprimirla', async () => {
    await renderPage(<DeliveredSalesPage />);
    await waitForCall(api, 'GET', /^\/sales$/);
    await click(rowButton('FV-0001', 'Ver detalle'));
    const modal = screen.getByRole('heading', { name: 'FV-0001' }).closest('.fixed');
    expect(within(modal).getByText('CAMISETA BÁSICA')).toBeInTheDocument();
    await click(within(modal).getByRole('button', { name: /Imprimir/ }));
    expect(printMock.printSaleInvoice).toHaveBeenCalledTimes(1);
    expect(printMock.printSaleInvoice.mock.calls[0][0].code).toBe('FV-0001');
  });

  it('imprimir tiquete y enviar por WhatsApp desde la fila', async () => {
    await renderPage(<DeliveredSalesPage />);
    await waitForCall(api, 'GET', /^\/sales$/);
    await click(rowButton('FV-0001', 'Imprimir tiquete'));
    expect(printMock.printSaleInvoice).toHaveBeenCalledTimes(1);
    await click(rowButton('FV-0001', 'Enviar factura por WhatsApp'));
    expect(waMock.sendInvoiceWhatsapp).toHaveBeenCalledTimes(1);
    // Consumidor final (sin teléfono real) no tiene WhatsApp.
    expect(queryRowButton('FV-0002', 'Enviar factura por WhatsApp')).toBeNull();
  });

  it('eliminar una venta confirma y llama DELETE; si falla, avisa', async () => {
    await renderPage(<DeliveredSalesPage />);
    await waitForCall(api, 'GET', /^\/sales$/);
    await click(rowButton('FV-0002', 'Eliminar'));
    let modal = screen.getByText('Confirmar eliminación').parentElement;
    expect(within(modal).getByText('FV-0002')).toBeInTheDocument();
    await click(within(modal).getByRole('button', { name: 'Eliminar' }));
    await waitForCall(api, 'DELETE', /^\/sales\/2$/);
    await waitForCall(api, 'GET', /^\/sales$/, { count: 2 });

    api.set('DELETE', /^\/sales\/\d+$/, fail(400, 'La venta ya fue facturada electrónicamente'));
    await click(rowButton('FV-0001', 'Eliminar'));
    modal = screen.getByText('Confirmar eliminación').parentElement;
    await click(within(modal).getByRole('button', { name: 'Eliminar' }));
    await expectToast('error', 'facturada electrónicamente');
  });

  it('exporta CSV con todas las ventas filtradas', async () => {
    await renderPage(<DeliveredSalesPage />);
    await waitForCall(api, 'GET', /^\/sales$/);
    await click(button('Exportar CSV'));
    const call = await waitForCall(api, 'GET', /^\/sales$/, { count: 2 });
    expect(call.query).toMatchObject({ page: '1', limit: '5000' });
    await waitFor(() => expect(csvMock.downloadCsv).toHaveBeenCalledTimes(1));
    const [filename, rows] = csvMock.downloadCsv.mock.calls[0];
    expect(filename).toMatch(/^ventas_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(rows[0]).toMatchObject({ Codigo: 'FV-0001', Cliente: 'ANA PÉREZ', Total: 50000, Metodo: 'EFECTIVO', Local: 'Sede Centro' });
    expect(rows[1].Cliente).toBe('Consumidor Final');
  });

  it('deep link ?open=<id> abre el detalle', async () => {
    navState.search = 'open=1';
    await renderPage(<DeliveredSalesPage />);
    await waitForCall(api, 'GET', /^\/sales\/1$/);
    expect(await screen.findByRole('heading', { name: 'FV-0001' })).toBeInTheDocument();
    expect(router.replace).toHaveBeenCalledWith('/dashboard/delivered_sales');
  });

  it('el asesor consulta pero no exporta, edita ni elimina', async () => {
    resetBehavior({ role: 'ASESOR' });
    api = salesApi();
    await renderPage(<DeliveredSalesPage />);
    await waitForCall(api, 'GET', /^\/sales$/);
    expect(screen.queryByText('Exportar CSV')).toBeNull();
    expect(rowButton('FV-0001', 'Ver detalle')).toBeTruthy();
    expect(queryRowButton('FV-0001', 'Editar')).toBeNull();
    expect(queryRowButton('FV-0001', 'Eliminar')).toBeNull();
  });
});

describe('Ventas realizadas · reportes', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = salesApi();
    window.open = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  async function openReport(name, title) {
    await renderPage(<DeliveredSalesPage />);
    await waitForCall(api, 'GET', /^\/sales$/);
    await click(button(name));
    const modal = (await screen.findByText(title)).closest('.fixed');
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    return modal;
  }

  function setDates(modal, ...values) {
    const inputs = modal.querySelectorAll('input[type="date"]');
    values.forEach((v, i) => fireEvent.change(inputs[i], { target: { value: v } }));
    const localSelect = [...modal.querySelectorAll('select')].find((s) => [...s.options].some((o) => o.text === 'Sede Centro'));
    fireEvent.change(localSelect, { target: { value: '1' } });
  }

  it('venta por día: pide fecha y sede, consulta el backend y muestra totales', async () => {
    const modal = await openReport('Venta por Día', 'Reporte de Ventas Diarias');
    setDates(modal, '2026-02-10');
    await click(within(modal).getByRole('button', { name: 'Generar reporte' }));
    const call = await waitForCall(api, 'POST', /^\/sales\/reports\/daily$/);
    expect(call.body).toEqual({ date: '2026-02-10', localId: 1 });
    await waitFor(() => expect(within(modal).getAllByText(money(80000)).length).toBeGreaterThan(0));
    expect(within(modal).getAllByText('DUEÑO PRUEBA').length).toBeGreaterThan(0);
  });

  it('venta por semana: rango de fechas y sede', async () => {
    const modal = await openReport('Venta por Semana', 'Reporte de Ventas por Rango');
    setDates(modal, '2026-02-01', '2026-02-07');
    await click(within(modal).getByRole('button', { name: 'Generar reporte' }));
    const call = await waitForCall(api, 'POST', /^\/sales\/reports\/range$/);
    expect(call.body).toMatchObject({ startDate: '2026-02-01', endDate: '2026-02-07', localId: 1 });
    await waitFor(() => expect(within(modal).getAllByText(money(120000)).length).toBeGreaterThan(0));
  });

  it('ventas generales: rango y sede, con detalle por método de pago', async () => {
    const modal = await openReport('Ventas Generales', 'Reporte General de Ventas');
    setDates(modal, '2026-02-01', '2026-02-28');
    await click(within(modal).getByRole('button', { name: 'Generar reporte' }));
    const call = await waitForCall(api, 'POST', /^\/sales\/reports\/range\/general$/);
    expect(call.body).toEqual({ startDate: '2026-02-01', endDate: '2026-02-28', localId: 1 });
    await waitFor(() => expect(within(modal).getAllByText(money(300000)).length).toBeGreaterThan(0));
    await click(within(modal).getByRole('button', { name: 'Ver detalle por método de pago' }));
    expect(within(modal).getByText(/Ocultar detalle por método de pago/)).toBeInTheDocument();
  });

  it('en negocios de servicios el reporte es "Ventas y Servicios" (productividad)', async () => {
    resetBehavior({ type: 'BARBERIA' });
    api = salesApi();
    await renderPage(<DeliveredSalesPage />);
    await waitForCall(api, 'GET', /^\/sales$/);
    expect(screen.queryByText('Venta por Día')).toBeNull();
    await click(button('Ventas y Servicios'));
    const modal = (await screen.findByText('Reporte de Servicios y Productos')).closest('.fixed');
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    setDates(modal, '2026-02-01', '2026-02-28');
    await click(within(modal).getByRole('button', { name: 'Generar reporte' }));
    const call = await waitForCall(api, 'POST', /^\/sales\/reports\/service-performance$/);
    expect(call.body).toEqual({ startDate: '2026-02-01', endDate: '2026-02-28', localId: 1 });
    await waitFor(() => expect(within(modal).getByText('Recaudo por método de pago')).toBeInTheDocument());
  });

  it('reactivar clientes: lista inactivos y marca el contacto por WhatsApp', async () => {
    await renderPage(<DeliveredSalesPage />);
    await waitForCall(api, 'GET', /^\/sales$/);
    await click(button('Reactivar clientes'));
    const call = await waitForCall(api, 'GET', /^\/sales\/inactive-customers$/);
    expect(call.query.minDays).toBe('20');
    const modal = (await screen.findByText('Clientes por reactivar')).closest('.fixed');
    expect(await within(modal).findByText('ANA PÉREZ')).toBeInTheDocument();
    await click(within(modal).getByRole('button', { name: /Escribir/ }));
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(String(window.open.mock.calls[0][0])).toMatch(/wa\.me|whatsapp/);
    await waitForCall(api, 'PATCH', /^\/sales\/inactive-customers\/1\/contacted$/);
  });
});

describe('Ventas realizadas · editar factura', () => {
  afterEach(() => vi.restoreAllMocks());

  it('precarga la venta en el POS y guarda con PUT /sales/:id', async () => {
    resetBehavior();
    authState.params = { id: '1' };
    const api = salesApi();
    await renderPage(<EditSalePage />);
    await waitForCall(api, 'GET', /^\/sales\/1$/);
    await waitForCall(api, 'GET', /^\/payment-methods$/);
    await settle();
    expect(screen.getAllByText('CAMISETA BÁSICA').length).toBeGreaterThan(0);
    expect(screen.getByText('ANA PÉREZ')).toBeInTheDocument();
    const save = screen.getByRole('button', { name: /Guardar cambios/ });
    await click(save);
    const call = await waitForCall(api, 'PUT', /^\/sales\/1$/);
    expect(call.body.items).toEqual([{ inventoryVariantId: 5, quantity: 2, discount: 0 }]);
    expect(call.body.customerId).toBe(1);
    expect(call.body.localId).toBe(1);
  });
});
