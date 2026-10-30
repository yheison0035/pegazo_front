import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  autoMapColumns,
  rowsToObjects,
  indexCurrentInventory,
  classifyRow,
  buildImportItems,
  parseNumber,
} from './importUtils';

// Claves a nivel de producto que viajan al backend (mismas que import/page.js).
const PRODUCT_KEYS = ['id', 'sku', 'status', 'delete', 'name', 'salePrice', 'purchasePrice', 'categoryName', 'brandName', 'providerName', 'barcode', 'localName', 'minStock', 'description', 'unit'];

// ---------------------------------------------------------------------------
// CICLO COMPLETO exportar → reabrir el Excel → importar, con la librería de
// Excel REAL (sin mocks). Reproduce lo que pasó en EuropeaTVStore: al exportar
// y reimportar se cruzaron precio de venta/compra y se desajustó el stock.
// Estas pruebas garantizan que hoy el ciclo es FIEL: no se pierde ningún
// producto, los precios no se cruzan y el stock no se desajusta, incluso con
// miles de productos.
// ---------------------------------------------------------------------------

// Campos del importador (mismos key/syn/num que src/app/dashboard/inventory/
// import/page.js). El `label` no influye en el mapeo: autoMapColumns compara
// el encabezado del Excel contra estos sinónimos.
const FIELDS = [
  { key: 'id', syn: ['id', 'id producto', 'idproducto', 'id_producto'] },
  { key: 'sku', syn: ['sku', 'codigo sku', 'codigo interno', 'cod sku'] },
  { key: 'status', syn: ['estado', 'status', 'activo'] },
  { key: 'delete', syn: ['eliminar', 'borrar', 'quitar', 'delete', 'dar de baja', 'baja'] },
  { key: 'name', num: false, syn: ['nombre', 'producto', 'articulo', 'item', 'descripcion', 'name', 'title', 'detalle'] },
  { key: 'salePrice', num: true, syn: ['precio', 'precio venta', 'venta', 'precio de venta', 'pvp', 'price', 'valor', 'precio publico', 'publico'] },
  { key: 'purchasePrice', num: true, syn: ['costo', 'compra', 'precio compra', 'precio de compra', 'costo unitario', 'cost', 'purchase'] },
  { key: 'stock', num: true, syn: ['stock', 'cantidad', 'existencias', 'inventario', 'qty', 'quantity', 'unidades', 'cant', 'existencia', 'peso'] },
  { key: 'categoryName', syn: ['categoria', 'category', 'rubro', 'linea', 'familia', 'grupo'] },
  { key: 'brandName', syn: ['marca', 'brand', 'laboratorio', 'fabricante'] },
  { key: 'providerName', syn: ['proveedor', 'provider', 'supplier', 'distribuidor'] },
  { key: 'barcode', syn: ['codigo', 'codigo de barras', 'barcode', 'ean', 'cod', 'referencia', 'ref', 'codigo barras'] },
  { key: 'color', syn: ['color', 'colour'] },
  { key: 'size', syn: ['talla', 'size', 'numero', 'num'] },
  { key: 'unit', syn: ['unidad', 'medida', 'unit', 'um'] },
  { key: 'localName', syn: ['local', 'sede', 'punto de venta', 'bodega', 'almacen', 'store', 'sucursal'] },
  { key: 'minStock', num: true, syn: ['stock minimo', 'minimo', 'min stock', 'alerta stock', 'alerta'] },
  { key: 'description', syn: ['descripcion', 'detalle', 'description', 'observacion', 'nota'] },
];

// Mapea una fila interna del inventario (como la devuelve exportInventory) a la
// fila de columnas en español del Excel EXACTAMENTE como inventory/page.js.
function toExportRow(r) {
  return {
    ID: r.id,
    SKU: r.sku,
    Nombre: r.name,
    Categoría: r.categoryName,
    Marca: r.brandName,
    Proveedor: r.providerName,
    Local: r.localName,
    'Código de barras': r.barcode,
    Color: r.color,
    Talla: r.size,
    'Precio compra': r.purchasePrice,
    'Precio venta': r.salePrice,
    Stock: r.stock,
    'Stock mínimo': r.minStock,
    Unidad: r.unit,
    Estado: r.status,
    Descripción: r.description,
    Eliminar: '',
  };
}

