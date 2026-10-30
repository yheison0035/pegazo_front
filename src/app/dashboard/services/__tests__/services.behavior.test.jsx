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
  setField,
  click,
  typeInto,
  button,
  waitForCall,
  expectToast,
  submitForm,
  authState,
} from '@/test/behaviorHarness';
import { describeCatalogList } from '@/test/catalogBehavior';
import ServicesPage from '../page';
import NewServicePage from '../new/page';
import EditServicePage from '../edit/[id]/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const SERVICES = [
  { id: 9, name: 'CORTE CLÁSICO', description: 'Corte con tijera', duration: 30, status: 'ACTIVO', serviceLocals: [{ localId: 1, price: 20000 }], createdAt: '2026-01-01T10:00:00.000Z' },
  { id: 10, name: 'BARBA', description: 'Perfilado', duration: 20, status: 'ACTIVO', serviceLocals: [{ localId: 1, price: 15000 }], createdAt: '2026-01-02T10:00:00.000Z' },
];

describeCatalogList({
  title: 'Servicios',
  Page: ServicesPage,
  base: '/services',
  rows: SERVICES,
  rowText: 'CORTE CLÁSICO',
  secondRowText: 'BARBA',
  filterPlaceholder: 'Filtrar Nombre del Servicio',
  filterKey: 'name',
  heading: 'Listado de Servicios',
  viewTitle: 'Detalles del Servicio',
  newHref: '/dashboard/services/new',
  addText: 'Agregar servicio',
  user: { type: 'BARBERIA' },
  readOnlyRoles: ['ADMIN', 'RECEPCIONISTA'],
  blockedRoles: ['BARBERO'],
});

function servicesApi() {
  return installApi([
    on('GET', /^\/services$/, list(SERVICES)),
    on('GET', /^\/services\/\d+$/, detail(SERVICES[0])),
    on('POST', /^\/services$/, ok({ id: 11 })),
    on('PUT', /^\/services\/\d+$/, ok({ id: 9 })),
    ...baseRoutes(),
  ]);
}

// El formulario arranca con UNA fila de sede vacía; se usa esa.
async function fillLocalPrice(price) {
  const select = await screen.findByDisplayValue('Seleccione un local');
  await typeInto(select, '1');
  await typeInto(screen.getAllByPlaceholderText('$ 0').pop(), price);
}

describe('Servicios · crear y editar', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ type: 'BARBERIA' });
    authState.params = { id: '9' };
    api = servicesApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('crea el servicio con duración numérica y precio por sede', async () => {
    await renderPage(<NewServicePage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    setField('name', 'corte premium');
    setField('description', 'Corte + lavado');
    setField('duration', '45');
    setField('status', 'ACTIVO');
    await fillLocalPrice('35000');
    await submitForm();
    const call = await waitForCall(api, 'POST', /^\/services$/);
    expect(call.body).toMatchObject({ name: 'CORTE PREMIUM', description: 'Corte + lavado', duration: 45, status: 'ACTIVO' });
    expect(call.body.locals).toEqual([{ localId: 1, price: 35000 }]);
    const t = await expectToast('success', 'Servicio creado');
    expect(t.url).toBe('/dashboard/services');
  });

  it('sin ninguna sede (fila quitada) no se envía y se avisa', async () => {
    await renderPage(<NewServicePage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    setField('name', 'corte');
    setField('description', 'x');
    setField('duration', '30');
    setField('status', 'ACTIVO');
    const row = screen.getByDisplayValue('Seleccione un local').closest('.grid');
    await click(within(row).getByRole('button'));
    await submitForm();
    await expectToast('warning', 'al menos un local');
    expect(api.count('POST', /^\/services$/)).toBe(0);
  });

  it('una sede sin precio válido bloquea el envío', async () => {
    await renderPage(<NewServicePage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    setField('name', 'corte');
    setField('description', 'x');
    setField('duration', '30');
    setField('status', 'ACTIVO');
    await typeInto(await screen.findByDisplayValue('Seleccione un local'), '1');
    await submitForm();
    await expectToast('warning', 'precio válido');
    expect(api.count('POST', /^\/services$/)).toBe(0);
  });

  it('un error del backend al crear se avisa', async () => {
    api.set('POST', /^\/services$/, fail(400, 'Ya existe un servicio con ese nombre'));
    await renderPage(<NewServicePage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    setField('name', 'corte');
    setField('description', 'x');
    setField('duration', '30');
    setField('status', 'ACTIVO');
    await fillLocalPrice('1000');
    await submitForm();
    await waitForCall(api, 'POST', /^\/services$/);
    await expectToast('error', 'ese nombre');
  });

  it('edita el servicio: precarga sedes/precios y guarda con PUT limpio', async () => {
    await renderPage(<EditServicePage />);
    await waitForCall(api, 'GET', /^\/services\/9$/);
    await waitFor(() => expect(document.querySelector('[name="name"]').value).toBe('CORTE CLÁSICO'));
    await settle();
    setField('duration', '35');
    await submitForm();
    const call = await waitForCall(api, 'PUT', /^\/services\/9$/);
    expect(call.body.duration).toBe(35);
    expect(call.body.locals).toEqual([{ localId: 1, price: 20000 }]);
    expect('serviceLocals' in call.body).toBe(false);
    expect('id' in call.body).toBe(false);
    await expectToast('success', 'Servicio actualizado');
  });
});
