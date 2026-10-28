// Lógica PURA del importador de inventario por Excel (sin React), para poder
// probarla: parseo de números, auto-mapeo de columnas, clasificación de filas
// (crear/actualizar/eliminar/error) y diff contra el inventario actual.

// Normaliza un encabezado para comparar (minúsculas, sin tildes ni símbolos).
export const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Parser de números tolerante a formatos ($ 1.500, 1.500,50, 1,500.50, 1500).
export function parseNumber(v) {
  if (v === null || v === undefined || v === '') return '';
  let s = String(v).trim().replace(/[^\d.,-]/g, '');
  if (!s) return '';
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (lastComma > -1) {
    const parts = s.split(',');
    if (parts.length > 1 && parts[parts.length - 1].length === 3)
      s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
  } else if (lastDot > -1) {
    const parts = s.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3)
      s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : '';
}

// "Eliminar" = SÍ/SI/X/1/TRUE/VERDADERO (mismo criterio que el backend).
export const normStr = (v) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
export const isDeleteFlag = (v) =>
  ['si', 'x', '1', 'true', 'verdadero', 'eliminar', 'borrar'].includes(normStr(v));

export const hasKey = (o) =>
  String(o?.sku || '').trim() !== '' || String(o?.id || '').trim() !== '';

// Campos comparables (antes→después) al ACTUALIZAR, con su regla de cambio
// (igual que el backend: una referencia solo cambia si trae valor).
export const DIFF_FIELDS = [
  { key: 'name', label: 'Nombre', type: 'str' },
  { key: 'salePrice', label: 'P. venta', type: 'num' },
  { key: 'purchasePrice', label: 'P. compra', type: 'num' },
  { key: 'stock', label: 'Stock', type: 'num' },
  { key: 'minStock', label: 'Stock mín.', type: 'num' },
  { key: 'barcode', label: 'Código', type: 'strClear' },
  { key: 'unit', label: 'Unidad', type: 'upper' },
  { key: 'status', label: 'Estado', type: 'status' },
  { key: 'categoryName', label: 'Categoría', type: 'ref' },
  { key: 'brandName', label: 'Marca', type: 'ref' },
  { key: 'providerName', label: 'Proveedor', type: 'ref' },
  { key: 'localName', label: 'Local', type: 'ref' },
  { key: 'description', label: 'Descripción', type: 'strClear' },
];

// Auto-mapeo en DOS FASES: coincidencia EXACTA primero, luego por inclusión.
// Con una sola pasada por inclusión, el sinónimo genérico 'precio' de salePrice
// hacía match con "Precio compra" (que va antes en el export) y se cruzaban los
// precios de venta y de compra al importar.
export function autoMapColumns(fields, headers) {
  const map = {};
  const used = new Set();
  fields.forEach((f) => {
    map[f.key] = '';
  });
  const pass = (match) => {
    fields.forEach((f) => {
      if (map[f.key] !== '') return;
      const hit = headers.find(
        (h) => !used.has(h.index) && f.syn.some((s) => match(norm(h.label), norm(s))),
      );
      if (hit) {
        map[f.key] = hit.index;
        used.add(hit.index);
      }
    });
  };
  pass((n, ns) => n === ns);
  pass((n, ns) => n.includes(ns) || ns.includes(n));
  return map;
}

// Cada fila del Excel → objeto con todos los campos mapeados (parseados).
// Conserva filas con nombre O con llave (ID/SKU).
export function rowsToObjects(rows, mapping, fields) {
  const get = (row, key) => {
    const idx = mapping[key];
    if (idx === '' || idx === undefined || idx === null) return '';
    return row[idx] ?? '';
  };
  return rows
    .map((row, i) => {
      const o = { row: i + 2 };
      fields.forEach((f) => {
        const v = get(row, f.key);
        o[f.key] = f.num ? parseNumber(v) : String(v).trim();
      });
      return o;
    })
    .filter((o) => String(o.name || '').trim() !== '' || hasKey(o));
}