// Genera un inventario interno de prueba. Precios de compra y venta SIEMPRE
// distintos (para detectar si se cruzan) y stock variado (para detectar
// desajustes). Valores grandes tipo COP.
function makeInventory(n) {
  const cats = ['Electrónica', 'Hogar', 'Ropa'];
  const out = [];
  for (let i = 1; i <= n; i++) {
    const purchase = 100000 + i * 137; // nunca igual al de venta
    out.push({
      id: i,
      sku: `SKU-${String(i).padStart(5, '0')}`,
      name: `Producto ${i}`,
      categoryName: cats[i % cats.length],
      brandName: `Marca ${i % 7}`,
      providerName: i % 3 === 0 ? '' : `Proveedor ${i % 5}`,
      localName: 'Sede Centro',
      barcode: `770${String(i).padStart(9, '0')}`,
      color: 'ÚNICO',
      size: '',
      purchasePrice: purchase,
      salePrice: purchase + 50000 + i, // venta > compra, distinto por fila
      stock: (i * 7) % 500,
      minStock: i % 10,
      unit: 'UND',
      status: i % 50 === 0 ? 'INACTIVO' : 'ACTIVO',
      description: i % 4 === 0 ? `Nota ${i}` : '',
    });
  }
  return out;
}

// Exporta con XLSX real (igual que la página) y lo reabre como lo hace el
// importador (onFile): devuelve { headers, dataRows }.
function exportThenReopen(inventory) {
  const data = inventory.map(toExportRow);
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

  const wb2 = XLSX.read(buf, { type: 'array' });
  const sheet = wb2.Sheets[wb2.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
  });
  const headers = (aoa[0] || []).map((label, index) => ({ index, label: String(label || `Columna ${index + 1}`) }));
  const dataRows = aoa.slice(1).filter((r) => r.some((c) => String(c).trim() !== ''));
  return { headers, dataRows };
}

