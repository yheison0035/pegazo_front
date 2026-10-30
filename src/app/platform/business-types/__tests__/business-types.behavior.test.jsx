import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  ok,
  fail,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  waitFor,
  click,
  typeInto,
  button,
  placeholder,
  waitForCall,
  router,
} from '@/test/behaviorHarness';
import BusinessTypesPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const PF = { brand: true, provider: true, barcode: true, category: true, oldPrice: true, size: false, expiry: false, variantType: 'simple' };
const TYPES = [
  { type: 'COMERCIO', label: 'Comercio', active: true, modules: ['sales', 'inventory', 'customers'], terminology: null, productFields: PF, roles: ['ADMIN', 'CAJA'], defaults: null, storefront: null },
  { type: 'BARBERIA', label: 'Barbería', active: false, modules: ['appointments'], terminology: null, productFields: PF, roles: ['ADMIN', 'BARBERO'], defaults: null, storefront: null },
];
const selectWithOption = (value) => [...document.querySelectorAll('select')].find((s) => [...s.options].some((o) => o.value === value));

function typesApi() {
  return installApi([
    on('GET', /^\/business-types$/, ok(TYPES)),
    on('POST', /^\/business-types$/, ok({ type: 'FERRETERIA' })),
    on('PATCH', /^\/business-types\/[A-Z]+$/, ok({})),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · Tipos de negocio', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = typesApi();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista los tipos con estado y cantidad de módulos', async () => {
    await renderPage(<BusinessTypesPage />);
    await waitForCall(api, 'GET', /^\/business-types$/);
    expect(await screen.findByText('Comercio')).toBeInTheDocument();
    expect(screen.getByText('COMERCIO')).toBeInTheDocument();
    expect(screen.getByText('3 módulos')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Barbería')).toBeInTheDocument();
    expect(screen.getByText('1 módulos')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('editar un tipo guarda módulos, vocabulario, campos, roles, valores por defecto y tienda', async () => {
    await renderPage(<BusinessTypesPage />);
    await screen.findByText('Comercio');
    await click(screen.getAllByLabelText('Editar')[0]);
    expect(await screen.findByText('Tipo de negocio: COMERCIO')).toBeInTheDocument();
    expect(placeholder('Ej: Ferretería').value).toBe('Comercio');
    expect(screen.getByLabelText('Clientes').checked).toBe(true);
    await click(screen.getByLabelText('Clientes'));
    await click(screen.getByLabelText('Parqueadero'));
    await typeInto(placeholder('Producto'), 'Artículo');
    await click(screen.getByLabelText('Talla'));
    await click(screen.getByLabelText('CAJA'));
    await click(screen.getByLabelText('Exigir abrir caja para vender'));
    await typeInto(placeholder('9'), '8');
    await click(screen.getByLabelText('Recoger en tienda'));
    await typeInto(selectWithOption('grid'), 'grid');
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PATCH', /^\/business-types\/COMERCIO$/);
    expect(call.body).toEqual({
      label: 'Comercio',
      modules: ['sales', 'inventory', 'parking'],
      active: true,
      terminology: { product: 'Artículo' },
      productFields: { ...PF, size: true },
      roles: ['ADMIN'],
      defaults: { requireCashOpen: true, openHour: 8 },
      storefront: { fulfillment: ['pickup'], layout: 'grid' },
    });
    await waitForCall(api, 'GET', /^\/business-types$/, { count: 2 });
    expect(screen.queryByText('Tipo de negocio: COMERCIO')).toBeNull();
  });

  it('crear un tipo exige nombre y envía clave y módulos marcados', async () => {
    await renderPage(<BusinessTypesPage />);
    await screen.findByText('Comercio');
    await click(button(/Nuevo tipo/));
    expect(await screen.findByText('Nuevo tipo de negocio')).toBeInTheDocument();
    await click(button('Guardar'));
    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument();
    expect(api.count('POST', /^\/business-types$/)).toBe(0);
    await typeInto(placeholder('Ej: Ferretería'), ' Ferretería ');
    await typeInto(placeholder(/Se genera del nombre/), 'FERRETERIA');
    await click(screen.getByLabelText('Inventario'));
    await click(button('Guardar'));
    const call = await waitForCall(api, 'POST', /^\/business-types$/);
    expect(call.body).toMatchObject({ label: 'Ferretería', type: 'FERRETERIA', modules: ['inventory'], terminology: null, defaults: null, storefront: null });
    expect(call.body.productFields.variantType).toBeDefined();
    expect(Array.isArray(call.body.roles)).toBe(true);
    await waitForCall(api, 'GET', /^\/business-types$/, { count: 2 });
  });

  it('cancelar cierra el editor sin enviar', async () => {
    await renderPage(<BusinessTypesPage />);
    await screen.findByText('Comercio');
    await click(screen.getAllByLabelText('Editar')[0]);
    await screen.findByText('Tipo de negocio: COMERCIO');
    await click(button('Cancelar'));
    expect(screen.queryByText('Tipo de negocio: COMERCIO')).toBeNull();
    expect(api.count('PATCH', /^\/business-types\//)).toBe(0);
  });

  it('si el backend rechaza el guardado, el editor muestra el error', async () => {
    api.set('PATCH', /^\/business-types\/[A-Z]+$/, fail(400, 'Módulo desconocido'));
    await renderPage(<BusinessTypesPage />);
    await screen.findByText('Comercio');
    await click(screen.getAllByLabelText('Editar')[0]);
    await screen.findByText('Tipo de negocio: COMERCIO');
    await click(button('Guardar'));
    expect(await screen.findByText('Módulo desconocido')).toBeInTheDocument();
  });

  it('si falla la carga, se avisa', async () => {
    api.set('GET', /^\/business-types$/, fail(400, 'Sin acceso'));
    await renderPage(<BusinessTypesPage />);
    await waitForCall(api, 'GET', /^\/business-types$/);
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Sin acceso'));
  });

  it('solo el administrador de plataforma entra', async () => {
    vi.restoreAllMocks();
    resetBehavior({ role: 'SUPER_ADMIN' });
    typesApi();
    await renderPage(<BusinessTypesPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
