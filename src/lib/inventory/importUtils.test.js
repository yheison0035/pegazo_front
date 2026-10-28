import { describe, it, expect } from 'vitest';
import {
  parseNumber, isDeleteFlag, autoMapColumns, rowsToObjects, buildImportItems,
  indexCurrentInventory, classifyRow, diffRow, hasKey,
} from './importUtils';

const FIELDS = [
  { key: 'id', syn: ['id', 'id producto'] },
  { key: 'sku', syn: ['sku', 'codigo sku'] },
  { key: 'status', syn: ['estado', 'status'] },
  { key: 'delete', syn: ['eliminar', 'borrar'] },
  { key: 'name', syn: ['nombre', 'producto', 'descripcion'], required: true },
  { key: 'salePrice', num: true, syn: ['precio', 'precio venta', 'venta', 'pvp', 'valor'] },
  { key: 'purchasePrice', num: true, syn: ['costo', 'compra', 'precio compra'] },
  { key: 'stock', num: true, syn: ['stock', 'cantidad', 'existencias'] },
  { key: 'categoryName', syn: ['categoria'] },
  { key: 'minStock', num: true, syn: ['stock minimo', 'minimo'] },
  { key: 'description', syn: ['descripcion', 'detalle'] },
];
const PRODUCT_KEYS = ['id', 'sku', 'status', 'delete', 'name', 'salePrice', 'purchasePrice', 'categoryName', 'minStock', 'description'];
const hdr = (labels) => labels.map((label, index) => ({ index, label }));

describe('parseNumber (formatos colombianos y mixtos)', () => {
  it.each([
    ['1.500', 1500], ['1.500,50', 1500.5], ['1,500.50', 1500.5], ['$ 1.500', 1500],
    ['1,5', 1.5], ['1500', 1500], [50000, 50000], ['12.5', 12.5], ['', ''], [null, ''], ['abc', ''],
  ])('%s → %s', (v, n) => expect(parseNumber(v)).toBe(n));
});

describe('isDeleteFlag', () => {
  it.each(['SÍ', 'si', 'Si', 'X', '1', 'true', 'VERDADERO', 'eliminar'])('%s = eliminar', (v) => {
    expect(isDeleteFlag(v)).toBe(true);
  });
  it.each(['', 'no', '0', 'false', null, undefined, 'NO'])('%s = no eliminar', (v) => {
    expect(isDeleteFlag(v)).toBe(false);
  });
});

describe('autoMapColumns — regresión del cruce de precios', () => {
  it('con el export real ("Precio compra" ANTES de "Precio venta") NO cruza venta y compra', () => {
    const headers = hdr(['ID', 'SKU', 'Nombre', 'Categoría', 'Precio compra', 'Precio venta', 'Stock', 'Stock mínimo', 'Estado', 'Descripción', 'Eliminar']);
    const m = autoMapColumns(FIELDS, headers);
    expect(headers[m.salePrice].label).toBe('Precio venta');
    expect(headers[m.purchasePrice].label).toBe('Precio compra');
    expect(headers[m.stock].label).toBe('Stock');
    expect(headers[m.minStock].label).toBe('Stock mínimo');
    expect(headers[m.name].label).toBe('Nombre');
    expect(headers[m.description].label).toBe('Descripción');
    expect(headers[m.delete].label).toBe('Eliminar');
  });
  it('sigue mapeando por inclusión lo que no tiene coincidencia exacta', () => {
    const m = autoMapColumns(FIELDS, hdr(['Nombre del artículo', 'Precio de venta público', 'Cant.']));
    expect(m.name).toBe(0);
    expect(m.salePrice).toBe(1);
  });
  it('una columna no se asigna dos veces', () => {
    const m = autoMapColumns(FIELDS, hdr(['Descripción']));
    expect(m.name).toBe(0);
    expect(m.description).toBe('');
  });
});

describe('rowsToObjects', () => {
  it('conserva filas con nombre o con llave y descarta las vacías', () => {
    const mapping = { name: 0, sku: 1, salePrice: 2 };
    const objs = rowsToObjects([['Pan', '', '1.500'], ['', 'SKU-1', ''], ['', '', '']], mapping, FIELDS);
    expect(objs.map((o) => o.row)).toEqual([2, 3]);
    expect(objs[0].salePrice).toBe(1500);
  });
});

