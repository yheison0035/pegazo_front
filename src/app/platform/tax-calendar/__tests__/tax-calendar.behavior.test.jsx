import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  ok,
  fail,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  waitFor,
  click,
  typeInto,
  setField,
  button,
  rowButton,
  placeholder,
  waitForCall,
  expectToast,
  router,
} from '@/test/behaviorHarness';
import { within } from '@testing-library/react';
import TaxCalendarPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const DEADLINES = [
  { id: 1, obligation: 'IVA', title: 'Declaración de IVA - Bimestre 1', period: 'Bimestre 1', dueDate: '2026-03-10T00:00:00.000Z', nitDigits: '1,2', regime: 'ORDINARIO', notes: '', active: true },
  { id: 2, obligation: 'RENTA', title: 'Renta 2025', period: '', dueDate: '2026-08-14T00:00:00.000Z', nitDigits: '', regime: '', notes: '', active: false },
];
const PARAMS = [{ key: 'UVT', year: 2026, value: 52374 }];

function taxApi() {
  return installApi([
    on('GET', /^\/tax\/deadlines$/, ok(DEADLINES)),
    on('POST', /^\/tax\/deadlines$/, ok({ id: 3 })),
    on('PATCH', /^\/tax\/deadlines\/\d+$/, ok({})),
    on('DELETE', /^\/tax\/deadlines\/\d+$/, ok({})),
    on('GET', /^\/tax\/parameters$/, ok(PARAMS)),
    on('POST', /^\/tax\/parameters$/, ok({})),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · Calendario tributario (admin)', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = taxApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga las fechas del año y la UVT', async () => {
    await renderPage(<TaxCalendarPage />);
    const dl = await waitForCall(api, 'GET', /^\/tax\/deadlines$/);
    expect(dl.query.year).toMatch(/^\d{4}$/);
    expect(await screen.findByText('Declaración de IVA - Bimestre 1')).toBeInTheDocument();
    expect(screen.getByText('NIT: 1,2 · ORDINARIO')).toBeInTheDocument();
    expect(screen.getByText('Renta 2025')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/52\.374/)).toBeInTheDocument();
  });

  it('cambiar de año vuelve a consultar fechas y parámetros', async () => {
    await renderPage(<TaxCalendarPage />);
    await waitForCall(api, 'GET', /^\/tax\/deadlines$/);
    const yearSelect = [...document.querySelectorAll('select')].find((s) => [...s.options].some((o) => o.value === '2027'));
    await typeInto(yearSelect, '2027');
    const dl = await waitForCall(api, 'GET', /^\/tax\/deadlines$/, { count: 2 });
    expect(dl.query.year).toBe('2027');
    await waitForCall(api, 'GET', /^\/tax\/parameters$/, { count: 2 });
  });

  it('guardar la UVT la envía con el año', async () => {
    await renderPage(<TaxCalendarPage />);
    await screen.findByDisplayValue(/52\.374/);
    await typeInto(screen.getByDisplayValue(/52\.374/), '49799');
    await click(button('Guardar UVT'));
    const call = await waitForCall(api, 'POST', /^\/tax\/parameters$/);
    expect(call.body).toMatchObject({ key: 'UVT', value: 49799 });
    expect(String(call.body.year)).toMatch(/^\d{4}$/);
    await expectToast('success', 'UVT guardada.');
  });

  it('crear una fecha exige título y vencimiento y envía el año', async () => {
    await renderPage(<TaxCalendarPage />);
    await screen.findByText('Declaración de IVA - Bimestre 1');
    await click(button('Nueva fecha'));
    expect(await screen.findByText(/Nueva fecha ·/)).toBeInTheDocument();
    await click(button('Guardar'));
    await expectToast('error', 'Completa título y fecha.');
    expect(api.count('POST', /^\/tax\/deadlines$/)).toBe(0);
    await typeInto(placeholder('Ej: Declaración de IVA - Bimestre 1'), 'Retención enero');
    await typeInto(document.querySelector('.fixed input[type="date"]'), '2026-02-10');
    await click(button('Guardar'));
    const call = await waitForCall(api, 'POST', /^\/tax\/deadlines$/);
    expect(call.body).toMatchObject({ obligation: 'IVA', title: 'Retención enero', dueDate: '2026-02-10' });
    expect(String(call.body.year)).toMatch(/^\d{4}$/);
    await waitForCall(api, 'GET', /^\/tax\/deadlines$/, { count: 2 });
  });

  it('editar precarga la fila y guarda con PATCH', async () => {
    await renderPage(<TaxCalendarPage />);
    await screen.findByText('Declaración de IVA - Bimestre 1');
    await click(rowButton('Declaración de IVA - Bimestre 1', 'Editar'));
    expect(await screen.findByText(/Editar fecha ·/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Declaración de IVA - Bimestre 1')).toBeInTheDocument();
    await typeInto(screen.getByDisplayValue('Declaración de IVA - Bimestre 1'), 'IVA Bimestre 1 (ajustada)');
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PATCH', /^\/tax\/deadlines\/1$/);
    expect(call.body).toMatchObject({ title: 'IVA Bimestre 1 (ajustada)', obligation: 'IVA', dueDate: '2026-03-10' });
  });

  it('eliminar pide confirmación y borra', async () => {
    await renderPage(<TaxCalendarPage />);
    await screen.findByText('Declaración de IVA - Bimestre 1');
    await click(rowButton('Declaración de IVA - Bimestre 1', 'Eliminar'));
    expect(await screen.findByText('Eliminar fecha')).toBeInTheDocument();
    await click(button('Cancelar'));
    expect(api.count('DELETE', /^\/tax\/deadlines\/\d+$/)).toBe(0);
    await click(rowButton('Declaración de IVA - Bimestre 1', 'Eliminar'));
    const modal = within(screen.getByText('Eliminar fecha').closest('.fixed'));
    await click(modal.getByRole('button', { name: 'Eliminar' }));
    await waitForCall(api, 'DELETE', /^\/tax\/deadlines\/1$/);
    await waitForCall(api, 'GET', /^\/tax\/deadlines$/, { count: 2 });
  });

  it('si el backend rechaza el guardado, se avisa', async () => {
    api.set('POST', /^\/tax\/deadlines$/, fail(400, 'Fecha duplicada'));
    await renderPage(<TaxCalendarPage />);
    await screen.findByText('Declaración de IVA - Bimestre 1');
    await click(button('Nueva fecha'));
    await screen.findByText(/Nueva fecha ·/);
    await typeInto(placeholder('Ej: Declaración de IVA - Bimestre 1'), 'Repetida');
    await typeInto(document.querySelector('.fixed input[type="date"]'), '2026-02-10');
    await click(button('Guardar'));
    await expectToast('error', 'Fecha duplicada');
  });

  it('solo el administrador de plataforma entra', async () => {
    vi.restoreAllMocks();
    resetBehavior({ role: 'SUPER_ADMIN' });
    taxApi();
    await renderPage(<TaxCalendarPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
