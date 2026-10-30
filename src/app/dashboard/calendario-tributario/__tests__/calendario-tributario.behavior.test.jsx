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
  router,
} from '@/test/behaviorHarness';
import CalendarioPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
const xlsxMock = vi.hoisted(() => ({ writeFile: vi.fn(), utils: { book_new: vi.fn(() => ({})), aoa_to_sheet: vi.fn(() => ({})), book_append_sheet: vi.fn() } }));
vi.mock('xlsx', () => xlsxMock);
const csvMock = vi.hoisted(() => ({ downloadCsv: vi.fn() }));
vi.mock('@/utils/exportCsv', () => csvMock);

const CALENDAR = {
  year: 2026,
  uvt: 52374,
  regime: 'ORDINARIO',
  nitDigit: '4',
  deadlines: [
    { id: 1, obligation: 'IVA', period: 'Bimestre 1', title: 'Declaración de IVA bimestre 1', dueDate: '2026-03-10', daysLeft: 12, status: 'PROXIMO', notes: '' },
    { id: 2, obligation: 'RETEFUENTE', period: 'Enero', title: 'Retención en la fuente enero', dueDate: '2026-02-12', daysLeft: -5, status: 'VENCIDO', notes: '' },
    { id: 3, obligation: 'RENTA', period: '2025', title: 'Renta año gravable 2025', dueDate: '2026-08-14', daysLeft: 160, status: 'PENDIENTE', notes: '' },
  ],
};
const OBLIGATIONS = {
  engineAvailable: true,
  profile: { personType: 'JURIDICA', taxRegime: 'ORDINARIO', responsableIVA: true, agenteRetencion: false, autorretenedor: false, responsableICA: true, granContribuyente: false, obligadoContabilidad: true, facturadorElectronico: true },
  magnitudes: { ingresosBrutosOverride: null, ingresosVentas: 120000000, patrimonioBruto: 80000000, consumosTarjeta: 0, compras: 50000000, consignaciones: 110000000, retencionesAFavor: 0, anticipoRenta: 0 },
  evaluation: { obligations: [{ key: 'IVA', label: 'Declarar IVA', basis: 'Responsable de IVA', frequency: 'BIMESTRAL' }, { key: 'RENTA', label: 'Declarar renta', basis: 'Persona jurídica', frequency: 'ANUAL' }] },
};
const RENTA = { year: 2025, company: { name: 'Negocio Prueba' }, personType: 'JURIDICA', regime: 'ORDINARIO', engineAvailable: true, consolidado: { ingresos: 120000000, costos: 50000000, gastos: 20000000, utilidad: 50000000 }, baseGravable: 50000000, impuestoEstimado: 17500000, effectiveRate: 35, retencionesAFavor: 0, anticipoRenta: 0, saldoAPagarEstimado: 17500000, saldoAFavorEstimado: 0, nota: '', disclaimer: 'Estimación sin validez legal' };

function calendarApi() {
  return installApi([
    on('GET', /^\/tax\/calendar$/, ok(CALENDAR)),
    on('POST', /^\/tax\/run-alerts$/, ok({ created: 2 })),
    on('GET', /^\/tax\/obligations$/, ok(OBLIGATIONS)),
    on('GET', /^\/tax\/profile$/, ok(OBLIGATIONS.profile)),
    on('PATCH', /^\/tax\/profile$/, ok({})),
    on('GET', /^\/tax\/tax-year$/, ok(OBLIGATIONS.magnitudes)),
    on('PATCH', /^\/tax\/tax-year$/, ok({})),
    on('GET', /^\/tax\/alert-prefs$/, ok({ taxAlertsEnabled: true, taxAlertEmail: false })),
    on('PATCH', /^\/tax\/alert-prefs$/, (c) => ok({ taxAlertsEnabled: true, taxAlertEmail: false, ...c.body })),
    on('GET', /^\/tax\/renta$/, ok(RENTA)),
    ...baseRoutes(),
  ]);
}

