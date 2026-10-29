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
  click,
  typeInto,
  setField,
  button,
  rowButton,
  queryRowButton,
  waitForCall,
  expectToast,
  submitForm,
  authState,
  router,
  placeholder,
  formatCOP,
} from '@/test/behaviorHarness';
import InventoryPage from '../page';
import NewProductPage from '../new/page';
import EditProductPage from '../edit/[id]/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

// El export a Excel se verifica por lo que se le pasa a SheetJS, sin escribir
// archivos reales.
const xlsxMock = vi.hoisted(() => ({
  json_to_sheet: vi.fn(() => ({ sheet: true })),
  book_new: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
  book_append_sheet: vi.fn(),
  writeFile: vi.fn(),
}));
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: xlsxMock.json_to_sheet,
    book_new: xlsxMock.book_new,
    book_append_sheet: xlsxMock.book_append_sheet,
  },
  writeFile: xlsxMock.writeFile,
}));

const PRODUCTS = [
  {
    id: 1,
    name: 'CAMISETA BÁSICA',
    barcode: '7700001',
    sku: 'CAM-001',
    stock: 12,
    salePrice: 25000,
    purchasePrice: 12000,
    oldPrice: null,
    onlinePrice: null,
    publishInEcommerce: false,
    minStock: 2,
    unit: 'UNIDAD',
    trackStock: true,
    status: 'ACTIVO',
    localId: 1,
    local: { id: 1, name: 'Sede Centro' },
    providerId: 7,
    provider: { id: 7, name: 'Proveedor Uno' },
    categoryId: 3,
    category: { id: 3, name: 'General' },
    brandId: 4,
    brand: { id: 4, name: 'Marca X' },
    images: [],
    variants: [{ id: 11, color: 'ÚNICO', stock: 12 }],
    features: [],
    specifications: [],
    description: '',
    updatedAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 2,
    name: 'GORRA NEGRA',
    barcode: '7700002',
    sku: 'GOR-002',
    stock: 0,
    salePrice: 30000,
    purchasePrice: 15000,
    minStock: 2,
    unit: 'UNIDAD',
    trackStock: true,
    status: 'ACTIVO',
    localId: 1,
    local: { id: 1, name: 'Sede Centro' },
    providerId: 7,
    provider: { id: 7, name: 'Proveedor Uno' },
    categoryId: 3,
    category: { id: 3, name: 'General' },
    brandId: 4,
    brand: { id: 4, name: 'Marca X' },
    images: [],
    variants: [{ id: 12, color: 'ÚNICO', stock: 0 }],
    features: [],
    specifications: [],
    description: '',
    updatedAt: '2026-01-21T10:00:00.000Z',
  },
];

const EXPORT_ROWS = [
  { id: 1, sku: 'CAM-001', name: 'CAMISETA BÁSICA', categoryName: 'General', brandName: 'Marca X', providerName: 'Proveedor Uno', localName: 'Sede Centro', barcode: '7700001', color: 'ÚNICO', size: '', purchasePrice: 12000, salePrice: 25000, stock: 12, minStock: 2, unit: 'UNIDAD', status: 'ACTIVO', description: '' },
];

function inventoryApi() {
  return installApi([
    on('GET', /^\/inventory$/, list(PRODUCTS, { total: 2 })),
    on('GET', /^\/inventory\/export$/, ok(EXPORT_ROWS)),
    on('GET', /^\/inventory\/low-stock$/, ok([])),
    on('GET', /^\/inventory\/expiring$/, ok([])),
    on('GET', /^\/inventory\/\d+$/, detail(PRODUCTS[0])),
    on('DELETE', /^\/inventory\/\d+$/, ok()),
    on('POST', /^\/inventory$/, ok({ id: 9 })),
    on('PUT', /^\/inventory\/\d+$/, ok({ id: 1 })),
    on('PUT', /^\/inventory\/\d+\/images$/, ok({ id: 1 })),
    on('POST', /^\/stock-requests$/, ok({ id: 3 })),
    on('GET', /^\/stock-requests\/pending-count$/, ok({ count: 0 })),
    ...baseRoutes(),
  ]);
}

