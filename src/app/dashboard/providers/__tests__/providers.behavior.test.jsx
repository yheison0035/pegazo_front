import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  waitForCall,
  expectToast,
  submitForm,
  authState,
} from '@/test/behaviorHarness';
import { describeCatalogList } from '@/test/catalogBehavior';
import ProvidersPage from '../page';
import NewProviderPage from '../new/page';
import EditProviderPage from '../edit/[id]/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const PROVIDERS = [
  { id: 7, name: 'PROVEEDOR UNO', docType: 'NIT', docNumber: '900111222', contactName: 'LUIS', phone: '3001112233', email: 'uno@prov.com', city: 'bogota', department: 'cundinamarca', address: 'Calle 1', productType: 'TEXTIL', status: 'ACTIVO', createdAt: '2026-01-01T10:00:00.000Z' },
  { id: 8, name: 'PROVEEDOR DOS', docType: 'CC', docNumber: '1002', contactName: 'MARTA', phone: '3002223344', email: 'dos@prov.com', city: 'cali', department: 'valle del cauca', address: '', productType: 'CALZADO', status: 'ACTIVO', createdAt: '2026-01-02T10:00:00.000Z' },
];

describeCatalogList({
  title: 'Proveedores',
  Page: ProvidersPage,
  base: '/providers',
  rows: PROVIDERS,
  rowText: 'PROVEEDOR UNO',
  secondRowText: 'PROVEEDOR DOS',
  filterPlaceholder: 'Filtrar Empresa',
  filterKey: 'name',
  heading: 'Listado de Proveedores',
  viewTitle: 'Detalles del Proveedor',
  newHref: '/dashboard/providers/new',
  addText: 'Agregar proveedor',
  readOnlyRoles: ['ASESOR', 'COORDINADOR'],
});

function providersApi() {
  return installApi([
    on('GET', /^\/providers$/, list(PROVIDERS)),
    on('GET', /^\/providers\/\d+$/, detail(PROVIDERS[0])),
    on('POST', /^\/providers$/, ok({ id: 9 })),
    on('PUT', /^\/providers\/\d+$/, ok({ id: 7 })),
    ...baseRoutes(),
  ]);
}

describe('Proveedores · crear y editar', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    authState.params = { id: '7' };
    api = providersApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('crea el proveedor con NIT y datos de contacto (departamento opcional)', async () => {
    await renderPage(<NewProviderPage />);
    await settle();
    setField('name', 'textiles del sur');
    setField('docType', 'NIT');
    setField('docNumber', '901222333');
    setField('contactName', 'pedro');
    setField('phone', '3109998877');
    setField('email', 'pedro@textiles.com');
    setField('productType', 'TELAS');
    setField('status', 'ACTIVO');
    await submitForm();
    const call = await waitForCall(api, 'POST', /^\/providers$/);
    expect(call.body).toMatchObject({
      name: 'TEXTILES DEL SUR',
      docType: 'NIT',
      docNumber: '901222333',
      contactName: 'pedro',
      phone: '3109998877',
      email: 'pedro@textiles.com',
      productType: 'TELAS',
      status: 'ACTIVO',
    });
    const t = await expectToast('success', 'Proveedor creado');
    expect(t.url).toBe('/dashboard/providers');
  });

  it('con correo inválido no envía nada', async () => {
    await renderPage(<NewProviderPage />);
    await settle();
    setField('name', 'x');
    setField('contactName', 'y');
    setField('phone', '3109998877');
    setField('email', 'mal');
    setField('productType', 'TELAS');
    setField('status', 'ACTIVO');
    // El navegador bloquea el envío (input type=email) antes de llegar al backend.
    expect(document.querySelector('form').checkValidity()).toBe(false);
    await click(screen.getByRole('button', { name: 'Guardar' }));
    await settle();
    expect(api.count('POST', /^\/providers$/)).toBe(0);
  });

  it('un error del backend al crear se avisa', async () => {
    api.set('POST', /^\/providers$/, fail(400, 'Ya existe un proveedor con ese NIT'));
    await renderPage(<NewProviderPage />);
    await settle();
    setField('name', 'repetido');
    setField('contactName', 'y');
    setField('phone', '3109998877');
    setField('email', 'ok@ok.com');
    setField('productType', 'TELAS');
    setField('status', 'ACTIVO');
    await submitForm();
    await waitForCall(api, 'POST', /^\/providers$/);
    await expectToast('error', 'ese NIT');
  });

  it('edita el proveedor y guarda con PUT sin campos de solo lectura', async () => {
    await renderPage(<EditProviderPage />);
    await waitForCall(api, 'GET', /^\/providers\/7$/);
    await waitFor(() => expect(document.querySelector('[name="name"]').value).toBe('PROVEEDOR UNO'));
    await settle();
    setField('phone', '3200000000');
    await submitForm();
    const call = await waitForCall(api, 'PUT', /^\/providers\/7$/);
    expect(call.body.phone).toBe('3200000000');
    expect(call.body.name).toBe('PROVEEDOR UNO');
    expect('id' in call.body).toBe(false);
    expect('createdAt' in call.body).toBe(false);
    await expectToast('success', /actualizado/i);
  });
});
