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
  authActions,
  money,
} from '@/test/behaviorHarness';
import BankPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const DEPOSITS = [
  { id: 1, amount: 150000, senderName: 'ANA PÉREZ', reference: 'REF123', seen: false, createdAt: '2026-02-10T10:00:00.000Z' },
  { id: 2, amount: 80000, senderName: '', reference: '', seen: true, createdAt: '2026-02-09T10:00:00.000Z' },
];

function bankApi({ enabled = true } = {}) {
  return installApi([
    on('GET', /^\/bank\/status$/, ok({ enabled, token: enabled ? 'tok123' : null, identifier: 'MI TIENDA', email: 'pagos@tienda.com' })),
    on('GET', /^\/bank\/deposits$/, ok(DEPOSITS)),
    on('POST', /^\/bank\/enable$/, (c) => ok({ enabled: true, token: c.body?.token || 'tok999' })),
    on('POST', /^\/bank\/disable$/, ok({ enabled: false, token: 'tok123' })),
    on('POST', /^\/bank\/regenerate$/, ok({ enabled: true, token: 'tokNEW' })),
    on('PATCH', /^\/bank\/config$/, ok({})),
    on('DELETE', /^\/bank\/deposits\/all$/, ok()),
    on('DELETE', /^\/bank\/deposits\/\d+$/, ok()),
    ...baseRoutes(),
  ]);
}

describe('Banco · consignaciones por SMS', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = bankApi();
    window.confirm = vi.fn(() => true);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga el estado y las últimas consignaciones', async () => {
    await renderPage(<BankPage />);
    await waitForCall(api, 'GET', /^\/bank\/status$/);
    await waitForCall(api, 'GET', /^\/bank\/deposits$/);
    expect(await screen.findByText('Últimas consignaciones')).toBeInTheDocument();
    expect(screen.getAllByText(money(150000)).length).toBeGreaterThan(0);
    expect(screen.getByText(/ANA PÉREZ/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument();
    expect(screen.getByDisplayValue(/\/bank\/sms\/tok123/)).toBeInTheDocument();
  });

  it('desactivar y activar llaman al backend y sincronizan la sesión', async () => {
    await renderPage(<BankPage />);
    await screen.findByRole('button', { name: 'Desactivar' });
    await click(button('Desactivar'));
    await waitForCall(api, 'POST', /^\/bank\/disable$/);
    expect(authActions.setUsuario).toHaveBeenCalled();
    const btn = await screen.findByRole('button', { name: 'Activar' });
    await click(btn);
    await waitForCall(api, 'POST', /^\/bank\/enable$/);
    await screen.findByRole('button', { name: 'Desactivar' });
  });

  it('guarda el correo y el identificador del banco', async () => {
    await renderPage(<BankPage />);
    await screen.findByRole('button', { name: 'Desactivar' });
    await typeInto(placeholder('tucorreo@gmail.com'), 'nuevo@tienda.com');
    await typeInto(placeholder('Nombre en el banco y/o @llave (separados por coma)'), 'MI TIENDA, @mitienda');
    await click(screen.getAllByRole('button', { name: /Guardar/ })[0]);
    const call = await waitForCall(api, 'PATCH', /^\/bank\/config$/);
    expect(call.body).toEqual({ identifier: 'MI TIENDA, @mitienda', email: 'nuevo@tienda.com' });
    await expectToast('success', 'Configuración guardada');
  });

  it('usar el enlace de otra empresa extrae el token y activa con él', async () => {
    await renderPage(<BankPage />);
    await screen.findByRole('button', { name: 'Desactivar' });
    await typeInto(placeholder('Pega el enlace de la otra empresa'), 'https://api.pegazo.co/bank/sms/tokSHARED');
    await click(screen.getByRole('button', { name: /Usar|Aplicar|Vincular/ }));
    const call = await waitForCall(api, 'POST', /^\/bank\/enable$/);
    expect(call.body.token).toBe('tokSHARED');
    await expectToast('success', 'Enlace compartido aplicado');
  });

  it('regenerar el enlace pide confirmación y cambia el token', async () => {
    await renderPage(<BankPage />);
    await screen.findByRole('button', { name: 'Desactivar' });
    await click(screen.getByRole('button', { name: /Generar|Regenerar|nuevo enlace/i }));
    expect(window.confirm).toHaveBeenCalledTimes(1);
    await waitForCall(api, 'POST', /^\/bank\/regenerate$/);
    expect(await screen.findByDisplayValue(/\/bank\/sms\/tokNEW/)).toBeInTheDocument();
  });

  it('copiar el enlace usa el portapapeles y avisa', async () => {
    await renderPage(<BankPage />);
    await screen.findByRole('button', { name: 'Desactivar' });
    await click(screen.getByRole('button', { name: /Copiar/ }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/bank/sms/tok123'));
    await expectToast('success', 'Enlace copiado');
  });

  it('eliminar un registro y borrar todo el historial piden confirmación', async () => {
    await renderPage(<BankPage />);
    await screen.findByText('Últimas consignaciones');
    await click(screen.getAllByTitle('Eliminar registro')[0]);
    const confirm1 = screen.getByText('¿Eliminar este registro?').closest('.fixed');
    await click(within(confirm1).getByRole('button', { name: 'Eliminar' }));
    await waitForCall(api, 'DELETE', /^\/bank\/deposits\/1$/);
    await waitFor(() => expect(screen.queryByText(/ANA PÉREZ/)).toBeNull());

    await click(screen.getByRole('button', { name: /Borrar todo|Borrar historial|Limpiar/ }));
    const confirm2 = screen.getByText('¿Borrar todo el historial?').closest('.fixed');
    await click(within(confirm2).getByRole('button', { name: 'Borrar todo' }));
    await waitForCall(api, 'DELETE', /^\/bank\/deposits\/all$/);
    await waitFor(() => expect(screen.queryByText(money(80000))).toBeNull());
  });

  it('sin activar, muestra el botón Activar y no el enlace', async () => {
    api = bankApi({ enabled: false });
    await renderPage(<BankPage />);
    expect(await screen.findByRole('button', { name: 'Activar' })).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/\/bank\/sms\//)).toBeNull();
  });

  it('un error del backend al guardar se avisa', async () => {
    api.set('PATCH', /^\/bank\/config$/, fail(400, 'Correo inválido'));
    await renderPage(<BankPage />);
    await screen.findByRole('button', { name: 'Desactivar' });
    await click(screen.getAllByRole('button', { name: /Guardar/ })[0]);
    await waitForCall(api, 'PATCH', /^\/bank\/config$/);
    await expectToast('error', 'Correo inválido');
  });

  it('el barbero no entra a banco', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    bankApi();
    await renderPage(<BankPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
