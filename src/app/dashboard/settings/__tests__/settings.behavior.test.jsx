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
  authActions,
  router,
} from '@/test/behaviorHarness';
import SettingsPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const SETTINGS = {
  name: 'Negocio Prueba',
  logo: '',
  phone: '3001112233',
  email: 'hola@negocio.test',
  nit: '901555444',
  openHour: 9,
  closeHour: 20,
  businessName: 'NEGOCIO PRUEBA SAS',
  responsableIVA: false,
  preciosIncluyenIVA: true,
  defaultTaxRate: 19,
  requireCashOpen: false,
  accountingEnabled: true,
  accountingBasis: 'ACCRUAL',
  booksClosedUntil: null,
  mailConfigured: false,
  mailFromName: '',
  mailHost: '',
  mailPort: null,
  mailUser: '',
  mailFromEmail: '',
  terminology: null,
  loyaltyEnabled: true,
  loyaltyTier1Visits: 4,
  loyaltyTier1Percent: 10,
  loyaltyTier2Visits: 8,
  loyaltyTier2Percent: 20,
  loyaltyMaxDays: 25,
};

function settingsApi(overrides = {}) {
  return installApi([
    on('GET', /^\/company\/settings$/, ok({ ...SETTINGS, ...overrides })),
    on('PATCH', /^\/company\/profile$/, ok({})),
    on('PATCH', /^\/company\/hours$/, ok({})),
    on('PATCH', /^\/company\/fiscal$/, ok({})),
    on('PATCH', /^\/company\/mail$/, ok({ mailConfigured: true })),
    on('POST', /^\/company\/mail\/test$/, { success: true, message: 'Correo de prueba enviado a prueba@correo.com.' }),
    on('PATCH', /^\/company\/cash-policy$/, ok({})),
    on('PATCH', /^\/company\/accounting-enabled$/, ok({})),
    on('PATCH', /^\/company\/accounting-basis$/, ok({})),
    on('PATCH', /^\/company\/books-close$/, ok({})),
    on('PATCH', /^\/company\/theme$/, ok({})),
    on('PATCH', /^\/company\/font$/, ok({})),
    on('PATCH', /^\/company\/loyalty$/, ok({})),
    on('GET', /^\/accountant\/link$/, ok([{ accountantId: 5, name: 'Contador Pérez', email: 'cont@firma.com', accountantKey: 'PZ-6RLE2A6U' }])),
    on('POST', /^\/accountant\/link$/, ok({ name: 'Contadora Ruiz' })),
    on('DELETE', /^\/accountant\/link\/\d+$/, ok()),
    ...baseRoutes(),
  ]);
}

async function openSettings(api, tab) {
  await renderPage(<SettingsPage />);
  await waitForCall(api, 'GET', /^\/company\/settings$/);
  await settle();
  if (tab) await click(button(tab));
  await settle();
}

describe('Ajustes · Mi empresa', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = settingsApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('precarga los datos de la empresa y guarda nombre/teléfono/correo con PATCH /company/profile', async () => {
    await openSettings(api);
    const name = await screen.findByDisplayValue('Negocio Prueba');
    await typeInto(name, 'Negocio Prueba Renovado');
    await typeInto(screen.getByDisplayValue('3001112233'), '3009998877');
    const card = name.closest('section') || name.closest('div.rounded-2xl') || name.parentElement.parentElement;
    await click(within(card).getAllByRole('button', { name: /Guardar/ })[0]);
    const call = await waitForCall(api, 'PATCH', /^\/company\/profile$/);
    expect(call.body).toMatchObject({ name: 'Negocio Prueba Renovado', phone: '3009998877', email: 'hola@negocio.test' });
    await expectToast('success', 'Datos de la empresa actualizados');
  });

  it('guarda el horario de atención (negocios de servicios, pestaña Citas)', async () => {
    resetBehavior({ type: 'BARBERIA' });
    api = settingsApi();
    await openSettings(api, 'Citas y fidelización');
    const abre = (await screen.findAllByRole('combobox')).find((s) => s.value === '9');
    await typeInto(abre, '8');
    const card = abre.closest('div.rounded-2xl');
    await click(within(card).getByRole('button', { name: /Guardar/ }));
    const call = await waitForCall(api, 'PATCH', /^\/company\/hours$/);
    expect(call.body).toEqual({ openHour: 8, closeHour: 20 });
    await expectToast('success', 'Horario actualizado');
  });

  // Nota: la tarjeta "Correo del negocio" (MailCard) existe en el código pero no
  // se monta en ninguna pestaña, así que no hay acción visible que probar.

  it('un error del backend al guardar la empresa se avisa', async () => {
    api.set('PATCH', /^\/company\/profile$/, fail(400, 'Teléfono inválido'));
    await openSettings(api);
    const name = await screen.findByDisplayValue('Negocio Prueba');
    const card = name.closest('section') || name.closest('div.rounded-2xl') || name.parentElement.parentElement;
    await click(within(card).getAllByRole('button', { name: /Guardar/ })[0]);
    await waitForCall(api, 'PATCH', /^\/company\/profile$/);
    await expectToast('error', 'Teléfono inválido');
  });
});