// Productos normalizados para el backend. Filas con ID/SKU = actualizar/eliminar
// (van solas); filas nuevas = crear (agrupadas por nombre si hay color/talla).
// El stock SOLO se envía si la fila trae un valor real: si la columna Stock no
// se mapeó o va vacía, NO se toca el stock del producto (antes se forzaba 0).
export function buildImportItems(objs, { productKeys, isColor, hasSize }) {
  const pick = (o) => {
    const p = { row: o.row };
    productKeys.forEach((k) => {
      if (o[k] !== undefined) p[k] = o[k];
    });
    return p;
  };
  const stockOf = (o) => {
    const sv = o.stock;
    return sv !== '' && sv != null && Number.isFinite(Number(sv)) ? Number(sv) : undefined;
  };

  const updateRows = objs.filter(hasKey);
  const createRows = objs.filter((o) => !hasKey(o) && o.name);
  const updateItems = updateRows.map((o) => {
    const p = pick(o);
    const s = stockOf(o);
    if (s !== undefined) p.stock = s;
    return p;
  });

  if (!isColor) {
    const creates = createRows.map((o) => {
      const p = pick(o);
      p.variants = [{ color: 'ÚNICO', stock: stockOf(o) ?? 0 }];
      return p;
    });
    return [...updateItems, ...creates];
  }

  const groups = new Map();
  for (const o of createRows) {
    const key = o.name.toLowerCase();
    if (!groups.has(key)) {
      const p = pick(o);
      p.variants = [];
      groups.set(key, p);
    }
    const p = groups.get(key);
    const color = (o.color || '').trim() || 'ÚNICO';
    const size = hasSize ? (o.size || '').trim() || null : null;
    const stock = stockOf(o) ?? 0;
    const same = p.variants.find(
      (v) => v.color === color && (v.size || null) === (size || null),
    );
    if (same) same.stock += stock;
    else p.variants.push({ color, ...(size ? { size } : {}), stock });
  }
  return [...updateItems, ...groups.values()];
}

// Índice del inventario actual (filas del export) por SKU y por ID.
export function indexCurrentInventory(rows) {
  const maps = { bySku: {}, byId: {} };
  for (const c of rows || []) {
    if (c.sku) maps.bySku[String(c.sku).toLowerCase()] = c;
    if (c.id != null) maps.byId[String(c.id)] = c;
  }
  return maps;
}

// Campos cambiados (solo los mapeados y que pasan la regla del backend).
// El stock solo se actualiza por SKU (variante): por ID no aplica.
export function diffRow(o, cur, mapping) {
  const out = [];
  const hasSku = String(o.sku || '').trim() !== '';
  for (const f of DIFF_FIELDS) {
    if (mapping[f.key] === '' || mapping[f.key] == null) continue;
    if (f.key === 'stock' && !hasSku) continue;
    const nv = o[f.key];
    const ov = cur[f.key];
    const sNew = String(nv ?? '').trim();
    const sOld = String(ov ?? '').trim();
    let changed = false;
    if (f.type === 'num') {
      if (sNew !== '' && Number(nv) !== Number(ov || 0)) changed = true;
    } else if (f.type === 'str') {
      if (sNew !== '' && sNew !== sOld) changed = true;
    } else if (f.type === 'strClear') {
      if (sNew !== sOld) changed = true;
    } else if (f.type === 'upper') {
      if (sNew !== '' && sNew.toUpperCase() !== sOld.toUpperCase()) changed = true;
    } else if (f.type === 'status') {
      const up = sNew.toUpperCase();
      if ((up === 'ACTIVO' || up === 'INACTIVO') && up !== sOld.toUpperCase()) changed = true;
    } else if (f.type === 'ref') {
      if (sNew !== '' && sNew.toLowerCase() !== sOld.toLowerCase()) changed = true;
    }
    if (changed) out.push({ label: f.label, old: sOld || '—', next: sNew || '—' });
  }
  return out;
}

// Clasifica una fila contra el inventario actual: crear | actualizar |
// eliminar | error (+ diff en actualizaciones).
export function classifyRow(o, maps, mapping) {
  if (hasKey(o)) {
    const sku = String(o.sku || '').trim();
    const idk = String(o.id || '').trim();
    const cur = sku ? maps.bySku[sku.toLowerCase()] : maps.byId[idk];
    if (!cur) return { action: 'error', error: 'No se encontró el producto (ID/SKU) en el inventario' };
    if (isDeleteFlag(o.delete)) return { action: 'delete', cur };
    return { action: 'update', cur, diff: diffRow(o, cur, mapping) };
  }
  if (!String(o.name || '').trim()) return { action: 'error', error: 'Falta el nombre del producto' };
  if (!(Number(o.salePrice) > 0)) return { action: 'error', error: 'Falta el precio de venta (o es 0)' };
  return { action: 'create' };
}
