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
  waitFor,
  setField,
  waitForCall,
  expectToast,
  submitForm,
  authState,
} from '@/test/behaviorHarness';
import { describeCatalogList } from '@/test/catalogBehavior';
import BrandsPage from '../page';
import NewBrandPage from '../new/page';
import EditBrandPage from '../edit/[id]/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const BRANDS = [
  { id: 4, name: 'MARCA X', description: '', status: 'ACTIVO', localId: 1, local: { id: 1, name: 'Sede Centro' }, createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-01T10:00:00.000Z' },
  { id: 5, name: 'MARCA Y', description: '', status: 'ACTIVO', localId: 1, local: { id: 1, name: 'Sede Centro' }, createdAt: '2026-01-02T10:00:00.000Z', updatedAt: '2026-01-02T10:00:00.000Z' },
];

describeCatalogList({
  title: 'Marcas',
  Page: BrandsPage,
  base: '/brands',
  rows: BRANDS,
  rowText: 'MARCA X',
  secondRowText: 'MARCA Y',
  filterPlaceholder: 'Filtrar Nombre de la Marca',
  filterKey: 'name',
  heading: 'Listado de Marcas',
  viewTitle: 'Detalles de la Marca',
  newHref: '/dashboard/brands/new',
  addText: 'Agregar marca',
  readOnlyRoles: ['ASESOR', 'COORDINADOR'],
  blockedRoles: ['BARBERO'],
});

describe('Marcas · crear y editar', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    authState.params = { id: '4' };
    api = installApi([
      on('GET', /^\/brands$/, list(BRANDS)),
      on('GET', /^\/brands\/\d+$/, detail(BRANDS[0])),
      on('POST', /^\/brands$/, ok({ id: 9 })),
      on('PUT', /^\/brands\/\d+$/, ok({ id: 4 })),
      ...baseRoutes(),
    ]);
  });
  afterEach(() => vi.restoreAllMocks());

  it('crea la marca con la sede como número', async () => {
    await renderPage(<NewBrandPage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    setField('name', 'nike');
    setField('description', 'Deportiva');
    setField('status', 'ACTIVO');
    setField('localId', '2');
    await submitForm();
    const call = await waitForCall(api, 'POST', /^\/brands$/);
    expect(call.body).toMatchObject({ name: 'NIKE', description: 'Deportiva', status: 'ACTIVO', localId: 2 });
    const t = await expectToast('success', 'Marca creada');
    expect(t.url).toBe('/dashboard/brands');
  });

  it('edita la marca y guarda con PUT', async () => {
    await renderPage(<EditBrandPage />);
    await waitForCall(api, 'GET', /^\/brands\/4$/);
    await waitFor(() => expect(document.querySelector('[name="name"]').value).toBe('MARCA X'));
    await settle();
    setField('status', 'INACTIVO');
    await submitForm();
    const call = await waitForCall(api, 'PUT', /^\/brands\/4$/);
    expect(call.body.status).toBe('INACTIVO');
    expect('local' in call.body).toBe(false);
    await expectToast('success', /actualizad/i);
  });
});
