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
  click,
  waitForCall,
  expectToast,
  submitForm,
  authState,
} from '@/test/behaviorHarness';
import { describeCatalogList } from '@/test/catalogBehavior';
import CategoriesPage from '../page';
import NewCategoryPage from '../new/page';
import EditCategoryPage from '../edit/[id]/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const CATEGORIES = [
  { id: 3, name: 'GENERAL', description: '', status: 'ACTIVO', localId: 1, local: { id: 1, name: 'Sede Centro' }, earnsCommission: false, createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-01T10:00:00.000Z' },
  { id: 4, name: 'BEBIDAS', description: '', status: 'ACTIVO', localId: 1, local: { id: 1, name: 'Sede Centro' }, earnsCommission: true, createdAt: '2026-01-02T10:00:00.000Z', updatedAt: '2026-01-02T10:00:00.000Z' },
];

describeCatalogList({
  title: 'Categorías',
  Page: CategoriesPage,
  base: '/categories',
  rows: CATEGORIES,
  rowText: 'GENERAL',
  secondRowText: 'BEBIDAS',
  filterPlaceholder: 'Filtrar Nombre de la Categoría',
  filterKey: 'name',
  heading: 'Listado de Categorías',
  viewTitle: 'Detalles de la Categoría',
  newHref: '/dashboard/categories/new',
  addText: 'Agregar categoría',
  readOnlyRoles: ['ASESOR', 'COORDINADOR'],
  blockedRoles: ['BARBERO'],
});

function categoriesApi() {
  return installApi([
    on('GET', /^\/categories$/, list(CATEGORIES)),
    on('GET', /^\/categories\/\d+$/, detail(CATEGORIES[0])),
    on('POST', /^\/categories$/, ok({ id: 9 })),
    on('PUT', /^\/categories\/\d+$/, ok({ id: 3 })),
    ...baseRoutes(),
  ]);
}

describe('Categorías · crear y editar', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    authState.params = { id: '3' };
    api = categoriesApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('crea la categoría con sede numérica y marca de comisión', async () => {
    await renderPage(<NewCategoryPage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    setField('name', 'accesorios');
    setField('status', 'ACTIVO');
    setField('localId', '1');
    await click(screen.getByText('Los productos de esta categoría dan comisión al empleado'));
    await submitForm();
    const call = await waitForCall(api, 'POST', /^\/categories$/);
    expect(call.body).toMatchObject({ name: 'ACCESORIOS', status: 'ACTIVO', localId: 1, earnsCommission: true });
    const t = await expectToast('success', 'Categoria creada');
    expect(t.url).toBe('/dashboard/categories');
  });

  it('edita la categoría y guarda con PUT', async () => {
    await renderPage(<EditCategoryPage />);
    await waitForCall(api, 'GET', /^\/categories\/3$/);
    await waitFor(() => expect(document.querySelector('[name="name"]').value).toBe('GENERAL'));
    await settle();
    setField('name', 'general hogar');
    await submitForm();
    const call = await waitForCall(api, 'PUT', /^\/categories\/3$/);
    expect(call.body.name).toBe('GENERAL HOGAR');
    expect('id' in call.body).toBe(false);
    expect('local' in call.body).toBe(false);
    await expectToast('success', /actualizad/i);
  });
});