describe('Inventario · ciclo exportar→importar (fidelidad de datos)', () => {
  it('el auto-mapeo NO cruza precio de venta con precio de compra', () => {
    const inv = makeInventory(5);
    const { headers } = exportThenReopen(inv);
    const mapping = autoMapColumns(FIELDS, headers);
    // Cada precio apunta a su propia columna, y son columnas distintas.
    expect(headers[mapping.salePrice].label).toBe('Precio venta');
    expect(headers[mapping.purchasePrice].label).toBe('Precio compra');
    expect(mapping.salePrice).not.toBe(mapping.purchasePrice);
    expect(headers[mapping.stock].label).toBe('Stock');
    expect(headers[mapping.minStock].label).toBe('Stock mínimo');
    expect(mapping.stock).not.toBe(mapping.minStock);
  });

  it('reimportar el export conserva TODOS los productos, precios y stock exactos', () => {
    const inv = makeInventory(300);
    const { headers, dataRows } = exportThenReopen(inv);
    const mapping = autoMapColumns(FIELDS, headers);
    const objs = rowsToObjects(dataRows, mapping, FIELDS);

    // No se pierde ninguna fila.
    expect(objs.length).toBe(inv.length);

    const bySku = new Map(inv.map((p) => [p.sku, p]));
    for (const o of objs) {
      const orig = bySku.get(o.sku);
      expect(orig).toBeTruthy();
      // Precio de venta y de compra NO se cruzan y se conservan exactos.
      expect(o.salePrice).toBe(orig.salePrice);
      expect(o.purchasePrice).toBe(orig.purchasePrice);
      expect(o.salePrice).not.toBe(o.purchasePrice);
      // Stock exacto (nada forzado a 0 ni desajustado).
      expect(o.stock).toBe(orig.stock);
      expect(o.minStock).toBe(orig.minStock);
      expect(o.name).toBe(orig.name);
    }
  });

  it('reimportar sin editar NADA deja todas las filas como "actualizar" SIN cambios', () => {
    const inv = makeInventory(300);
    const { headers, dataRows } = exportThenReopen(inv);
    const mapping = autoMapColumns(FIELDS, headers);
    const objs = rowsToObjects(dataRows, mapping, FIELDS);
    const maps = indexCurrentInventory(inv);

    let updatesSinCambio = 0;
    for (const o of objs) {
      const meta = classifyRow(o, maps, mapping);
      expect(meta.action).toBe('update'); // todas existen por SKU
      expect(meta.diff).toEqual([]); // NADA cambia al reimportar lo exportado
      updatesSinCambio++;
    }
    expect(updatesSinCambio).toBe(inv.length);
  });

  it('con MILES de productos el ciclo sigue siendo fiel (2500 filas)', () => {
    const inv = makeInventory(2500);
    const { headers, dataRows } = exportThenReopen(inv);
    const mapping = autoMapColumns(FIELDS, headers);
    const objs = rowsToObjects(dataRows, mapping, FIELDS);
    expect(objs.length).toBe(2500);
    const maps = indexCurrentInventory(inv);
    // Ninguna fila se pierde, cae en error, ni cambia sola.
    let errores = 0;
    let cambiosEspurios = 0;
    for (const o of objs) {
      const meta = classifyRow(o, maps, mapping);
      if (meta.action === 'error') errores++;
      if (meta.action === 'update' && meta.diff.length) cambiosEspurios++;
    }
    expect(errores).toBe(0);
    expect(cambiosEspurios).toBe(0);
  });

  it('editar en el Excel solo cambia lo editado; marcar "Eliminar" solo borra esa fila', () => {
    const inv = makeInventory(50);
    const data = inv.map(toExportRow);
    // El usuario sube el precio de venta del producto 1 y marca el 2 para borrar.
    data[0]['Precio venta'] = inv[0].salePrice + 10000;
    data[1].Eliminar = 'SÍ';

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const wb2 = XLSX.read(buf, { type: 'array' });
    const aoa = XLSX.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], { header: 1, defval: '', raw: false, blankrows: false });
    const headers = aoa[0].map((label, index) => ({ index, label: String(label) }));
    const dataRows = aoa.slice(1);
    const mapping = autoMapColumns(FIELDS, headers);
    const objs = rowsToObjects(dataRows, mapping, FIELDS);
    const maps = indexCurrentInventory(inv);

    const metas = objs.map((o) => ({ sku: o.sku, meta: classifyRow(o, maps, mapping) }));
    const m1 = metas.find((x) => x.sku === inv[0].sku).meta;
    const m2 = metas.find((x) => x.sku === inv[1].sku).meta;
    // Fila 1: una sola diferencia, el precio de venta.
    expect(m1.action).toBe('update');
    expect(m1.diff).toHaveLength(1);
    expect(m1.diff[0].label).toBe('P. venta');
    // Fila 2: eliminar.
    expect(m2.action).toBe('delete');
    // El resto: sin cambios.
    const resto = metas.filter((x) => x.sku !== inv[0].sku && x.sku !== inv[1].sku);
    expect(resto.every((x) => x.meta.action === 'update' && x.meta.diff.length === 0)).toBe(true);
  });
});