describe('buildImportItems — regresión del stock en 0', () => {
  const base = { productKeys: PRODUCT_KEYS, isColor: false, hasSize: false };
  it('si la columna Stock NO se mapeó (vacía), NO envía stock en las actualizaciones', () => {
    const items = buildImportItems([{ row: 2, sku: 'A-1', name: 'X', stock: '' }], base);
    expect(items[0]).not.toHaveProperty('stock');
  });
  it('si trae stock real lo envía tal cual (incluido 0 y decimales)', () => {
    const items = buildImportItems([
      { row: 2, sku: 'A-1', name: 'X', stock: 0 },
      { row: 3, sku: 'A-2', name: 'Y', stock: 12.5 },
    ], base);
    expect(items[0].stock).toBe(0);
    expect(items[1].stock).toBe(12.5);
  });
  it('filas nuevas crean una variante ÚNICO; con color agrupa por nombre', () => {
    const simple = buildImportItems([{ row: 2, name: 'Nuevo', salePrice: 10, stock: 3 }], base);
    expect(simple[0].variants).toEqual([{ color: 'ÚNICO', stock: 3 }]);
    const color = buildImportItems([
      { row: 2, name: 'Camisa', salePrice: 10, color: 'Rojo', size: 'M', stock: 2 },
      { row: 3, name: 'camisa', salePrice: 10, color: 'Rojo', size: 'M', stock: 1 },
      { row: 4, name: 'Camisa', salePrice: 10, color: 'Azul', stock: 5 },
    ], { ...base, isColor: true, hasSize: true });
    expect(color).toHaveLength(1);
    expect(color[0].variants).toEqual([{ color: 'Rojo', size: 'M', stock: 3 }, { color: 'Azul', stock: 5 }]);
  });
  it('la bandera Eliminar viaja al backend', () => {
    const items = buildImportItems([{ row: 2, sku: 'A-1', name: 'X', delete: 'SÍ', stock: '' }], base);
    expect(items[0].delete).toBe('SÍ');
  });
});

describe('classifyRow + diffRow (revisión de cambios)', () => {
  const current = indexCurrentInventory([
    { id: 7, sku: 'A-1', name: 'Afeitadora', salePrice: 120000, purchasePrice: 40000, stock: 3, status: 'ACTIVO', categoryName: 'Hogar' },
  ]);
  const mapping = { sku: 1, name: 2, salePrice: 3, purchasePrice: 4, stock: 5, status: 6, categoryName: 7 };

  it('ID/SKU inexistente → error (no se importa)', () => {
    expect(classifyRow({ sku: 'NOPE', name: 'x' }, current, mapping).action).toBe('error');
  });
  it('con Eliminar=SÍ → eliminar', () => {
    expect(classifyRow({ sku: 'a-1', name: 'x', delete: 'si' }, current, mapping).action).toBe('delete');
  });
  it('actualización: solo reporta lo que cambia, con antes→después', () => {
    const r = classifyRow({ sku: 'A-1', name: 'Afeitadora', salePrice: 45000, purchasePrice: 40000, stock: 3, status: 'ACTIVO', categoryName: 'hogar' }, current, mapping);
    expect(r.action).toBe('update');
    expect(r.diff).toEqual([{ label: 'P. venta', old: '120000', next: '45000' }]);
  });
  it('el stock solo se compara cuando hay SKU (por ID no aplica)', () => {
    const d = diffRow({ id: '7', name: 'Afeitadora', stock: 99 }, current.byId['7'], { ...mapping, id: 0 });
    expect(d.find((x) => x.label === 'Stock')).toBeUndefined();
  });
  it('fila nueva sin precio → error; con precio → crear', () => {
    expect(classifyRow({ name: 'Nuevo', salePrice: '' }, current, mapping).action).toBe('error');
    expect(classifyRow({ name: 'Nuevo', salePrice: 10 }, current, mapping).action).toBe('create');
  });
  it('hasKey detecta ID o SKU', () => {
    expect(hasKey({ id: 1 })).toBe(true);
    expect(hasKey({ sku: ' ' })).toBe(false);
  });
});
