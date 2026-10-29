import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as XLSX from 'xlsx';
import {
  installApi,
  on,
  list,
  ok,
  baseRoutes,
  resetBehavior,
  renderPage,
  settle,
  screen,
  waitFor,
  click,
  fireEvent,
  waitForCall,
} from '@/test/behaviorHarness';
import ImportPage from '../import/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));

// jsdom no implementa Blob.arrayBuffer(): el lector real del navegador sí.
function ensureArrayBuffer() {
  if (typeof Blob.prototype.arrayBuffer !== 'function') {
    Blob.prototype.arrayBuffer = function arrayBuffer() {
      return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => reject(fr.error);
        fr.readAsArrayBuffer(this);
      });
    };
  }
}

function excelFile(rows, name = 'inventario.xlsx') {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([buf], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function importApi() {
  return installApi([
    on('GET', /^\/inventory\/export$/, ok([
      { id: 1, sku: 'CAM-001', name: 'CAMISETA BÁSICA', categoryName: 'General', brandName: 'Marca X', providerName: 'Proveedor Uno', localName: 'Sede Centro', barcode: '7700001', color: 'ÚNICO', purchasePrice: 12000, salePrice: 25000, stock: 12, minStock: 2, unit: 'UNIDAD', status: 'ACTIVO' },
    ])),
    on('POST', /^\/inventory\/bulk-import$/, (call) => ok({ total: call.body.items.length, created: call.body.items.length, updated: 0, deleted: 0, failed: 0, errors: [] })),
    ...baseRoutes(),
  ]);
}

async function uploadFile(file) {
  const input = document.querySelector('input[type="file"]');
  await waitFor(() => expect(input).toBeTruthy());
  fireEvent.change(input, { target: { files: [file] } });
  await settle(80);
}

describe('Inventario · importar por Excel', () => {
  let api;
  beforeEach(() => {
    ensureArrayBuffer();
    resetBehavior();
    api = importApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lee el archivo, mapea columnas solo, revisa contra el inventario e importa', async () => {
    await renderPage(<ImportPage />);
    await uploadFile(
      excelFile([
        ['Nombre', 'Precio venta', 'Precio compra', 'Stock', 'Categoría', 'Local'],
        ['Camisa roja', 30000, 15000, 4, 'General', 'Sede Centro'],
        ['Camisa azul', 32000, 16000, 2, 'General', 'Sede Centro'],
      ]),
    );
    // Paso 2: mapeo automático y botón de revisión con el número de filas.
    const review = await screen.findByRole('button', { name: /Revisar cambios \(2\)/ });
    await click(review);
    await waitForCall(api, 'GET', /^\/inventory\/export$/);
    // Paso 3: ambas filas son nuevas → se pueden importar.
    const confirm = await screen.findByRole('button', { name: /Confirmar e importar \(2\)/ });
    expect(confirm).not.toBeDisabled();
    await click(confirm);
    const call = await waitForCall(api, 'POST', /^\/inventory\/bulk-import$/);
    expect(call.body.items).toHaveLength(2);
    expect(call.body.items[0]).toMatchObject({ name: 'Camisa roja', salePrice: 30000, purchasePrice: 15000 });
    expect(JSON.stringify(call.body.items[0])).toContain('"stock":4');
    expect(await screen.findByText(/2 creados/)).toBeInTheDocument();
  });

  it('una fila con ID/SKU existente se clasifica como actualización', async () => {
    await renderPage(<ImportPage />);
    await uploadFile(
      excelFile([
        ['ID', 'SKU', 'Nombre', 'Precio venta', 'Stock'],
        [1, 'CAM-001', 'CAMISETA BÁSICA', 26000, 12],
      ]),
    );
    await click(await screen.findByRole('button', { name: /Revisar cambios \(1\)/ }));
    await waitForCall(api, 'GET', /^\/inventory\/export$/);
    const confirm = await screen.findByRole('button', { name: /Confirmar e importar \(1\)/ });
    await click(confirm);
    const call = await waitForCall(api, 'POST', /^\/inventory\/bulk-import$/);
    expect(Number(call.body.items[0].id)).toBe(1);
    expect(Number(call.body.items[0].salePrice)).toBe(26000);
  });

  it('una fila sin precio de venta queda marcada como error y no se importa', async () => {
    await renderPage(<ImportPage />);
    await uploadFile(
      excelFile([
        ['Nombre', 'Precio venta', 'Stock'],
        ['Sin precio', '', 3],
      ]),
    );
    await click(await screen.findByRole('button', { name: /Revisar cambios \(1\)/ }));
    await waitForCall(api, 'GET', /^\/inventory\/export$/);
    const confirm = await screen.findByRole('button', { name: /Confirmar e importar \(0\)/ });
    expect(confirm).toBeDisabled();
    expect(screen.getByText(/Falta el precio de venta/)).toBeInTheDocument();
    expect(api.count('POST', /bulk-import/)).toBe(0);
  });

  it('un archivo solo con encabezado avisa que no hay filas', async () => {
    await renderPage(<ImportPage />);
    await uploadFile(excelFile([['Nombre', 'Precio venta']]));
    expect(await screen.findByText('No hay filas de datos debajo del encabezado.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Revisar cambios/ })).toBeNull();
  });

  it('si el archivo no es Excel válido, lo dice sin romperse', async () => {
    await renderPage(<ImportPage />);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const bad = new File([new Uint8Array([1, 2, 3, 4])], 'raro.bin');
    await uploadFile(bad);
    await waitFor(() =>
      expect(
        screen.queryByText(/No se pudo leer el archivo/) || screen.queryByText(/No hay filas de datos/) || screen.queryByText(/El archivo está vacío/),
      ).toBeTruthy(),
    );
  });
});