describe('Inventario · ningún campo NO modificado se altera', () => {
  // Round-trip comparando TODOS los campos de cada producto (no solo precio y
  // stock): nombre, categoría, marca, proveedor, local, código, unidad, estado,
  // descripción y stock mínimo.
  it('reimportar conserva TODOS los campos de cada producto, exactos', () => {
    const inv = makeInventory(120);
    const { headers, dataRows } = exportThenReopen(inv);
    const mapping = autoMapColumns(FIELDS, headers);
    const objs = rowsToObjects(dataRows, mapping, FIELDS);
    const bySku = new Map(inv.map((p) => [p.sku, p]));
    const CAMPOS_TEXTO = ['name', 'categoryName', 'brandName', 'providerName', 'localName', 'barcode', 'unit', 'status', 'description'];
    const CAMPOS_NUM = ['salePrice', 'purchasePrice', 'stock', 'minStock'];
    for (const o of objs) {
      const orig = bySku.get(o.sku);
      for (const k of CAMPOS_TEXTO) expect(String(o[k])).toBe(String(orig[k] ?? ''));
      for (const k of CAMPOS_NUM) expect(o[k]).toBe(orig[k]);
    }
  });

  // Edita UN campo distinto en cada fila y verifica que el diff de esa fila es
  // EXACTAMENTE ese campo, y que ninguna otra fila cambia.
  it('editar un solo campo en una fila no toca los demás campos ni las demás filas', () => {
    const inv = makeInventory(30);
    const data = inv.map(toExportRow);
    // fila → [columna de Excel, nuevo valor, etiqueta esperada en el diff]
    const edits = [
      [0, 'Nombre', 'PRODUCTO EDITADO', 'Nombre'],
      [1, 'Precio venta', inv[1].salePrice + 10000, 'P. venta'],
      [2, 'Precio compra', inv[2].purchasePrice + 5000, 'P. compra'],
      [3, 'Stock', inv[3].stock + 7, 'Stock'],
      [4, 'Stock mínimo', inv[4].minStock + 3, 'Stock mín.'],
      [5, 'Código de barras', '7700000000001', 'Código'],
      [6, 'Unidad', 'KG', 'Unidad'],
      [7, 'Estado', 'INACTIVO', 'Estado'],
      [8, 'Categoría', 'Juguetería', 'Categoría'],
      [9, 'Marca', 'Marca Nueva', 'Marca'],
      [10, 'Proveedor', 'Proveedor Nuevo', 'Proveedor'],
      [11, 'Local', 'Sede Norte', 'Local'],
      [12, 'Descripción', 'Descripción nueva', 'Descripción'],
    ];
    for (const [rowIdx, col, val] of edits) data[rowIdx][col] = val;

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const wb2 = XLSX.read(buf, { type: 'array' });
    const aoa = XLSX.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], { header: 1, defval: '', raw: false, blankrows: false });
    const headers = aoa[0].map((label, index) => ({ index, label: String(label) }));
    const dataRows = aoa.slice(1);
    const mapping = autoMapColumns(FIELDS, headers);
    const objs = rowsToObjects(dataRows, mapping, FIELDS);
    const maps = indexCurrentInventory(inv);

    const editadaPorSku = new Map(edits.map(([rowIdx, , , label]) => [inv[rowIdx].sku, label]));
    for (const o of objs) {
      const meta = classifyRow(o, maps, mapping);
      expect(meta.action).toBe('update');
      const esperado = editadaPorSku.get(o.sku);
      if (esperado) {
        // La fila editada cambia EXACTAMENTE un campo: el editado.
        expect(meta.diff).toHaveLength(1);
        expect(meta.diff[0].label).toBe(esperado);
      } else {
        // Ninguna otra fila cambia en ningún campo.
        expect(meta.diff).toEqual([]);
      }
    }
  });

  // Si una columna NO viene en el Excel, ese campo no se marca como cambio en
  // ninguna fila y NO viaja al backend (así no se desajusta lo que no tocaste).
  it('una columna ausente (Stock) no cambia ni envía stock en ninguna fila', () => {
    const inv = makeInventory(40);
    const data = inv.map(toExportRow).map((r) => {
      const { Stock, ...rest } = r; // el usuario borró la columna Stock del Excel
      return rest;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const wb2 = XLSX.read(buf, { type: 'array' });
    const aoa = XLSX.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], { header: 1, defval: '', raw: false, blankrows: false });
    const headers = aoa[0].map((label, index) => ({ index, label: String(label) }));
    const dataRows = aoa.slice(1);
    const mapping = autoMapColumns(FIELDS, headers);
    expect(mapping.stock).toBe(''); // la columna Stock no existe → no mapeada
    const objs = rowsToObjects(dataRows, mapping, FIELDS);
    const maps = indexCurrentInventory(inv);
    for (const o of objs) {
      const meta = classifyRow(o, maps, mapping);
      expect(meta.diff.find((d) => d.label === 'Stock')).toBeUndefined();
    }
    // El payload al backend NO incluye stock (antes se forzaba a 0).
    const items = buildImportItems(objs, { productKeys: PRODUCT_KEYS, isColor: false, hasSize: false });
    expect(items.every((it) => it.stock === undefined)).toBe(true);
  });

  // El payload de un update sin ediciones lleva la llave (SKU) y refleja los
  // mismos valores: no inventa ni pierde campos.
  it('el payload de actualización refleja exactamente la fila (sin inventar datos)', () => {
    const inv = makeInventory(10);
    const { headers, dataRows } = exportThenReopen(inv);
    const mapping = autoMapColumns(FIELDS, headers);
    const objs = rowsToObjects(dataRows, mapping, FIELDS);
    const items = buildImportItems(objs, { productKeys: PRODUCT_KEYS, isColor: false, hasSize: false });
    expect(items).toHaveLength(inv.length);
    const bySku = new Map(inv.map((p) => [p.sku, p]));
    for (const it of items) {
      const orig = bySku.get(it.sku);
      expect(orig).toBeTruthy();
      expect(it.name).toBe(orig.name);
      expect(it.salePrice).toBe(orig.salePrice);
      expect(it.purchasePrice).toBe(orig.purchasePrice);
      expect(it.stock).toBe(orig.stock);
      // No aparecen claves que no existan en el producto.
      expect(it).not.toHaveProperty('variants'); // es update, no create
    }
  });
});

