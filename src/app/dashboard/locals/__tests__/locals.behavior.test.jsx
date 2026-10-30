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
import LocalsPage from '../page';
import NewLocalPage from '../new/page';
import EditLocalPage from '../edit/[id]/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const LOCALS = [
  { id: 1, name: 'SEDE CENTRO', address: 'Calle 10 # 5-20', department: 'cundinamarca', city: 'bogota', phone: '3001112233', managerId: 1, manager: { id: 1, name: 'Dueño Prueba', email: 'dueno@prueba.test' }, status: 'ACTIVO', createdAt: '2026-01-01T10:00:00.000Z' },
  { id: 2, name: 'SEDE NORTE', address: 'Av 68 # 100', department: 'cundinamarca', city: 'bogota', phone: '3002223344', managerId: null, manager: null, status: 'ACTIVO', createdAt: '2026-01-02T10:00:00.000Z' },
];

describeCatalogList({
  title: 'Sedes',
  Page: LocalsPage,
  base: '/locals',
  rows: LOCALS,
  rowText: 'SEDE CENTRO',
  secondRowText: 'SEDE NORTE',
  filterPlaceholder: 'Filtrar Nombre del Local',
  filterKey: 'name',
  heading: 'Listado de Locales',
  viewTitle: 'Detalles del Local',
  readOnlyRoles: ['ADMIN'],
  blockedRoles: ['BARBERO'],
});

describe('Sedes · crear y editar', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    authState.params = { id: '1' };
    api = installApi([
      on('GET', /^\/locals$/, list(LOCALS)),
      on('GET', /^\/locals\/\d+$/, detail(LOCALS[0])),
      on('POST', /^\/locals$/, ok({ id: 9 })),
      on('PUT', /^\/locals\/\d+$/, ok({ id: 1 })),
      ...baseRoutes().filter((r) => !/locals/.test(String(r.path))),
    ]);
  });
  afterEach(() => vi.restoreAllMocks());

  it('crea la sede con encargado y departamento/ciudad obligatorios', async () => {
    await renderPage(<NewLocalPage />);
    await waitForCall(api, 'GET', /^\/users$/);
    await settle();
    setField('name', 'sede sur');
    setField('address', 'Cra 50 # 1-10');
    setField('phone', '3105556677');
    setField('status', 'ACTIVO');
    setField('managerId', '1');
    const { dep, city } = pickDepartmentAndCity();
    await submitForm();
    const call = await waitForCall(api, 'POST', /^\/locals$/);
    expect(call.body).toMatchObject({ name: 'SEDE SUR', address: 'Cra 50 # 1-10', phone: '3105556677', status: 'ACTIVO', managerId: 1, department: dep, city });
    const t = await expectToast('success', 'Local creado');
    expect(t.url).toBe('/dashboard/locals');
  });

  it('sin encargado se envía null (no 0)', async () => {
    await renderPage(<NewLocalPage />);
    await waitForCall(api, 'GET', /^\/users$/);
    await settle();
    setField('name', 'sede sin jefe');
    setField('address', 'Cra 1');
    setField('phone', '3105556677');
    setField('status', 'ACTIVO');
    pickDepartmentAndCity();
    await submitForm();
    const call = await waitForCall(api, 'POST', /^\/locals$/);
    expect(call.body.managerId).toBeNull();
  });

  it('sin departamento y ciudad el navegador no deja enviar (son obligatorios en sedes)', async () => {
    await renderPage(<NewLocalPage />);
    await waitForCall(api, 'GET', /^\/users$/);
    await settle();
    setField('name', 'x');
    setField('address', 'y');
    setField('phone', '3105556677');
    setField('status', 'ACTIVO');
    expect(document.querySelector('form').checkValidity()).toBe(false);
    expect(api.count('POST', /^\/locals$/)).toBe(0);
  });

  it('edita la sede y guarda con PUT sin relaciones', async () => {
    await renderPage(<EditLocalPage />);
    await waitForCall(api, 'GET', /^\/locals\/1$/);
    await waitFor(() => expect(document.querySelector('[name="name"]').value).toBe('SEDE CENTRO'));
    await settle();
    setField('phone', '3200000000');
    await submitForm();
    const call = await waitForCall(api, 'PUT', /^\/locals\/1$/);
    expect(call.body.phone).toBe('3200000000');
    expect(call.body.managerId).toBe(1);
    expect('manager' in call.body).toBe(false);
    await expectToast('success', /actualizad/i);
  });
});