describe('Ajustes · Apariencia, ventas, impuestos', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = settingsApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('cambiar tema y fuente guarda y actualiza la sesión', async () => {
    await openSettings(api, 'Apariencia');
    const themeButtons = screen.getAllByRole('button').filter((b) => /tema|Tema/.test(b.textContent) === false && b.closest('section'));
    // Hay tarjetas de tema y de fuente: cualquier opción distinta a la actual dispara el PATCH.
    const candidates = screen.getAllByRole('button').filter((b) => !/Guardar|Apariencia|Mi empresa|Ventas|Impuestos|Contabilidad|Fidelización|Citas/.test(b.textContent) && b.textContent.trim());
    let patched = 0;
    for (const b of candidates) {
      await click(b);
      if (api.count('PATCH', /^\/company\/(theme|font)$/) > patched) {
        patched = api.count('PATCH', /^\/company\/(theme|font)$/);
      }
      if (api.count('PATCH', /^\/company\/theme$/) >= 1 && api.count('PATCH', /^\/company\/font$/) >= 1) break;
    }
    expect(api.count('PATCH', /^\/company\/theme$/)).toBeGreaterThanOrEqual(1);
    expect(api.count('PATCH', /^\/company\/font$/)).toBeGreaterThanOrEqual(1);
    expect(api.last('PATCH', /^\/company\/theme$/).body).toHaveProperty('theme');
    expect(api.last('PATCH', /^\/company\/font$/).body).toHaveProperty('font');
    expect(authActions.setUsuario).toHaveBeenCalled();
    expect(themeButtons.length).toBeGreaterThanOrEqual(0);
  });

  it('la política "exigir caja abierta para vender" se guarda y queda en la sesión', async () => {
    await openSettings(api, 'Ventas y caja');
    const toggle = document.querySelector('input[type="checkbox"]');
    expect(toggle.checked).toBe(false);
    await click(toggle);
    const call = await waitForCall(api, 'PATCH', /^\/company\/cash-policy$/);
    expect(call.body).toEqual({ requireCashOpen: true });
    await expectToast('success', 'Preferencia guardada');
    expect(authActions.setUsuario).toHaveBeenCalled();
    expect(authActions.setUsuario.mock.calls.pop()[0].company.requireCashOpen).toBe(true);
  });

  it('la configuración fiscal guarda responsable de IVA, tarifa y razón social', async () => {
    await openSettings(api, 'Impuestos');
    const legal = await screen.findByPlaceholderText('Nombre legal de la empresa');
    expect(legal.value).toBe('NEGOCIO PRUEBA SAS');
    const checks = document.querySelectorAll('input[type="checkbox"]');
    await click(checks[0]); // responsable de IVA → true
    await typeInto(legal, 'NEGOCIO PRUEBA S.A.S.');
    const card = legal.closest('section') || legal.closest('div.rounded-2xl');
    await click(within(card).getByRole('button', { name: /Guardar/ }));
    const call = await waitForCall(api, 'PATCH', /^\/company\/fiscal$/);
    expect(call.body).toEqual({ responsableIVA: true, preciosIncluyenIVA: true, defaultTaxRate: 19, businessName: 'NEGOCIO PRUEBA S.A.S.' });
    await expectToast('success', 'Configuración fiscal guardada');
  });
});