describe('Inventario · parser de números tolerante al formato de Excel (es-CO)', () => {
  // Cuando el usuario abre el .xlsx en Excel y lo vuelve a guardar, los números
  // salen con separador de miles "." (y a veces "$"). El parser debe leerlos
  // bien para NO desajustar precios ni stock.
  it('interpreta miles con punto, símbolo y espacios sin perder el valor', () => {
    expect(parseNumber('1.250.000')).toBe(1250000);
    expect(parseNumber('$ 2.000.000')).toBe(2000000);
    expect(parseNumber('150.000')).toBe(150000);
    expect(parseNumber('15')).toBe(15);
    expect(parseNumber('1.500')).toBe(1500);
    expect(parseNumber('$ 89.900')).toBe(89900);
    expect(parseNumber('')).toBe('');
  });

  it('un export con precios formateados a la colombiana se reimporta exacto', () => {
    const inv = [
      { id: 1, sku: 'SKU-1', name: 'TV 55', salePrice: 2000000, purchasePrice: 1500000, stock: 12, minStock: 2, categoryName: 'Electrónica', brandName: 'X', providerName: 'P', localName: 'Centro', barcode: '770', color: 'ÚNICO', size: '', unit: 'UND', status: 'ACTIVO', description: '' },
    ];
    // Simula el archivo editado en Excel: números como texto con punto de miles.
    const headers = ['ID', 'SKU', 'Nombre', 'Precio compra', 'Precio venta', 'Stock', 'Stock mínimo'].map((label, index) => ({ index, label }));
    const dataRows = [['1', 'SKU-1', 'TV 55', '1.500.000', '$ 2.000.000', '12', '2']];
    const mapping = autoMapColumns(FIELDS, headers);
    const [o] = rowsToObjects(dataRows, mapping, FIELDS);
    expect(o.salePrice).toBe(2000000);
    expect(o.purchasePrice).toBe(1500000);
    expect(o.stock).toBe(12);
    const maps = indexCurrentInventory(inv);
    const meta = classifyRow(o, maps, mapping);
    expect(meta.action).toBe('update');
    expect(meta.diff).toEqual([]); // el formato de Excel no cambia los valores
  });
});
