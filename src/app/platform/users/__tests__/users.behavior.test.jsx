import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  ok,
  fail,
  list,
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
  rowButton,
  queryRowButton,
  waitForCall,
  router,
} from '@/test/behaviorHarness';
import UsersPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const LIST_RE = /^\/users\/platform\/all$/;
const USERS = [
  { id: 11, name: 'Carlos Pérez', email: 'carlos@uno.test', role: 'ADMIN', status: 'ACTIVO', company: { name: 'NEGOCIO UNO' }, local: { name: 'Sede Centro' } },
  { id: 12, name: 'Plataforma Root', email: 'root@pegazo.co', role: 'SUPER_PLATFORM_ADMIN', status: 'ACTIVO', company: null, local: null },
];

function usersApi() {
  return installApi([
    on('GET', LIST_RE, list(USERS, { total: 30, limit: 20 })),
    on('PATCH', /^\/users\/platform\/\d+\/status$/, ok({ id: 11 })),
    on('PATCH', /^\/users\/platform\/\d+\/reset-password$/, ok({ id: 11 })),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · Usuarios globales', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = usersApi();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista los usuarios; los de plataforma no tienen acciones', async () => {
    await renderPage(<UsersPage />);
    await settle(350);
    const call = await waitForCall(api, 'GET', LIST_RE);
    expect(call.query).toMatchObject({ page: '1', limit: '20' });
    expect(await screen.findByText('Carlos Pérez')).toBeInTheDocument();
    expect(screen.getByText('NEGOCIO UNO')).toBeInTheDocument();
    expect(screen.getByText('Sede Centro')).toBeInTheDocument();
    expect(rowButton('Carlos Pérez', 'Resetear contraseña')).toBeInTheDocument();
    expect(rowButton('Carlos Pérez', 'Desactivar')).toBeInTheDocument();
    expect(queryRowButton('Plataforma Root', 'Desactivar')).toBeNull();
    expect(queryRowButton('Plataforma Root', 'Resetear contraseña')).toBeNull();
  });

  it('buscar por nombre viaja en la consulta y la paginación avanza', async () => {
    await renderPage(<UsersPage />);
    await settle(350);
    await waitForCall(api, 'GET', LIST_RE);
    await typeInto(placeholder('Buscar por nombre...'), 'car');
    await settle(350);
    await waitFor(() => expect(api.last('GET', LIST_RE).query.name).toBe('car'));
    expect(await screen.findByText(/Página 1 de 2/)).toBeInTheDocument();
    await click(button('Siguiente'));
    await settle(350);
    await waitFor(() => expect(api.last('GET', LIST_RE).query.page).toBe('2'));
  });

  it('desactivar pide confirmación y cambia el estado', async () => {
    window.confirm.mockReturnValueOnce(false);
    await renderPage(<UsersPage />);
    await settle(350);
    await screen.findByText('Carlos Pérez');
    await click(rowButton('Carlos Pérez', 'Desactivar'));
    expect(api.count('PATCH', /status$/)).toBe(0);
    await click(rowButton('Carlos Pérez', 'Desactivar'));
    const call = await waitForCall(api, 'PATCH', /^\/users\/platform\/11\/status$/);
    expect(call.body).toEqual({ status: 'INACTIVO' });
    expect(await screen.findByText('Usuario desactivado.')).toBeInTheDocument();
    expect(rowButton('Carlos Pérez', 'Activar')).toBeInTheDocument();
  });

  it('si el backend rechaza el cambio de estado, se avisa', async () => {
    api.set('PATCH', /^\/users\/platform\/\d+\/status$/, fail(400, 'Usuario protegido'));
    await renderPage(<UsersPage />);
    await settle(350);
    await screen.findByText('Carlos Pérez');
    await click(rowButton('Carlos Pérez', 'Desactivar'));
    expect(await screen.findByText('Usuario protegido')).toBeInTheDocument();
  });

  it('resetear contraseña valida el mínimo y envía la nueva clave', async () => {
    await renderPage(<UsersPage />);
    await settle(350);
    await screen.findByText('Carlos Pérez');
    await click(rowButton('Carlos Pérez', 'Resetear contraseña'));
    expect(await screen.findByText('Resetear contraseña', { selector: 'h2' })).toBeInTheDocument();
    await typeInto(placeholder('Mínimo 6 caracteres'), '123');
    await click(button('Guardar contraseña'));
    expect(await screen.findByText('La contraseña debe tener al menos 6 caracteres.')).toBeInTheDocument();
    expect(api.count('PATCH', /reset-password$/)).toBe(0);
    await typeInto(placeholder('Mínimo 6 caracteres'), 'secreto1');
    await click(button('Guardar contraseña'));
    const call = await waitForCall(api, 'PATCH', /^\/users\/platform\/11\/reset-password$/);
    expect(call.body).toEqual({ password: 'secreto1' });
    expect(await screen.findByText('Contraseña actualizada para Carlos Pérez.')).toBeInTheDocument();
    expect(screen.queryByText('Resetear contraseña', { selector: 'h2' })).toBeNull();
  });

  it('cancelar el reseteo cierra el modal sin enviar', async () => {
    await renderPage(<UsersPage />);
    await settle(350);
    await screen.findByText('Carlos Pérez');
    await click(rowButton('Carlos Pérez', 'Resetear contraseña'));
    await screen.findByText('Resetear contraseña', { selector: 'h2' });
    await click(button('Cancelar'));
    expect(screen.queryByText('Resetear contraseña', { selector: 'h2' })).toBeNull();
    expect(api.count('PATCH', /reset-password$/)).toBe(0);
  });

  it('solo el administrador de plataforma entra', async () => {
    vi.restoreAllMocks();
    resetBehavior({ role: 'SUPER_ADMIN' });
    usersApi();
    await renderPage(<UsersPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
