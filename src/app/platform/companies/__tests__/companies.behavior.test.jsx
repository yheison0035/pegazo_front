import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi,
  on,
  ok,
  fail,
  list,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  waitFor,
  click,
  typeInto,
  button,
  buttons,
  rowButton,
  queryRowButton,
  waitForCall,
  expectToast,
  router,
} from '@/test/behaviorHarness';
import CompaniesPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const LIST_RE = /^\/companies$/;
const COMPANIES = [
  { id: 1, name: 'NEGOCIO UNO', type: 'COMERCIO', manager: 'ANA', adminEmail: 'ana@uno.test', phone: '3000000000', status: 'ACTIVO', plan: 'ORBITA', domain: '', startDate: '2026-01-15', paidUntil: '2026-03-15', logo: '' },
  { id: 2, name: 'NEGOCIO DOS', type: 'BARBERIA', manager: 'LUIS', adminEmail: 'luis@dos.test', phone: '3000000001', status: 'INACTIVO', plan: 'ORBITA', domain: '', startDate: '2026-01-10', paidUntil: '2026-02-10', logo: '' },
];

function companiesApi() {
  return installApi([
    on('GET', LIST_RE, list(COMPANIES)),
    on('PATCH', /^\/companies\/\d+\/status$/, ok({ id: 1 })),
    on('DELETE', /^\/companies\/\d+$/, ok({ id: 1 })),
    on('POST', /^\/auth\/impersonate\/\d+$/, ok({ access_token: 'tok-imp', user: { id: 5, role: 'SUPER_ADMIN', name: 'Ana' } })),
    on('GET', /^\/auth\/me$/, ok({ id: 5, role: 'SUPER_ADMIN', name: 'Ana', company: { id: 1 } })),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · Empresas', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = companiesApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista las empresas con sus acciones según el estado', async () => {
    await renderPage(<CompaniesPage />);
    const call = await waitForCall(api, 'GET', LIST_RE);
    expect(call.query).toMatchObject({ page: '1', limit: '10' });
    expect(await screen.findByText('NEGOCIO UNO')).toBeInTheDocument();
    expect(screen.getByText('NEGOCIO DOS')).toBeInTheDocument();
    expect(rowButton('NEGOCIO UNO', 'Ver panel de la empresa')).toHaveAttribute('href', '/platform/companies/1');
    expect(rowButton('NEGOCIO UNO', 'Editar')).toHaveAttribute('href', '/platform/companies/edit/1');
    expect(rowButton('NEGOCIO UNO', 'Desactivar (suspender)')).toBeInTheDocument();
    expect(rowButton('NEGOCIO UNO', 'Entrar como esta empresa')).toBeInTheDocument();
    expect(rowButton('NEGOCIO DOS', 'Activar')).toBeInTheDocument();
    expect(queryRowButton('NEGOCIO DOS', 'Entrar como esta empresa')).toBeNull();
    expect(screen.getByRole('link', { name: /Crear empresa/ })).toHaveAttribute('href', '/platform/companies/new');
  });

  it('filtrar por nombre viaja en la consulta', async () => {
    await renderPage(<CompaniesPage />);
    await waitForCall(api, 'GET', LIST_RE);
    const input = document.querySelector('tr.crm-filters input[name="name"]');
    await typeInto(input, 'ZZ');
    await waitFor(() => expect(api.last('GET', LIST_RE).query.name).toBe('ZZ'));
  });

  it('paginación: siguiente página', async () => {
    api.set('GET', LIST_RE, list(COMPANIES, { total: 25, limit: 10 }));
    await renderPage(<CompaniesPage />);
    await waitForCall(api, 'GET', LIST_RE);
    await click(buttons('→')[0]);
    const call = await waitForCall(api, 'GET', LIST_RE, { count: 2 });
    expect(call.query.page).toBe('2');
  });

  it('desactivar pide confirmación, cambia el estado y recarga', async () => {
    await renderPage(<CompaniesPage />);
    await screen.findByText('NEGOCIO UNO');
    await click(rowButton('NEGOCIO UNO', 'Desactivar (suspender)'));
    expect(await screen.findByText('¿Desactivar empresa?')).toBeInTheDocument();
    await click(button('Cancelar'));
    expect(api.count('PATCH', /status$/)).toBe(0);
    await click(rowButton('NEGOCIO UNO', 'Desactivar (suspender)'));
    await click(button('Desactivar'));
    const call = await waitForCall(api, 'PATCH', /^\/companies\/1\/status$/);
    expect(call.body).toEqual({ status: 'INACTIVO' });
    await expectToast('success', 'Empresa desactivada');
    await waitForCall(api, 'GET', LIST_RE, { count: 2 });
  });

  it('reactivar una empresa inactiva', async () => {
    await renderPage(<CompaniesPage />);
    await screen.findByText('NEGOCIO DOS');
    await click(rowButton('NEGOCIO DOS', 'Activar'));
    expect(await screen.findByText('¿Reactivar empresa?')).toBeInTheDocument();
    await click(button('Reactivar'));
    const call = await waitForCall(api, 'PATCH', /^\/companies\/2\/status$/);
    expect(call.body).toEqual({ status: 'ACTIVO' });
    await expectToast('success', 'Empresa activada');
  });

  it('si el backend rechaza el cambio de estado, se avisa', async () => {
    api.set('PATCH', /^\/companies\/\d+\/status$/, fail(400, 'Empresa bloqueada'));
    await renderPage(<CompaniesPage />);
    await screen.findByText('NEGOCIO UNO');
    await click(rowButton('NEGOCIO UNO', 'Desactivar (suspender)'));
    await click(button('Desactivar'));
    await expectToast('error', 'Empresa bloqueada');
  });

  it('"Entrar como esta empresa" impersona y guarda el token del dueño', async () => {
    await renderPage(<CompaniesPage />);
    await screen.findByText('NEGOCIO UNO');
    await click(rowButton('NEGOCIO UNO', 'Entrar como esta empresa'));
    await waitForCall(api, 'POST', /^\/auth\/impersonate\/1$/);
    await waitFor(() => expect(localStorage.getItem('token')).toBe('tok-imp'));
  });

  it('eliminar pide confirmación y borra', async () => {
    await renderPage(<CompaniesPage />);
    await screen.findByText('NEGOCIO UNO');
    await click(rowButton('NEGOCIO UNO', 'Eliminar'));
    const modal = within(screen.getByText('Confirmar eliminación').parentElement);
    expect(modal.getByText(/NEGOCIO UNO/)).toBeInTheDocument();
    await click(modal.getByRole('button', { name: 'Eliminar' }));
    await waitForCall(api, 'DELETE', /^\/companies\/1$/);
    await waitForCall(api, 'GET', LIST_RE, { count: 2 });
  });

  it('solo el administrador de plataforma entra', async () => {
    for (const role of ['SUPER_ADMIN', 'CAJA']) {
      vi.restoreAllMocks();
      resetBehavior({ role });
      companiesApi();
      await renderPage(<CompaniesPage />);
      expect(router.push).toHaveBeenCalledWith('/dashboard');
    }
  });
});
