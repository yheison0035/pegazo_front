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
import FePage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const STATUS_READY = {
  linked: true,
  env: 'PRODUCCION',
  habilitacion: 'HABILITADO',
  hasCertificate: true,
  nit: '901555444',
  softwareId: 'SW-1',
  resolutions: [{ id: 1, prefix: 'SETP', resolution: '18760000001', rangeFrom: 990000000, rangeTo: 995000000, documentType: 'FACTURA_VENTA' }],
  pt: { legalName: 'PEGAZO SAS', nit: '900123456', softwareId: 'PT-SW' },
};
const STATUS_NEW = { linked: false, env: 'HABILITACION', habilitacion: null, hasCertificate: false, resolutions: [], pt: STATUS_READY.pt };
const DOCS = [
  { id: 1, number: 'SETP990000001', type: 'FACTURA_VENTA', status: 'ACEPTADO', customer: 'ANA PÉREZ', total: 119000, createdAt: '2026-02-10T10:00:00.000Z', error: null },
  { id: 2, number: 'SETP990000002', type: 'FACTURA_VENTA', status: 'BORRADOR', customer: 'LUIS GÓMEZ', total: 50000, createdAt: '2026-02-11T10:00:00.000Z', error: null },
  { id: 3, number: 'NC-0001', type: 'NOTA_CREDITO', status: 'ACEPTADO', customer: 'ANA PÉREZ', total: 19000, createdAt: '2026-02-12T10:00:00.000Z', error: null },
];
const STATS = { total: 3, aceptado: 2, enviado: 0, firmado: 0, rechazado: 0, contingencia: 0 };

function feApi(status = STATUS_READY) {
  return installApi([
    on('GET', /^\/fiscal\/status$/, ok(status)),
    on('GET', /^\/fiscal\/stats$/, ok(STATS)),
    on('GET', /^\/fiscal\/documents$/, { success: true, data: DOCS, meta: { total: 3, page: 1, limit: 15, totalPages: 1 } }),
    on('GET', /^\/fiscal\/documents\/\d+\/representation$/, '<html><body>REPRESENTACION</body></html>'),
    // Estas rutas devuelven el documento/resultado SIN envoltorio {data}.
    on('POST', /^\/fiscal\/documents\/\d+\/send-email$/, { to: 'ana@test.com' }),
    on('GET', /^\/fiscal\/documents\/\d+\/whatsapp$/, { url: 'https://wa.me/573001234567?text=hola' }),
    on('DELETE', /^\/fiscal\/documents\/\d+$/, ok()),
    on('POST', /^\/fiscal\/documents\/\d+\/annul$/, { number: 'NC-0002' }),
    on('POST', /^\/fiscal\/credit-notes$/, { number: 'NC-0003' }),
    on('POST', /^\/fiscal\/debit-notes$/, { number: 'ND-0001' }),
    on('POST', /^\/fiscal\/test-invoice$/, { number: 'SETP990000003', status: 'ACEPTADO' }),
    on('POST', /^\/fiscal\/setup$/, ok({ linked: true })),
    on('POST', /^\/fiscal\/resolutions$/, ok({ id: 2 })),
    ...baseRoutes(),
  ]);
}

async function openFe(api) {
  await renderPage(<FePage />);
  await waitForCall(api, 'GET', /^\/fiscal\/status$/);
  await settle();
}