describe('Inventario · listado', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = inventoryApi();
    xlsxMock.writeFile.mockClear();
    xlsxMock.json_to_sheet.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga los productos con paginación', async () => {
    await renderPage(<InventoryPage />);
    const call = await waitForCall(api, 'GET', /^\/inventory$/);
    expect(call.query).toMatchObject({ page: '1', limit: '10' });
    expect(screen.getByText('CAMISETA BÁSICA')).toBeInTheDocument();
    expect(screen.getByText('GORRA NEGRA')).toBeInTheDocument();
    expect(screen.getByText('Listado de Productos')).toBeInTheDocument();
  });

  it('busca por nombre y por código de barras', async () => {
    await renderPage(<InventoryPage />);
    await waitForCall(api, 'GET', /^\/inventory$/);
    await typeInto(screen.getAllByPlaceholderText('Filtrar Nombre del Producto')[0], 'GORRA');
    let call = await waitForCall(api, 'GET', /^\/inventory$/, { count: 2 });
    expect(call.query).toMatchObject({ name: 'GORRA', page: '1' });
    await typeInto(screen.getAllByPlaceholderText('Filtrar Codigo de barras')[0], '7700002');
    call = await waitForCall(api, 'GET', /^\/inventory$/, { count: 3 });
    expect(call.query.barcode).toBe('7700002');
  });

  it('ver detalle y variantes abren sus modales', async () => {
    await renderPage(<InventoryPage />);
    await waitForCall(api, 'GET', /^\/inventory$/);
    await click(rowButton('CAMISETA BÁSICA', 'Ver detalle'));
    const modal = screen.getByText('Detalles del Producto').closest('.fixed');
    expect(within(modal).getByText('CAMISETA BÁSICA')).toBeInTheDocument();
    await click(within(modal).getAllByRole('button')[0]);
    expect(screen.queryByText('Detalles del Producto')).toBeNull();

    await click(rowButton('CAMISETA BÁSICA', 'Variantes'));
    const vm = screen.getByRole('heading', { name: 'CAMISETA BÁSICA' }).closest('.fixed');
    expect(within(vm).getByText('ÚNICO')).toBeInTheDocument();
  });

  it('eliminar confirma, llama DELETE y recarga', async () => {
    await renderPage(<InventoryPage />);
    await waitForCall(api, 'GET', /^\/inventory$/);
    await click(rowButton('GORRA NEGRA', 'Eliminar'));
    const modal = screen.getByText('Confirmar eliminación').parentElement;
    await click(within(modal).getByRole('button', { name: 'Eliminar' }));
    await waitForCall(api, 'DELETE', /^\/inventory\/2$/);
    await waitForCall(api, 'GET', /^\/inventory$/, { count: 2 });
  });

  it('si el producto no se puede borrar, se avisa el motivo', async () => {
    api.set('DELETE', /^\/inventory\/\d+$/, fail(400, 'El producto tiene ventas registradas'));
    await renderPage(<InventoryPage />);
    await waitForCall(api, 'GET', /^\/inventory$/);
    await click(rowButton('CAMISETA BÁSICA', 'Eliminar'));
    const modal = screen.getByText('Confirmar eliminación').parentElement;
    await click(within(modal).getByRole('button', { name: 'Eliminar' }));
    await expectToast('error', 'ventas registradas');
    expect(screen.queryByText('Confirmar eliminación')).toBeNull();
  });

  it('exporta todo el inventario a Excel con ID y SKU como llave', async () => {
    await renderPage(<InventoryPage />);
    await waitForCall(api, 'GET', /^\/inventory$/);
    await click(button('Exportar Excel'));
    await waitForCall(api, 'GET', /^\/inventory\/export$/);
    await waitFor(() => expect(xlsxMock.writeFile).toHaveBeenCalledTimes(1));
    const rows = xlsxMock.json_to_sheet.mock.calls[0][0];
    expect(rows[0]).toMatchObject({ ID: 1, SKU: 'CAM-001', Nombre: 'CAMISETA BÁSICA', 'Precio venta': 25000, Stock: 12, Eliminar: '' });
    expect(xlsxMock.writeFile.mock.calls[0][1]).toMatch(/^inventario-\d{4}-\d{2}-\d{2}\.xlsx$/);
  });

  it('sin productos el export avisa en vez de generar un archivo vacío', async () => {
    api.set('GET', /^\/inventory\/export$/, ok([]));
    await renderPage(<InventoryPage />);
    await waitForCall(api, 'GET', /^\/inventory$/);
    await click(button('Exportar Excel'));
    await expectToast('warning', 'No hay productos para exportar');
    expect(xlsxMock.writeFile).not.toHaveBeenCalled();
  });

  it('los accesos a importar y crear apuntan a sus pantallas', async () => {
    await renderPage(<InventoryPage />);
    await waitForCall(api, 'GET', /^\/inventory$/);
    expect(screen.getByText('Importar Excel').closest('a')).toHaveAttribute('href', '/dashboard/inventory/import');
    expect(screen.getByText('Agregar producto').closest('a')).toHaveAttribute('href', '/dashboard/inventory/new');
    expect(rowButton('CAMISETA BÁSICA', 'Editar')).toHaveAttribute('href', '/dashboard/inventory/edit/1');
  });

  it('muestra el aviso de stock bajo cuando el backend reporta productos agotados', async () => {
    api.set('GET', /^\/inventory\/low-stock$/, ok([{ id: 2, name: 'GORRA NEGRA', stock: 0, minStock: 2 }, { id: 1, name: 'CAMISETA BÁSICA', stock: 1, minStock: 2 }]));
    await renderPage(<InventoryPage />);
    await waitForCall(api, 'GET', /^\/inventory\/low-stock$/);
    await waitFor(() => expect(screen.getByText('por agotarse')).toBeInTheDocument());
    expect(screen.getByText(/agotado/)).toBeInTheDocument();
  });

  it('deep link ?open=<id> abre el detalle del producto', async () => {
    const { navState } = await import('@/test/behaviorHarness');
    navState.search = 'open=1';
    await renderPage(<InventoryPage />);
    await waitForCall(api, 'GET', /^\/inventory\/1$/);
    expect(await screen.findByText('Detalles del Producto')).toBeInTheDocument();
    expect(router.replace).toHaveBeenCalledWith('/dashboard/inventory');
  });
});