describe('Calendario tributario', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = calendarApi();
    xlsxMock.writeFile.mockClear();
    csvMock.downloadCsv.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga el calendario con UVT, régimen y vencimientos clasificados', async () => {
    await renderPage(<CalendarioPage />);
    await waitForCall(api, 'GET', /^\/tax\/calendar$/);
    expect(await screen.findByText('Declaración de IVA bimestre 1')).toBeInTheDocument();
    expect(screen.getByText('Retención en la fuente enero')).toBeInTheDocument();
    expect(screen.getByText(/Faltan 12 días/)).toBeInTheDocument();
    expect(screen.getByText(/Venció hace 5 días/)).toBeInTheDocument();
  });

  it('"Revisar ahora" corre las alertas y resume cuántos avisos creó', async () => {
    await renderPage(<CalendarioPage />);
    await screen.findByText('Declaración de IVA bimestre 1');
    await click(button(/Revisar ahora/));
    await waitForCall(api, 'POST', /^\/tax\/run-alerts$/);
    expect(await screen.findByText(/Se crearon 2 avisos en tu campana/)).toBeInTheDocument();
    api.set('POST', /^\/tax\/run-alerts$/, ok({ created: 0 }));
    await click(button(/Revisar ahora/));
    expect(await screen.findByText(/Todo al día/)).toBeInTheDocument();
  });

  it('exporta el calendario a CSV', async () => {
    await renderPage(<CalendarioPage />);
    await screen.findByText('Declaración de IVA bimestre 1');
    await click(screen.getAllByRole('button', { name: /Exportar/ })[0]);
    await waitFor(() => expect(csvMock.downloadCsv).toHaveBeenCalledTimes(1));
  });

  it('el panel de obligaciones evalúa el perfil y permite editarlo (perfil y magnitudes)', async () => {
    await renderPage(<CalendarioPage />);
    await waitForCall(api, 'GET', /^\/tax\/obligations$/);
    expect(await screen.findByText('Declarar IVA')).toBeInTheDocument();
    expect(screen.getByText('Declarar renta')).toBeInTheDocument();
    await click(button(/Perfil fiscal/));
    await waitForCall(api, 'GET', /^\/tax\/profile$/);
    await waitForCall(api, 'GET', /^\/tax\/tax-year$/);
    const agente = await screen.findByLabelText(/Agente de retención/);
    expect(agente.checked).toBe(false);
    await click(agente);
    await click(button(/Guardar y recalcular/));
    const prof = await waitForCall(api, 'PATCH', /^\/tax\/profile$/);
    expect(prof.body).toMatchObject({ personType: 'JURIDICA', taxRegime: 'ORDINARIO', responsableIVA: true, agenteRetencion: true, responsableICA: true });
    const year = await waitForCall(api, 'PATCH', /^\/tax\/tax-year$/);
    expect(year.body).toMatchObject({ patrimonioBruto: 80000000, compras: 50000000, consignaciones: 110000000 });
    await waitForCall(api, 'GET', /^\/tax\/obligations$/, { count: 2 });
  });

  it('las preferencias de avisos se guardan al cambiar cada interruptor', async () => {
    await renderPage(<CalendarioPage />);
    await waitForCall(api, 'GET', /^\/tax\/alert-prefs$/);
    const card = (await screen.findByText('Avisos de vencimientos')).closest('div.rounded-2xl') || screen.getByText('Avisos de vencimientos').parentElement.parentElement;
    const switches = within(card).getAllByRole('switch');
    expect(switches[0].getAttribute('aria-checked')).toBe('true');
    await click(switches[1]);
    const call = await waitForCall(api, 'PATCH', /^\/tax\/alert-prefs$/);
    expect(call.body).toEqual({ taxAlertEmail: true });
  });

  it('el borrador de renta carga el año elegido y se exporta a Excel', async () => {
    await renderPage(<CalendarioPage />);
    const first = await waitForCall(api, 'GET', /^\/tax\/renta$/);
    expect(first.query.year).toMatch(/^\d{4}$/);
    await screen.findByText(/Estimación sin validez legal/);
    // Hay dos selectores de año (obligaciones y renta): se toma el de la tarjeta de renta.
    const rentaCard = screen.getByText('(borrador)').closest('div.rounded-2xl');
    const yearSelect = within(rentaCard).getByRole('combobox');
    const other = [...yearSelect.options].find((o) => o.value !== yearSelect.value).value;
    await typeInto(yearSelect, other);
    const second = await waitForCall(api, 'GET', /^\/tax\/renta$/, { count: 2 });
    expect(second.query.year).toBe(other);
    await click(screen.getByRole('button', { name: /^Excel$/ }));
    expect(xlsxMock.writeFile).toHaveBeenCalledTimes(1);
    expect(xlsxMock.writeFile.mock.calls[0][1]).toMatch(/^borrador-renta_/);
  });

  it('el contador entra; la caja no', async () => {
    resetBehavior({ role: 'CONTADOR' });
    api = calendarApi();
    await renderPage(<CalendarioPage />);
    expect(await screen.findByText('Declaración de IVA bimestre 1')).toBeInTheDocument();
    vi.restoreAllMocks();
    resetBehavior({ role: 'CAJA' });
    calendarApi();
    await renderPage(<CalendarioPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