describe('Facturación electrónica · acceso y listado', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ company: { einvoicingReleased: true } });
    api = feApi();
    window.confirm = vi.fn(() => true);
    window.open = vi.fn(() => ({ document: { write: vi.fn(), close: vi.fn() }, focus: vi.fn(), print: vi.fn(), close: vi.fn() }));
  });
  afterEach(() => vi.restoreAllMocks());

  it('si la plataforma no ha liberado el módulo, muestra "próximamente"', async () => {
    resetBehavior({ company: { einvoicingReleased: false } });
    api = feApi();
    await renderPage(<FePage />);
    await settle();
    expect(api.count('GET', /^\/fiscal\/status$/)).toBe(0);
    expect(screen.queryByText(/Emisión directa ante la DIAN/)).toBeNull();
  });

  it('con todo listo carga estado, indicadores y documentos, y filtra por búsqueda/estado/fechas', async () => {
    await openFe(api);
    const docs = await waitForCall(api, 'GET', /^\/fiscal\/documents$/);
    expect(docs.query).toMatchObject({ page: '1', limit: '15' });
    expect(await screen.findByText('SETP990000001')).toBeInTheDocument();
    expect(screen.getByText('NC-0001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Emitir factura de prueba/ })).toBeInTheDocument();

    await typeInto(placeholder('Buscar por número o CUFE...'), 'SETP99');
    let call = await waitForCall(api, 'GET', /^\/fiscal\/documents$/, { count: 2 });
    expect(call.query.search).toBe('SETP99');

    const statusSelect = screen.getAllByRole('combobox').find((s) => [...s.options].some((o) => o.text === 'Todos los estados'));
    await typeInto(statusSelect, [...statusSelect.options].find((o) => o.value && /ACEPTADO/i.test(o.value))?.value || 'ACEPTADO');
    call = await waitForCall(api, 'GET', /^\/fiscal\/documents$/, { count: 3 });
    expect(call.query.status).toMatch(/ACEPTADO/i);

    const dates = document.querySelectorAll('input[type="date"]');
    await typeInto(dates[0], '2026-02-01');
    call = await waitForCall(api, 'GET', /^\/fiscal\/documents$/, { count: 4 });
    expect(call.query.dateFrom).toBe('2026-02-01');
  });

  it('"Actualizar" vuelve a consultar y "Emitir factura de prueba" emite contra la DIAN', async () => {
    await openFe(api);
    await screen.findByText('SETP990000001');
    await click(button('Actualizar'));
    await waitForCall(api, 'GET', /^\/fiscal\/documents$/, { count: 2 });
    await click(button(/Emitir factura de prueba/));
    await waitForCall(api, 'POST', /^\/fiscal\/test-invoice$/);
    const t = await expectToast('success', 'Factura de prueba emitida');
    expect(t.message).toContain('SETP990000003');
  });

  it('abre la representación gráfica y permite enviarla por correo o WhatsApp e imprimirla', async () => {
    await openFe(api);
    await screen.findByText('SETP990000001');
    const row = screen.getByText('SETP990000001').closest('tr');
    await click(within(row).getAllByRole('button')[0]);
    await waitForCall(api, 'GET', /^\/fiscal\/documents\/1\/representation$/);
    const modal = (await screen.findByText('Representación gráfica')).closest('.fixed');
    await waitFor(() => expect(modal.querySelector('iframe')).toBeTruthy());
    await click(within(modal).getByRole('button', { name: /Enviar por correo/ }));
    await waitForCall(api, 'POST', /^\/fiscal\/documents\/1\/send-email$/);
    await expectToast('success', 'Factura enviada a ana@test.com');
    await click(within(modal).getByRole('button', { name: /WhatsApp/ }));
    await waitForCall(api, 'GET', /^\/fiscal\/documents\/1\/whatsapp$/);
    expect(window.open).toHaveBeenCalledWith('https://wa.me/573001234567?text=hola', '_blank');
    await click(within(modal).getByRole('button', { name: /Imprimir/ }));
    expect(window.open).toHaveBeenCalledTimes(2);
  });

  it('una factura aceptada ofrece nota crédito, nota débito y anular; un borrador se puede eliminar', async () => {
    await openFe(api);
    await screen.findByText('SETP990000001');
    const accepted = screen.getByText('SETP990000001').closest('tr');
    expect(within(accepted).getByTitle('Nota crédito (devolución, descuento, ajuste)')).toBeInTheDocument();
    expect(within(accepted).getByTitle('Nota débito (subir el valor)')).toBeInTheDocument();
    expect(within(accepted).getByTitle('Anular con nota crédito total')).toBeInTheDocument();
    expect(within(accepted).queryByTitle('Eliminar (aún no transmitida)')).toBeNull();
    const draft = screen.getByText('SETP990000002').closest('tr');
    expect(within(draft).getByTitle('Eliminar (aún no transmitida)')).toBeInTheDocument();
    const note = screen.getByText('NC-0001').closest('tr');
    expect(within(note).queryByTitle('Anular con nota crédito total')).toBeNull();
  });

  it('anular pide confirmación y emite la nota crédito total', async () => {
    await openFe(api);
    await screen.findByText('SETP990000001');
    const row = screen.getByText('SETP990000001').closest('tr');
    await click(within(row).getByTitle('Anular con nota crédito total'));
    expect(window.confirm).toHaveBeenCalledTimes(1);
    await waitForCall(api, 'POST', /^\/fiscal\/documents\/1\/annul$/);
    const t = await expectToast('success', 'Factura anulada con la nota crédito');
    expect(t.message).toContain('NC-0002');
    await waitForCall(api, 'GET', /^\/fiscal\/documents$/, { count: 2 });
  });

  it('eliminar un borrador pide confirmación y llama DELETE; si no se confirma no hace nada', async () => {
    window.confirm = vi.fn(() => false);
    await openFe(api);
    await screen.findByText('SETP990000002');
    await click(screen.getByTitle('Eliminar (aún no transmitida)'));
    await settle();
    expect(api.count('DELETE', /^\/fiscal\/documents/)).toBe(0);
    window.confirm = vi.fn(() => true);
    await click(screen.getByTitle('Eliminar (aún no transmitida)'));
    await waitForCall(api, 'DELETE', /^\/fiscal\/documents\/2$/);
    await expectToast('success', 'Documento eliminado');
  });

  it('la nota crédito se emite con motivo, concepto y líneas', async () => {
    await openFe(api);
    await screen.findByText('SETP990000001');
    const row = screen.getByText('SETP990000001').closest('tr');
    await click(within(row).getByTitle('Nota crédito (devolución, descuento, ajuste)'));
    const modal = (await screen.findByPlaceholderText('Descripción del motivo…')).closest('.fixed');
    await typeInto(within(modal).getByPlaceholderText('Descripción del motivo…'), 'Devolución de una camiseta');
    const inputs = [...modal.querySelectorAll('input')];
    // Línea: descripción (texto), cantidad (number), valor unitario (MoneyInput numérico), IVA (number).
    const description = inputs.find((i) => (i.type === 'text' || !i.type) && i.placeholder !== 'Descripción del motivo…' && i.getAttribute('inputmode') !== 'numeric');
    await typeInto(description, 'CAMISETA BÁSICA');
    const numbers = inputs.filter((i) => i.type === 'number');
    await typeInto(numbers[0], '1');
    await typeInto(modal.querySelector('input[inputmode="numeric"]'), '25000');
    await click(within(modal).getByRole('button', { name: /Emitir nota crédito/ }));
    const call = await waitForCall(api, 'POST', /^\/fiscal\/credit-notes$/);
    expect(call.body).toMatchObject({ originalInvoiceId: 1 });
    expect(call.body.lines[0]).toMatchObject({ quantity: 1, unitPrice: 25000 });
    expect(call.body.reason).toContain('Devolución de una camiseta');
  });

  it('si la DIAN rechaza una acción, se muestra el motivo', async () => {
    api.set('POST', /^\/fiscal\/test-invoice$/, fail(400, 'Resolución vencida'));
    await openFe(api);
    await screen.findByText('SETP990000001');
    await click(button(/Emitir factura de prueba/));
    await expectToast('error', 'Resolución vencida');
  });

  it('solo dueño y administrador entran', async () => {
    resetBehavior({ role: 'CAJA', company: { einvoicingReleased: true } });
    feApi();
    await renderPage(<FePage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});

describe('Facturación electrónica · activación guiada', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ company: { einvoicingReleased: true } });
    api = feApi(STATUS_NEW);
    try {
      localStorage.clear();
    } catch {
      /* noop */
    }
  });
  afterEach(() => vi.restoreAllMocks());

  it('sin enlazar: el asistente arranca en "Activa el servicio" y "Activar" llama a /fiscal/setup', async () => {
    await openFe(api);
    expect(await screen.findByText('Activa el servicio')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Emitir factura de prueba/ })).toBeNull();
    api.set('GET', /^\/fiscal\/status$/, ok({ ...STATUS_NEW, linked: true }));
    await click(button('Activar'));
    await waitForCall(api, 'POST', /^\/fiscal\/setup$/);
    await expectToast('success', 'Facturación electrónica activada');
    await waitForCall(api, 'GET', /^\/fiscal\/status$/, { count: 2 });
  });

  it('tras activar, los pasos de firma y asociación se confirman y luego se registra la resolución', async () => {
    api = feApi({ ...STATUS_NEW, linked: true });
    await openFe(api);
    await click(await screen.findByRole('button', { name: /Ya estoy habilitado — continuar/ }));
    await click(await screen.findByRole('button', { name: /Ya me asocié a Pegazo/ }));
    await click(await screen.findByRole('button', { name: /Registrar resolución/ }));
    const modal = (await screen.findByPlaceholderText('18760000001')).closest('.fixed');
    await typeInto(within(modal).getByPlaceholderText('18760000001'), '18760000001');
    await typeInto(within(modal).getByPlaceholderText('990000000'), '990000000');
    await typeInto(within(modal).getByPlaceholderText('995000000'), '995000000');
    await typeInto(within(modal).getByPlaceholderText('(solo factura)'), 'fc8eac422eba16e22ffd8c6f94b3f40a6e38162c');
    const dates = modal.querySelectorAll('input[type="date"]');
    await typeInto(dates[0], '2026-01-01');
    await typeInto(dates[1], '2027-01-01');
    await click(within(modal).getByRole('button', { name: 'Registrar' }));
    const call = await waitForCall(api, 'POST', /^\/fiscal\/resolutions$/);
    expect(call.body).toEqual({
      documentType: 'FACTURA_VENTA',
      prefix: 'SETP',
      resolution: '18760000001',
      technicalKey: 'fc8eac422eba16e22ffd8c6f94b3f40a6e38162c',
      rangeFrom: 990000000,
      rangeTo: 995000000,
      validFrom: '2026-01-01',
      validTo: '2027-01-01',
    });
    await waitForCall(api, 'GET', /^\/fiscal\/status$/, { count: 2 });
  });

  it('si el enlace falla, se avisa el motivo', async () => {
    api.set('POST', /^\/fiscal\/setup$/, fail(400, 'La empresa no tiene NIT'));
    await openFe(api);
    await click(await screen.findByRole('button', { name: 'Activar' }));
    await expectToast('error', 'La empresa no tiene NIT');
  });
});
