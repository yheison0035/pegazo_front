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
  fireEvent,
  act,
  click,
  rowWith,
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
vi.mock('@/lib/imaging/formatImage', async () => {
  const actual = await vi.importActual('@/lib/imaging/formatImage');
  return { ...actual, formatImageFile: vi.fn(async (f) => f) };
});

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

describe('Usuarios · foto desde la tabla (sin entrar a editar)', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = installApi([
      on('GET', /^\/users$/, list(USERS)),
      on('POST', /^\/users\/image-upload$/, ok({ url: 'https://cdn/carla.webp' })),
      on('PATCH', /^\/users\/\d+\/avatar$/, ok({ id: 2 })),
      ...baseRoutes(),
    ]);
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview');
    globalThis.URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it('cada fila muestra la miniatura de foto (inicial si no hay)', async () => {
    api.set('GET', /^\/users$/, list([{ ...USERS[0], avatar: 'https://cdn/ya.webp' }, USERS[1]]));
    await renderPage(<UsersPage />);
    await screen.findByText('CARLA VENDEDORA');
    // Con foto: muestra la imagen; sin foto: la inicial del nombre.
    expect(within(rowWith('CARLA VENDEDORA')).getByAltText('CARLA VENDEDORA')).toHaveAttribute('src', 'https://cdn/ya.webp');
    expect(within(rowWith('PEDRO CAJA')).getByText('P')).toBeInTheDocument();
  });

  it('cambiar la foto desde la tabla la sube y la persiste sin abrir el editor', async () => {
    await renderPage(<UsersPage />);
    await screen.findByText('CARLA VENDEDORA');
    await click(within(rowWith('CARLA VENDEDORA')).getByTitle('Cambiar foto'));
    expect(await screen.findByText('Foto del usuario')).toBeInTheDocument();
    const fileInput = document.querySelector('.fixed input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [new File([new Uint8Array([1, 2, 3])], 'f.png', { type: 'image/png' })] } });
    });
    await waitForCall(api, 'POST', /^\/users\/image-upload$/);
    const call = await waitForCall(api, 'PATCH', /^\/users\/2\/avatar$/);
    expect(call.body).toEqual({ avatar: 'https://cdn/carla.webp' });
    // La miniatura de la fila se actualiza al instante.
    await waitFor(() => expect(within(rowWith('CARLA VENDEDORA')).getByAltText('CARLA VENDEDORA')).toHaveAttribute('src', 'https://cdn/carla.webp'));
  });

  it('si falla el guardado de la foto, avisa', async () => {
    api.set('PATCH', /^\/users\/\d+\/avatar$/, fail(400, 'No se pudo cambiar la foto.'));
    await renderPage(<UsersPage />);
    await screen.findByText('CARLA VENDEDORA');
    await click(within(rowWith('CARLA VENDEDORA')).getByTitle('Cambiar foto'));
    await screen.findByText('Foto del usuario');
    const fileInput = document.querySelector('.fixed input[type="file"]');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [new File([new Uint8Array([1])], 'f.png', { type: 'image/png' })] } });
    });
    await waitForCall(api, 'PATCH', /^\/users\/2\/avatar$/);
    await expectToast('error', 'No se pudo cambiar la foto.');
  });
});
