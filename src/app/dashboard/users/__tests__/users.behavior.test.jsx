import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  list,
  detail,
  ok,
  baseRoutes,
  resetBehavior,
  renderPage,
  settle,
  screen,
  waitFor,
  setField,
  pickDepartmentAndCity,
  waitForCall,
  expectToast,
  submitForm,
  authState,
} from '@/test/behaviorHarness';
import { describeCatalogList } from '@/test/catalogBehavior';
import UsersPage from '../page';
import NewUserPage from '../new/page';
import EditUserPage from '../edit/[id]/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const USERS = [
  { id: 2, name: 'CARLA VENDEDORA', email: 'carla@prueba.test', phone: '3001112233', address: 'Calle 1', birthdate: '1995-05-10T00:00:00.000Z', document: '1002', department: 'cundinamarca', city: 'bogota', role: 'ASESOR', localId: 1, local: { id: 1, name: 'Sede Centro' }, status: 'ACTIVO', position: '', salary: null, createdAt: '2026-01-01T10:00:00.000Z' },
  { id: 3, name: 'PEDRO CAJA', email: 'pedro@prueba.test', phone: '3002223344', address: 'Calle 2', birthdate: '1990-01-01T00:00:00.000Z', document: '1003', department: 'cundinamarca', city: 'bogota', role: 'CAJA', localId: 1, local: { id: 1, name: 'Sede Centro' }, status: 'ACTIVO', position: '', salary: null, createdAt: '2026-01-02T10:00:00.000Z' },
];
const ROLES = ok([
  { id: 'ADMIN', name: 'ADMIN' },
  { id: 'ASESOR', name: 'ASESOR' },
  { id: 'CAJA', name: 'CAJA' },
  { id: 'BODEGUERO', name: 'BODEGUERO' },
  { id: 'RECEPCIONISTA', name: 'RECEPCIONISTA' },
  { id: 'CONTADOR', name: 'CONTADOR' },
]);

describeCatalogList({
  title: 'Usuarios',
  Page: UsersPage,
  base: '/users',
  rows: USERS,
  rowText: 'CARLA VENDEDORA',
  secondRowText: 'PEDRO CAJA',
  filterPlaceholder: 'Filtrar Nombre Completo',
  filterKey: 'name',
  heading: 'Listado de Usuarios',
  viewTitle: 'Detalles del Usuario',
  blockedRoles: ['BARBERO'],
  extraRoutes: [on('GET', /^\/enums\/roles$/, ROLES)],
});

describe('Usuarios · crear y editar', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    authState.params = { id: '2' };
    api = installApi([
      on('GET', /^\/users$/, list(USERS)),
      on('GET', /^\/users\/\d+$/, detail(USERS[0])),
      on('POST', /^\/users$/, ok({ id: 9 })),
      on('PUT', /^\/users\/\d+$/, ok({ id: 2 })),
      on('GET', /^\/enums\/roles$/, ROLES),
      ...baseRoutes().filter((r) => !/users\$/.test(String(r.path))),
    ]);
  });
  afterEach(() => vi.restoreAllMocks());

  it('ofrece solo los roles de la vertical (más contador) y crea el usuario con contraseña', async () => {
    await renderPage(<NewUserPage />);
    await waitForCall(api, 'GET', /^\/enums\/roles$/);
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    const roleSelect = document.querySelector('[name="role"]');
    const offered = [...roleSelect.options].map((o) => o.value).filter(Boolean);
    expect(offered).toEqual(expect.arrayContaining(['ADMIN', 'ASESOR', 'CAJA', 'CONTADOR']));
    expect(offered).not.toContain('BARBERO');

    setField('role', 'ASESOR');
    setField('name', 'laura nueva');
    setField('email', 'laura@prueba.test');
    setField('phone', '3115550000');
    setField('address', 'Calle 9');
    setField('birthdate', '1998-03-04');
    setField('document', '1009');
    pickDepartmentAndCity();
    setField('localId', '1');
    setField('status', 'ACTIVO');
    setField('password', 'Secreta123*');
    await submitForm();
    const call = await waitForCall(api, 'POST', /^\/users$/);
    expect(call.body).toMatchObject({
      role: 'ASESOR',
      name: 'LAURA NUEVA',
      email: 'laura@prueba.test',
      phone: '3115550000',
      document: '1009',
      localId: 1,
      status: 'ACTIVO',
      password: 'Secreta123*',
    });
    expect(String(call.body.birthdate)).toMatch(/^1998-03-04/);
    const t = await expectToast('success', 'Usuario creado');
    expect(t.url).toBe('/dashboard/users');
  });

  it('edita el usuario: PUT sin contraseña si no se cambia y sin relaciones', async () => {
    await renderPage(<EditUserPage />);
    await waitForCall(api, 'GET', /^\/users\/2$/);
    await waitFor(() => expect(document.querySelector('[name="name"]').value).toBe('CARLA VENDEDORA'));
    await settle();
    setField('phone', '3200000000');
    await submitForm();
    const call = await waitForCall(api, 'PUT', /^\/users\/2$/);
    expect(call.body.phone).toBe('3200000000');
    expect(call.body.localId).toBe(1);
    expect('password' in call.body).toBe(false);
    expect('local' in call.body).toBe(false);
    expect('id' in call.body).toBe(false);
    await expectToast('success', /actualizad/i);
  });
});