describe('Ajustes · Contabilidad y contador', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = settingsApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('apagar/encender la contabilidad usa PATCH /company/accounting-enabled y actualiza la sesión', async () => {
    await openSettings(api, 'Contabilidad');
    const sw = await screen.findByRole('switch');
    expect(sw.getAttribute('aria-checked')).toBe('true');
    await click(sw);
    const call = await waitForCall(api, 'PATCH', /^\/company\/accounting-enabled$/);
    expect(call.body).toEqual({ enabled: false });
    expect(authActions.setUsuario.mock.calls.pop()[0].company.accountingEnabled).toBe(false);
  });

  it('la base contable cambia entre caja y causación', async () => {
    await openSettings(api, 'Contabilidad');
    await click(await screen.findByText('Base caja'));
    const call = await waitForCall(api, 'PATCH', /^\/company\/accounting-basis$/);
    expect(call.body).toEqual({ basis: 'CASH' });
    expect(authActions.setUsuario.mock.calls.pop()[0].company.accountingBasis).toBe('CASH');
  });

  it('cerrar el periodo contable envía la fecha y actualiza la sesión', async () => {
    await openSettings(api, 'Contabilidad');
    const date = await waitFor(() => document.querySelector('input[type="date"]'));
    await typeInto(date, '2026-01-31');
    await click(button(/Cerrar periodo/));
    const call = await waitForCall(api, 'PATCH', /^\/company\/books-close$/);
    expect(call.body).toEqual({ date: '2026-01-31' });
    expect(String(authActions.setUsuario.mock.calls.pop()[0].company.booksClosedUntil)).toMatch(/^2026-01-31/);
  });

  it('con un cierre vigente, "Reabrir" envía null', async () => {
    // El botón sale cuando la SESIÓN ya tiene un cierre vigente.
    resetBehavior({ company: { booksClosedUntil: '2026-01-31T00:00:00.000Z' } });
    api = settingsApi({ booksClosedUntil: '2026-01-31T00:00:00.000Z' });
    await openSettings(api, 'Contabilidad');
    await click(await screen.findByRole('button', { name: /Reabrir/ }));
    const call = await waitForCall(api, 'PATCH', /^\/company\/books-close$/);
    expect(call.body).toEqual({ date: null });
  });

  it('vincula un contador con su clave y lo puede quitar', async () => {
    await openSettings(api, 'Contabilidad');
    await waitForCall(api, 'GET', /^\/accountant\/link$/);
    expect(await screen.findByText('Contador Pérez')).toBeInTheDocument();
    await typeInto(placeholder('Ej: PZ-6RLE2A6U'), 'pz-nueva1');
    const card = placeholder('Ej: PZ-6RLE2A6U').closest('section') || placeholder('Ej: PZ-6RLE2A6U').closest('div.rounded-2xl');
    await click(within(card).getByRole('button', { name: /Vincular|Enlazar|Conectar/ }));
    const call = await waitForCall(api, 'POST', /^\/accountant\/link$/);
    expect(call.body.key).toMatch(/PZ-NUEVA1|pz-nueva1/);
    await expectToast('success', 'Enlazado con Contadora Ruiz');
    await waitForCall(api, 'GET', /^\/accountant\/link$/, { count: 2 });
    await click(screen.getByTitle('Quitar'));
    await waitForCall(api, 'DELETE', /^\/accountant\/link\/5$/);
  });

  it('si la clave del contador es inválida, se avisa', async () => {
    api.set('POST', /^\/accountant\/link$/, fail(404, 'Clave de contador no encontrada'));
    await openSettings(api, 'Contabilidad');
    await waitForCall(api, 'GET', /^\/accountant\/link$/);
    await typeInto(await screen.findByPlaceholderText('Ej: PZ-6RLE2A6U'), 'PZ-MALA');
    const card = placeholder('Ej: PZ-6RLE2A6U').closest('section') || placeholder('Ej: PZ-6RLE2A6U').closest('div.rounded-2xl');
    await click(within(card).getByRole('button', { name: /Vincular|Enlazar|Conectar/ }));
    await expectToast('error', 'Clave de contador no encontrada');
  });
});

describe('Ajustes · Fidelización y acceso', () => {
  afterEach(() => vi.restoreAllMocks());

  it('guarda la configuración de fidelización con visitas y porcentajes numéricos', async () => {
    resetBehavior({ type: 'BARBERIA' });
    const api = settingsApi();
    await openSettings(api, 'Citas y fidelización');
    const numbers = await waitFor(() => {
      const n = document.querySelectorAll('input[type="number"]');
      expect(n.length).toBeGreaterThanOrEqual(5);
      return n;
    });
    await typeInto(numbers[0], '5');
    await typeInto(numbers[1], '15');
    const card = numbers[0].closest('div.rounded-2xl');
    await click(within(card).getByRole('button', { name: /Guardar/ }));
    const call = await waitForCall(api, 'PATCH', /^\/company\/loyalty$/);
    expect(call.body).toMatchObject({ loyaltyEnabled: true, loyaltyTier1Visits: 5, loyaltyTier1Percent: 15, loyaltyTier2Visits: 8, loyaltyTier2Percent: 20, loyaltyMaxDays: 25 });
    await expectToast('success', 'Fidelización actualizada');
  });

  it('el barbero no entra a ajustes', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    settingsApi();
    await renderPage(<SettingsPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