describe('Inventario · permisos', () => {
  afterEach(() => vi.restoreAllMocks());

  it('el asesor solo consulta: sin exportar, importar, crear, editar ni eliminar', async () => {
    resetBehavior({ role: 'ASESOR' });
    const api = inventoryApi();
    await renderPage(<InventoryPage />);
    await waitForCall(api, 'GET', /^\/inventory$/);
    expect(screen.queryByText('Exportar Excel')).toBeNull();
    expect(screen.queryByText('Importar Excel')).toBeNull();
    expect(screen.queryByText('Agregar producto')).toBeNull();
    expect(rowButton('CAMISETA BÁSICA', 'Ver detalle')).toBeTruthy();
    expect(queryRowButton('CAMISETA BÁSICA', 'Editar')).toBeNull();
    expect(queryRowButton('CAMISETA BÁSICA', 'Eliminar')).toBeNull();
  });

  it('el administrador crea y edita pero no elimina', async () => {
    resetBehavior({ role: 'ADMIN' });
    const api = inventoryApi();
    await renderPage(<InventoryPage />);
    await waitForCall(api, 'GET', /^\/inventory$/);
    expect(screen.getByText('Agregar producto')).toBeInTheDocument();
    expect(rowButton('CAMISETA BÁSICA', 'Editar')).toBeTruthy();
    expect(queryRowButton('CAMISETA BÁSICA', 'Eliminar')).toBeNull();
  });
});

describe('Inventario · crear', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = inventoryApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('verifica sedes, categorías, marcas y proveedores antes de mostrar el formulario', async () => {
    await renderPage(<NewProductPage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await waitForCall(api, 'GET', /^\/categories$/);
    await waitForCall(api, 'GET', /^\/brands$/);
    await waitForCall(api, 'GET', /^\/providers$/);
    expect(await screen.findByText('Crear Producto nuevo')).toBeInTheDocument();
  });

  it('si faltan categorías, bloquea el formulario y enlaza a crearlas', async () => {
    api.set('GET', /^\/categories$/, list([]));
    await renderPage(<NewProductPage />);
    await waitForCall(api, 'GET', /^\/categories$/);
    expect(await screen.findByText('Antes de crear un producto')).toBeInTheDocument();
    expect(screen.getByText('Categorías').closest('a')).toHaveAttribute('href', '/dashboard/categories/new');
    expect(screen.queryByText('Crear Producto nuevo')).toBeNull();
  });

  it('crea el producto con su variante única, precios numéricos y sube imágenes', async () => {
    await renderPage(<NewProductPage />);
    await screen.findByText('Crear Producto nuevo');
    await waitForCall(api, 'GET', /^\/units-of-measure$/);
    await settle();
    setField('name', 'camisa nueva');
    await typeInto(placeholder('Ej: 20'), '5');
    setField('salePrice', '25000');
    setField('purchasePrice', '12000');
    setField('localId', '1');
    setField('categoryId', '3');
    setField('brandId', '4');
    setField('providerId', '7');
    setField('status', 'ACTIVO');
    if (document.querySelector('[name="unitId"]')) setField('unitId', '1');
    expect(document.querySelector('[name="salePrice"]').value).toBe(formatCOP(25000));
    await submitForm();
    const call = await waitForCall(api, 'POST', /^\/inventory$/);
    expect(call.body).toMatchObject({
      name: 'CAMISA NUEVA',
      salePrice: 25000,
      purchasePrice: 12000,
      localId: 1,
      categoryId: 3,
      brandId: 4,
      providerId: 7,
      status: 'ACTIVO',
      variants: [{ color: 'ÚNICO', stock: 5 }],
    });
    expect('stock' in call.body).toBe(false);
    const img = await waitForCall(api, 'PUT', /^\/inventory\/9\/images$/);
    expect(img.body).toBeInstanceOf(FormData);
    const t = await expectToast('success', 'Producto creado');
    expect(t.url).toBe('/dashboard/inventory');
  });

  it('el costo total de compra calcula el costo unitario según la cantidad', async () => {
    await renderPage(<NewProductPage />);
    await screen.findByText('Crear Producto nuevo');
    await settle();
    await typeInto(placeholder('Ej: 20'), '4');
    setField('purchaseTotal', '40000');
    expect(document.querySelector('[name="purchasePrice"]').value).toBe(formatCOP(10000));
  });

  it('un error del backend al crear se muestra como aviso', async () => {
    api.set('POST', /^\/inventory$/, fail(400, 'Ya existe un producto con ese código de barras'));
    await renderPage(<NewProductPage />);
    await screen.findByText('Crear Producto nuevo');
    await settle();
    setField('name', 'repetido');
    await typeInto(placeholder('Ej: 20'), '1');
    setField('salePrice', '1000');
    setField('purchasePrice', '500');
    setField('localId', '1');
    setField('categoryId', '3');
    setField('brandId', '4');
    setField('providerId', '7');
    setField('status', 'ACTIVO');
    if (document.querySelector('[name="unitId"]')) setField('unitId', '1');
    await submitForm();
    await waitForCall(api, 'POST', /^\/inventory$/);
    await expectToast('error', 'código de barras');
    expect(api.count('PUT', /images$/)).toBe(0);
  });
});

describe('Inventario · editar', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    authState.params = { id: '1' };
    api = inventoryApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('el dueño precarga el producto y guarda con PUT (incluida la baja de stock)', async () => {
    await renderPage(<EditProductPage />);
    await waitForCall(api, 'GET', /^\/inventory\/1$/);
    await waitFor(() => expect(document.querySelector('[name="name"]').value).toBe('CAMISETA BÁSICA'));
    await settle();
    const qty = screen.getByDisplayValue('12');
    await typeInto(qty, '4');
    setField('salePrice', '27000');
    await submitForm();
    const call = await waitForCall(api, 'PUT', /^\/inventory\/1$/);
    expect(call.body.variants).toEqual([{ id: 11, color: 'ÚNICO', stock: 4 }]);
    expect(call.body.salePrice).toBe(27000);
    expect(call.body.name).toBe('CAMISETA BÁSICA');
    for (const k of ['id', 'createdAt', 'local', 'provider', 'category', 'brand', 'images']) {
      expect(k in call.body, `no debe viajar ${k}`).toBe(false);
    }
    await waitForCall(api, 'PUT', /^\/inventory\/1\/images$/);
    const t = await expectToast('success', 'Producto actualizado');
    expect(t.url).toBe('/dashboard/inventory');
    expect(api.count('POST', /^\/stock-requests$/)).toBe(0);
  });

  it('un asesor que baja el stock debe pedir autorización (solicitud con motivo)', async () => {
    resetBehavior({ role: 'ASESOR' });
    authState.params = { id: '1' };
    await renderPage(<EditProductPage />);
    await waitForCall(api, 'GET', /^\/inventory\/1$/);
    await waitFor(() => expect(document.querySelector('[name="name"]').value).toBe('CAMISETA BÁSICA'));
    await settle();
    await typeInto(screen.getByDisplayValue('12'), '4');
    await submitForm();
    expect(await screen.findByText('Solicitar disminución de stock')).toBeInTheDocument();
    expect(api.count('PUT', /^\/inventory\/1$/)).toBe(0);
    await typeInto(placeholder('Ej: producto vencido, avería, ajuste por conteo físico…'), 'conteo físico');
    await click(button('Enviar solicitud'));
    await waitForCall(api, 'PUT', /^\/inventory\/1$/);
    const req = await waitForCall(api, 'POST', /^\/stock-requests$/);
    expect(req.body).toMatchObject({ inventoryId: 1, reason: 'conteo físico', lines: [{ variantId: 11, requestedStock: 4 }] });
    await expectToast('success', 'Solicitud de disminución enviada');
  });

  it('subir el stock como asesor no requiere autorización', async () => {
    resetBehavior({ role: 'ASESOR' });
    authState.params = { id: '1' };
    await renderPage(<EditProductPage />);
    await waitForCall(api, 'GET', /^\/inventory\/1$/);
    await waitFor(() => expect(document.querySelector('[name="name"]').value).toBe('CAMISETA BÁSICA'));
    await settle();
    await typeInto(screen.getByDisplayValue('12'), '20');
    await submitForm();
    const call = await waitForCall(api, 'PUT', /^\/inventory\/1$/);
    expect(call.body.variants[0].stock).toBe(20);
    expect(screen.queryByText('Solicitar disminución de stock')).toBeNull();
  });
});
