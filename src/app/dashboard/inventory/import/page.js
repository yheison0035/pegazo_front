'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import useTerms from '@/hooks/useTerms';
import { getProductFields } from '@/config/verticalProfiles';
import { colorOptions } from '@/lib/api/utils/getColors';
import { bulkImportProducts, exportInventory } from '@/lib/api/routes/inventory';
import { getLocals } from '@/lib/api/routes/locals';
import { getCategories } from '@/lib/api/routes/categories';
import { getBrands } from '@/lib/api/routes/brands';
import { getProviders } from '@/lib/api/routes/providers';
import { downloadCsv } from '@/utils/exportCsv';

// Normaliza un encabezado para comparar (minúsculas, sin tildes ni símbolos).
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Parser de números tolerante a formatos ($ 1.500, 1.500,50, 1,500.50, 1500).
function parseNumber(v) {
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
const normStr = (v) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
const isDeleteFlag = (v) =>
  ['si', 'x', '1', 'true', 'verdadero', 'eliminar', 'borrar'].includes(
    normStr(v),
  );

// Campos comparables (antes→después) al ACTUALIZAR, con su regla de cambio
// (igual que la lógica del backend: una referencia solo cambia si trae valor).
const DIFF_FIELDS = [
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

export default function ImportInventory() {
  const router = useRouter();
  const { usuario } = useAuth();
  const t = useTerms();
  const fileRef = useRef(null);
  // Índice del inventario actual (bySku/byId) para recomputar diffs al editar.
  const reviewMapsRef = useRef(null);

  const company = usuario?.company || {};
  const pf = getProductFields(company.type, company.typeProductFields);
  // Cómo maneja el stock esta vertical:
  //  - 'color'  → por color (y talla en ropa/calzado): varias filas con el mismo
  //    producto se agrupan en un producto con varias variantes.
  //  - 'weight' → por peso (cantidad decimal, con unidad kg/libra/arroba).
  //  - 'simple' → una sola cantidad.
  const variantType = pf.variantType || 'simple';
  const isColor = variantType === 'color';
  const isWeight = variantType === 'weight';

  // Campos del CRM a los que se pueden mapear columnas del Excel, según la vertical.
  const FIELDS = useMemo(() => {
    const list = [
      // Llaves para ACTUALIZAR (vienen del Excel exportado). Si se dejan vacías,
      // la fila crea un producto nuevo. No tocar al exportar y reimportar.
      {
        key: 'id',
        label: 'ID',
        syn: ['id', 'id producto', 'idproducto', 'id_producto'],
      },
      {
        key: 'sku',
        label: 'SKU',
        syn: ['sku', 'codigo sku', 'codigo interno', 'cod sku'],
      },
      {
        key: 'status',
        label: 'Estado',
        syn: ['estado', 'status', 'activo'],
      },
      {
        key: 'delete',
        label: 'Eliminar',
        syn: ['eliminar', 'borrar', 'quitar', 'delete', 'dar de baja', 'baja'],
      },
      {
        key: 'name',
        label: `Nombre del ${t.product?.toLowerCase() || 'producto'}`,
        required: true,
        syn: ['nombre', 'producto', 'articulo', 'item', 'descripcion', 'name', 'title', 'detalle'],
      },
      {
        key: 'salePrice',
        label: 'Precio de venta',
        required: true,
        num: true,
        syn: ['precio', 'precio venta', 'venta', 'precio de venta', 'pvp', 'price', 'valor', 'precio publico', 'publico'],
      },
      {
        key: 'purchasePrice',
        label: 'Precio de compra / costo',
        num: true,
        syn: ['costo', 'compra', 'precio compra', 'precio de compra', 'costo unitario', 'cost', 'purchase'],
      },
      {
        key: 'stock',
        label: isWeight ? 'Cantidad (peso)' : 'Cantidad / stock',
        num: true,
        syn: ['stock', 'cantidad', 'existencias', 'inventario', 'qty', 'quantity', 'unidades', 'cant', 'existencia', 'peso'],
      },
      pf.category && {
        key: 'categoryName',
        label: 'Categoría',
        syn: ['categoria', 'category', 'rubro', 'linea', 'familia', 'grupo'],
      },
      pf.brand && {
        key: 'brandName',
        label: 'Marca',
        syn: ['marca', 'brand', 'laboratorio', 'fabricante'],
      },
      pf.provider && {
        key: 'providerName',
        label: 'Proveedor',
        syn: ['proveedor', 'provider', 'supplier', 'distribuidor'],
      },
      pf.barcode && {
        key: 'barcode',
        label: 'Código de barras',
        syn: ['codigo', 'codigo de barras', 'barcode', 'ean', 'cod', 'referencia', 'ref', 'codigo barras'],
      },
      isColor && {
        key: 'color',
        label: 'Color',
        syn: ['color', 'colour'],
      },
      isColor && pf.size && {
        key: 'size',
        label: 'Talla',
        syn: ['talla', 'size', 'numero', 'num'],
      },
      isWeight && {
        key: 'unit',
        label: 'Unidad (KG/LIBRA/ARROBA)',
        syn: ['unidad', 'medida', 'unit', 'um'],
      },
      {
        key: 'localName',
        label: 'Local / punto de venta',
        syn: ['local', 'sede', 'punto de venta', 'bodega', 'almacen', 'store', 'sucursal'],
      },
      {
        key: 'minStock',
        label: 'Stock mínimo (alerta)',
        num: true,
        syn: ['stock minimo', 'minimo', 'min stock', 'alerta stock', 'alerta'],
      },
      {
        key: 'description',
        label: 'Descripción',
        syn: ['descripcion', 'detalle', 'description', 'observacion', 'nota'],
      },
    ].filter(Boolean);
    return list;
  }, [pf, isColor, isWeight, t.product]);

  // Listas ya existentes en la empresa, para los desplegables de la plantilla.
  const [lists, setLists] = useState({
    localName: [],
    categoryName: [],
    brandName: [],
    providerName: [],
  });

  useEffect(() => {
    const names = (res) =>
      (res?.data || [])
        .map((x) => String(x?.name || '').trim())
        .filter(Boolean);
    Promise.allSettled([
      getLocals({ all: true }),
      getCategories({ all: true }),
      getBrands({ all: true }),
      getProviders({ all: true }),
    ]).then(([lo, ca, br, pr]) => {
      setLists({
        localName: lo.status === 'fulfilled' ? names(lo.value) : [],
        categoryName: ca.status === 'fulfilled' ? names(ca.value) : [],
        brandName: br.status === 'fulfilled' ? names(br.value) : [],
        providerName: pr.status === 'fulfilled' ? names(pr.value) : [],
      });
    });
  }, []);

  // upload | map | review | importing | done
  const [step, setStep] = useState('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]); // [{index, label}]
  const [rows, setRows] = useState([]); // array de arrays (sin encabezado)
  const [mapping, setMapping] = useState({}); // { fieldKey: columnIndex|'' }
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  // Revisión de cambios (antes de importar): filas-objeto con su acción/diff,
  // editables en línea. `reviewLoading` mientras se trae el inventario actual.
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Auto-mapeo en DOS FASES para evitar colisiones por sinónimos genéricos.
  // IMPORTANTE: la fase EXACTA va primero. Antes, el sinónimo genérico 'precio'
  // de salePrice hacía match por inclusión con "Precio compra" (que aparece antes
  // en el export) y se INTERCAMBIABAN precio de venta y de compra. Con la fase
  // exacta, "Precio venta"→salePrice y "Precio compra"→purchasePrice sin ambigüedad.
  const autoMap = (hdrs) => {
    const map = {};
    const used = new Set();
    FIELDS.forEach((f) => {
      map[f.key] = '';
    });
    const pass = (match) => {
      FIELDS.forEach((f) => {
        if (map[f.key] !== '') return; // ya asignado en una fase anterior
        const hit = hdrs.find(
          (h) =>
            !used.has(h.index) &&
            f.syn.some((s) => match(norm(h.label), norm(s))),
        );
        if (hit) {
          map[f.key] = hit.index;
          used.add(hit.index);
        }
      });
    };
    // Fase 1: coincidencia EXACTA (la más confiable).
    pass((n, ns) => n === ns);
    // Fase 2: por inclusión (una contiene a la otra), solo para lo que falte.
    pass((n, ns) => n.includes(ns) || ns.includes(n));
    return map;
  };

  const onFile = async (file) => {
    if (!file) return;
    setError('');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        raw: false,
        blankrows: false,
      });
      if (!aoa.length) {
        setError('El archivo está vacío.');
        return;
      }
      const hdrs = (aoa[0] || []).map((label, index) => ({
        index,
        label: String(label || `Columna ${index + 1}`),
      }));
      const dataRows = aoa
        .slice(1)
        .filter((r) => r.some((c) => String(c).trim() !== ''));
      if (!dataRows.length) {
        setError('No hay filas de datos debajo del encabezado.');
        return;
      }
      setFileName(file.name);
      setHeaders(hdrs);
      setRows(dataRows);
      setMapping(autoMap(hdrs));
      setStep('map');
    } catch (e) {
      setError('No se pudo leer el archivo. Asegúrate de que sea Excel (.xlsx) o CSV.');
    }
  };

  // Campos a nivel de PRODUCTO (los de variante —color/talla/stock— se manejan
  // aparte según la vertical).
  const PRODUCT_KEYS = [
    // Llaves de ACTUALIZACIÓN (vienen del Excel exportado): si traen valor, la
    // fila actualiza ese producto/variante en vez de crear uno nuevo.
    'id',
    'sku',
    'status',
    'delete',
    'name',
    'salePrice',
    'purchasePrice',
    'categoryName',
    'brandName',
    'providerName',
    'barcode',
    'localName',
    'minStock',
    'description',
    'unit',
  ];

  const hasKey = (o) =>
    String(o.sku || '').trim() !== '' || String(o.id || '').trim() !== '';

  // Cada fila del Excel → objeto con todos los campos mapeados (parseados).
  // Conserva filas con nombre O con llave (ID/SKU), para no perder las de
  // actualizar/eliminar aunque se edite el nombre.
  const rowsToObjects = () => {
    const get = (row, key) => {
      const idx = mapping[key];
      if (idx === '' || idx === undefined || idx === null) return '';
      return row[idx] ?? '';
    };
    return rows
      .map((row, i) => {
        const o = { row: i + 2 };
        FIELDS.forEach((f) => {
          const v = get(row, f.key);
          o[f.key] = f.num ? parseNumber(v) : String(v).trim();
        });
        return o;
      })
      .filter(
        (o) =>
          String(o.name || '').trim() !== '' ||
          String(o.sku || '').trim() !== '' ||
          String(o.id || '').trim() !== '',
      );
  };

  // Construye los productos normalizados listos para el backend A PARTIR de una
  // lista de filas-objeto (las de la revisión, ya editadas), ADAPTANDO el stock
  // a la vertical: por color/talla (agrupa) o una sola cantidad (peso/simple).
  const buildItemsFrom = (objs) => {
    const pick = (o) => {
      const p = { row: o.row };
      PRODUCT_KEYS.forEach((k) => {
        if (o[k] !== undefined) p[k] = o[k];
      });
      return p;
    };

    // Filas con SKU o ID = ACTUALIZAR/ELIMINAR (van solas, no se agrupan).
    const updateRows = objs.filter(hasKey);
    const createRows = objs.filter((o) => !hasKey(o) && o.name);
    const updateItems = updateRows.map((o) => {
      const p = pick(o);
      p.stock = Number(o.stock) || 0;
      return p;
    });

    if (!isColor) {
      const creates = createRows.map((o) => {
        const p = pick(o);
        p.variants = [{ color: 'ÚNICO', stock: Number(o.stock) || 0 }];
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
      const size = pf.size ? (o.size || '').trim() || null : null;
      const stock = Number(o.stock) || 0;
      const same = p.variants.find(
        (v) => v.color === color && (v.size || null) === (size || null),
      );
      if (same) same.stock += stock;
      else p.variants.push({ color, ...(size ? { size } : {}), stock });
    }
    return [...updateItems, ...groups.values()];
  };

  // Clasifica una fila contra el inventario actual: crear | actualizar |
  // eliminar | error, y calcula el diff (antes→después) de las actualizaciones.
  const classify = (o, maps) => {
    if (hasKey(o)) {
      const sku = String(o.sku || '').trim();
      const idk = String(o.id || '').trim();
      const cur = sku ? maps.bySku[sku.toLowerCase()] : maps.byId[idk];
      if (!cur) {
        return {
          action: 'error',
          error: 'No se encontró el producto (ID/SKU) en el inventario',
        };
      }
      if (isDeleteFlag(o.delete)) return { action: 'delete', cur };
      return { action: 'update', cur, diff: diffRow(o, cur) };
    }
    if (!String(o.name || '').trim()) {
      return { action: 'error', error: 'Falta el nombre del producto' };
    }
    if (!(Number(o.salePrice) > 0)) {
      return { action: 'error', error: 'Falta el precio de venta (o es 0)' };
    }
    return { action: 'create' };
  };

  // Lista de campos cambiados (solo los mapeados y que pasan la regla del
  // backend) de una fila de actualización respecto al producto actual.
  const diffRow = (o, cur) => {
    const out = [];
    const hasSku = String(o.sku || '').trim() !== '';
    for (const f of DIFF_FIELDS) {
      if (mapping[f.key] === '' || mapping[f.key] == null) continue;
      // El stock solo se actualiza por SKU (variante); por ID no aplica.
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
        if (sNew !== sOld) changed = true; // vacío = borra
      } else if (f.type === 'upper') {
        if (sNew !== '' && sNew.toUpperCase() !== sOld.toUpperCase())
          changed = true;
      } else if (f.type === 'status') {
        const up = sNew.toUpperCase();
        if (
          (up === 'ACTIVO' || up === 'INACTIVO') &&
          up !== sOld.toUpperCase()
        )
          changed = true;
      } else if (f.type === 'ref') {
        if (sNew !== '' && sNew.toLowerCase() !== sOld.toLowerCase())
          changed = true;
      }
      if (changed) out.push({ label: f.label, old: sOld || '—', next: sNew || '—' });
    }
    return out;
  };

  // Entra al paso de revisión: trae el inventario actual, clasifica cada fila.
  const enterReview = async () => {
    setError('');
    setReviewLoading(true);
    try {
      const res = await exportInventory();
      const current = res?.data || res || [];
      const maps = { bySku: {}, byId: {} };
      for (const c of current) {
        if (c.sku) maps.bySku[String(c.sku).toLowerCase()] = c;
        if (c.id != null) maps.byId[String(c.id)] = c;
      }
      const objs = rowsToObjects().map((o) => ({ ...o, _meta: classify(o, maps) }));
      // Guardamos los mapas en el primer item para recomputar al editar.
      setReviewItems(objs);
      reviewMapsRef.current = maps;
      setReviewFilter('all');
      setStep('review');
    } catch (e) {
      setError(
        'No se pudo cargar el inventario actual para comparar. Intenta de nuevo.',
      );
    } finally {
      setReviewLoading(false);
    }
  };

  // Edita un campo de una fila en la revisión y recalcula su acción/diff.
  const editReview = (idx, key, value) => {
    setReviewItems((items) =>
      items.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, [key]: value };
        next._meta = classify(next, reviewMapsRef.current || { bySku: {}, byId: {} });
        return next;
      }),
    );
  };

  const missingRequired = FIELDS.filter(
    (f) => f.required && (mapping[f.key] === '' || mapping[f.key] == null),
  );

  // Red de seguridad: avisa si los precios quedaron cruzados (venta↔compra).
  const mappedHeader = (key) => {
    const idx = mapping[key];
    return idx === '' || idx == null ? '' : norm(headers[idx]?.label || '');
  };
  const priceSwapWarn =
    mappedHeader('salePrice').includes('compra') ||
    (mappedHeader('purchasePrice').includes('venta') &&
      !mappedHeader('purchasePrice').includes('compra'));

  const doImport = async () => {
    // Importa las filas YA revisadas/editadas (sin las marcadas como error).
    const source = reviewItems.filter((o) => o._meta?.action !== 'error');
    const items = buildItemsFrom(source);
    if (!items.length) {
      setError('No hay filas válidas para importar.');
      return;
    }
    setError('');
    setStep('importing');
    try {
      const res = await bulkImportProducts(items);
      setResult(res?.data || res);
      setStep('done');
    } catch (e) {
      setError(e?.message || 'No se pudo completar la carga.');
      setStep('review');
    }
  };

  // Descarga la plantilla ideal (xlsx) con las columnas de ESTA vertical + ejemplos.
  // Letra de columna de Excel a partir de un índice 1-based (1->A, 27->AA).
  const colLetter = (n) => {
    let s = '';
    while (n > 0) {
      const m = (n - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };

  const downloadTemplate = async () => {
    const cols = FIELDS.map((f) => f.label + (f.required ? ' *' : ''));
    // Valor de ejemplo por campo, pudiendo variar por "variante" (color/talla).
    const val = (key, variant = {}) => {
      switch (key) {
        case 'name':
          return variant.name ?? 'Ejemplo producto 1';
        case 'salePrice':
          return 50000;
        case 'purchasePrice':
          return 30000;
        case 'stock':
          return variant.stock ?? (isWeight ? 12.5 : 10);
        case 'categoryName':
          return lists.categoryName[0] || 'General';
        case 'brandName':
          return lists.brandName[0] || 'Marca A';
        case 'providerName':
          return lists.providerName[0] || 'Proveedor A';
        case 'barcode':
          return '7701234567890';
        case 'color':
          return variant.color ?? 'Negro';
        case 'size':
          return variant.size ?? 'M';
        case 'unit':
          return 'KG';
        case 'minStock':
          return 2;
        case 'description':
          return 'Descripción opcional';
        default:
          return '';
      }
    };
    const rowFor = (variant) => FIELDS.map((f) => val(f.key, variant));

    const exampleRows = isColor
      ? [
          // Mismo producto en 2 filas → se agrupa en 2 variantes (color/talla).
          rowFor({ name: 'Camiseta ejemplo', color: 'Negro', size: 'M', stock: 10 }),
          rowFor({ name: 'Camiseta ejemplo', color: 'Blanco', size: 'L', stock: 7 }),
          rowFor({ name: 'Producto ejemplo 2', color: 'Rojo', size: 'S', stock: 5 }),
        ]
      : [
          rowFor({ name: 'Ejemplo producto 1' }),
          rowFor({ name: 'Ejemplo producto 2', stock: isWeight ? 8 : 5 }),
        ];

    // ExcelJS permite DESPLEGABLES (data validation) con los datos ya existentes,
    // permitiendo además escribir valores nuevos (showErrorMessage: false).
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Inventario');
    ws.addRow(cols);
    exampleRows.forEach((r) => ws.addRow(r));

    // Encabezado fijo (se queda visible al desplazarse) y bonito.
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    const headerRow = ws.getRow(1);
    headerRow.height = 22;
    cols.forEach((_, i) => {
      const f = FIELDS[i];
      const cell = headerRow.getCell(i + 1);
      cell.font = { bold: true, color: { argb: 'FF374151' } };
      cell.alignment = { vertical: 'middle' };
      // Obligatorios en naranja suave; opcionales en gris claro.
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: f?.required ? 'FFFDE8D5' : 'FFF3F4F6' },
      };
      ws.getColumn(i + 1).width = f?.key === 'name' ? 28 : 20;
    });

    // Filas de ejemplo en gris/itálica, para que el cliente sepa que las puede
    // reemplazar.
    for (let r = 2; r <= 1 + exampleRows.length; r++) {
      ws.getRow(r).font = { italic: true, color: { argb: 'FF9CA3AF' } };
    }

    // Formato de número en las columnas de dinero/cantidad (se ve como 50.000).
    FIELDS.forEach((f, i) => {
      if (['salePrice', 'purchasePrice', 'minStock'].includes(f.key))
        ws.getColumn(i + 1).numFmt = '#,##0';
      if (f.key === 'stock') ws.getColumn(i + 1).numFmt = isWeight ? '#,##0.###' : '#,##0';
    });

    // Notas de ayuda al pasar el mouse por el encabezado.
    const NOTES = {
      name: 'Obligatorio. Nombre del producto tal como lo quieres ver.',
      salePrice: 'Obligatorio. Solo números, sin puntos ni $ (ej: 50000).',
      purchasePrice: 'Costo de compra. Solo números (ej: 30000).',
      stock: isWeight
        ? 'Cantidad disponible (admite decimales, ej: 12.5).'
        : 'Cantidad disponible.',
      color: 'Elige del desplegable o escribe el color. Para varios colores, repite el nombre del producto en varias filas.',
      size: 'Talla. Para varias tallas, repite el nombre del producto en varias filas.',
      localName: 'Elige el local del desplegable. Si lo escribes mal, se crea uno repetido.',
      categoryName: 'Elige o escribe. Si no existe, se crea al importar.',
      brandName: 'Elige o escribe. Si no existe, se crea al importar.',
      providerName: 'Elige o escribe. Si no existe, se crea al importar.',
      unit: 'Unidad de venta: KG, LIBRA o ARROBA.',
    };
    FIELDS.forEach((f, i) => {
      if (NOTES[f.key]) headerRow.getCell(i + 1).note = NOTES[f.key];
    });

    // Hoja oculta con las listas para alimentar los desplegables: las de la
    // empresa (local/categoría/marca/proveedor) y las fijas (color/unidad).
    const listData = {
      localName: lists.localName,
      categoryName: lists.categoryName,
      brandName: lists.brandName,
      providerName: lists.providerName,
      ...(isColor ? { color: colorOptions.map((c) => c.name) } : {}),
      ...(isWeight ? { unit: ['KG', 'LIBRA', 'ARROBA'] } : {}),
    };
    const wsListas = wb.addWorksheet('Listas');
    const listRef = {}; // fieldKey -> { letter, lastRow }
    let lcol = 1;
    for (const key of Object.keys(listData)) {
      const vals = (listData[key] || []).filter(Boolean);
      if (!vals.length) continue;
      const letter = colLetter(lcol);
      wsListas.getCell(`${letter}1`).value = key;
      vals.forEach((v, i) => (wsListas.getCell(`${letter}${i + 2}`).value = v));
      listRef[key] = { letter, lastRow: vals.length + 1 };
      lcol++;
    }
    wsListas.state = 'hidden';

    // Aplica el desplegable a cada columna con lista presente en la plantilla.
    Object.keys(listRef).forEach((key) => {
      const idx = FIELDS.findIndex((f) => f.key === key);
      const ref = listRef[key];
      if (idx < 0 || !ref || ref.lastRow < 2) return;
      const letter = colLetter(idx + 1);
      ws.dataValidations.add(`${letter}2:${letter}1000`, {
        type: 'list',
        allowBlank: true,
        formulae: [`=Listas!$${ref.letter}$2:$${ref.letter}$${ref.lastRow}`],
        showErrorMessage: false, // permite escribir valores nuevos
        // OJO: no poner showDropDown (en OOXML está invertido y ocultaría la flecha).
      });
    });

    // Hoja de instrucciones.
    const tips = [
      ['Cómo llenar la plantilla'],
      ['1) Reemplaza las filas de EJEMPLO (en gris) por tus productos.'],
      ['2) Las columnas con * son obligatorias: nombre y precio de venta.'],
      ['3) En Local, Categoría, Marca y Proveedor usa el DESPLEGABLE (la flechita) con lo que ya tienes; también puedes escribir uno nuevo y se crea al importar.'],
      ['4) Escribe bien el nombre del LOCAL para no crear uno repetido por error.'],
      ['5) Los precios van en números, sin puntos ni $ (ej: 50000).'],
      ['Puedes usar tus propios nombres de columna: el sistema los detecta al importar.'],
    ];
    if (isColor) {
      tips.push([
        pf.size
          ? 'Para varios colores/tallas de un mismo producto, repite el NOMBRE en varias filas y cambia Color/Talla y Cantidad.'
          : 'Para varios colores de un mismo producto, repite el NOMBRE en varias filas y cambia Color y Cantidad.',
      ]);
    } else if (isWeight) {
      tips.push([
        'La Cantidad admite decimales (ej: 12.5) y la Unidad es kg/libra/arroba.',
      ]);
    }
    const wsTips = wb.addWorksheet('Instrucciones');
    tips.forEach((t2) => wsTips.addRow(t2));
    wsTips.getColumn(1).width = 95;
    wsTips.getRow(1).font = { bold: true };

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-inventario.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const previewRows = rows.slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-5xl p-3 sm:p-6">
      <button
        onClick={() => router.push('/dashboard/inventory')}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Volver al inventario
      </button>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
          Importar {t.productPlural?.toLowerCase() || 'productos'} por Excel
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Sube tu propio archivo: el sistema detecta tus columnas y las ajusta
          solo. Al terminar verás un resumen de lo cargado.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ExclamationTriangleIcon className="h-5 w-5 flex-none" />
          {error}
        </div>
      )}

      {/* PASO 1: subir */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-orange-100 bg-orange-50/60 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                ¿No tienes un formato? Descarga la plantilla ideal
              </p>
              <p className="text-xs text-gray-500">
                Trae exactamente las columnas que necesita tu tipo de negocio.
              </p>
            </div>
            <button
              onClick={() =>
                downloadTemplate().catch(() =>
                  setError('No se pudo generar la plantilla. Intenta de nuevo.'),
                )
              }
              className="inline-flex flex-none items-center gap-2 rounded-xl border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50"
            >
              <ArrowDownTrayIcon className="h-5 w-5" /> Descargar plantilla
            </button>
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-14 text-center transition hover:border-orange-300 hover:bg-orange-50/30"
          >
            <DocumentArrowUpIcon className="h-10 w-10 text-gray-300" />
            <span className="text-sm font-semibold text-gray-700">
              Haz clic para elegir tu archivo
            </span>
            <span className="text-xs text-gray-400">
              Excel (.xlsx, .xls) o CSV — hasta 3.000 filas
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* PASO 2: mapear columnas + preview */}
      {step === 'map' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-sm text-gray-600">
              Archivo: <b>{fileName}</b> · {rows.length} filas detectadas
            </p>
            <button
              onClick={() => {
                setStep('upload');
                setRows([]);
                setHeaders([]);
                setReviewItems([]);
              }}
              className="text-xs font-semibold text-orange-600 hover:underline"
            >
              Cambiar archivo
            </button>
          </div>

          {isColor && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Este negocio maneja stock por {pf.size ? 'color y talla' : 'color'}.
              Para varias variantes de un mismo producto, <b>repite el nombre</b>{' '}
              en varias filas y cambia{' '}
              {pf.size ? 'el color/talla' : 'el color'} y la cantidad — se
              agruparán en un solo producto.
            </div>
          )}

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ¿Vienes de <b>Exportar Excel</b>? Las filas con <b>ID</b> o{' '}
            <b>SKU</b> <b>actualizan</b> el producto (no duplican). Para{' '}
            <b>sacar</b> un producto del inventario, escribe <b>SÍ</b> en la
            columna <b>Eliminar</b> de esa fila — el historial de ventas se
            conserva. Borrar la fila del Excel no elimina nada.
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="mb-1 text-sm font-bold text-gray-800">
              Relaciona tus columnas
            </p>
            <p className="mb-4 text-xs text-gray-500">
              Ajustamos automáticamente lo que detectamos. Revisa y corrige si
              hace falta. Los campos con <span className="text-red-500">*</span>{' '}
              son obligatorios.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className="flex flex-col">
                  <label className="mb-1 text-xs font-semibold text-gray-600">
                    {f.label}{' '}
                    {f.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={mapping[f.key] === '' ? '' : mapping[f.key]}
                    onChange={(e) =>
                      setMapping((m) => ({
                        ...m,
                        [f.key]:
                          e.target.value === '' ? '' : Number(e.target.value),
                      }))
                    }
                    className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                      f.required &&
                      (mapping[f.key] === '' || mapping[f.key] == null)
                        ? 'border-red-300'
                        : 'border-gray-200 focus:border-orange-400'
                    }`}
                  >
                    <option value="">— No importar —</option>
                    {headers.map((h) => (
                      <option key={h.index} value={h.index}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
              <p className="text-sm font-bold text-gray-700">
                Vista previa (primeras {previewRows.length} filas)
              </p>
              <span className="text-[11px] text-gray-400 sm:hidden">
                desliza →
              </span>
            </div>
            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-400">
                    {FIELDS.map((f) => (
                      <th key={f.key} className="whitespace-nowrap px-3 py-2">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewRows.map((row, ri) => (
                    <tr key={ri}>
                      {FIELDS.map((f) => {
                        const idx = mapping[f.key];
                        const raw =
                          idx === '' || idx == null ? '' : (row[idx] ?? '');
                        const val = f.num ? parseNumber(raw) : raw;
                        return (
                          <td
                            key={f.key}
                            className="whitespace-nowrap px-3 py-2 text-gray-700"
                          >
                            {val === '' ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {missingRequired.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Falta asignar: {missingRequired.map((f) => f.label).join(', ')}.
            </div>
          )}

          {priceSwapWarn && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              ⚠️ <b>Revisa los precios:</b> parece que “Precio de venta” y “Precio
              de compra” quedaron cruzados. Confírmalos en los desplegables de
              arriba antes de continuar — un cruce cambia los precios al importar.
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => router.push('/dashboard/inventory')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 sm:w-auto"
            >
              Cancelar
            </button>
            <button
              onClick={enterReview}
              disabled={missingRequired.length > 0 || reviewLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50 sm:w-auto"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              {reviewLoading ? 'Analizando…' : `Revisar cambios (${rows.length})`}
            </button>
          </div>
        </div>
      )}

      {/* PASO 2.5: revisar cambios (validar y editar antes de importar) */}
      {step === 'review' &&
        (() => {
          const counts = reviewItems.reduce(
            (a, it) => {
              a[it._meta?.action] = (a[it._meta?.action] || 0) + 1;
              return a;
            },
            { create: 0, update: 0, delete: 0, error: 0 },
          );
          const importable =
            counts.create + counts.update + counts.delete;
          const chips = [
            { id: 'all', label: `Todos (${reviewItems.length})`, cls: 'text-gray-700' },
            { id: 'create', label: `Crear (${counts.create})`, cls: 'text-emerald-700' },
            { id: 'update', label: `Actualizar (${counts.update})`, cls: 'text-blue-700' },
            { id: 'delete', label: `Eliminar (${counts.delete})`, cls: 'text-amber-700' },
            { id: 'error', label: `Con error (${counts.error})`, cls: 'text-red-700' },
          ];
          const ACTION = {
            create: { label: 'Crear', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Icon: PlusCircleIcon },
            update: { label: 'Actualizar', cls: 'bg-blue-50 text-blue-700 ring-blue-200', Icon: PencilSquareIcon },
            delete: { label: 'Eliminar', cls: 'bg-amber-50 text-amber-700 ring-amber-200', Icon: TrashIcon },
            error: { label: 'Error', cls: 'bg-red-50 text-red-700 ring-red-200', Icon: ExclamationTriangleIcon },
          };
          return (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-sm text-gray-600">
                  Revisa los cambios antes de aplicar. Puedes <b>editar</b> aquí
                  mismo si algo quedó mal; no necesitas volver al Excel.
                </p>
                <button
                  onClick={() => setStep('map')}
                  className="text-xs font-semibold text-orange-600 hover:underline"
                >
                  ← Volver a columnas
                </button>
              </div>

              {/* Filtros por tipo de cambio */}
              <div className="flex flex-wrap gap-2">
                {chips.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setReviewFilter(c.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      reviewFilter === c.id
                        ? 'border-orange-400 bg-orange-50 text-orange-700'
                        : `border-gray-200 bg-white ${c.cls} hover:bg-gray-50`
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {counts.error > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Hay <b>{counts.error}</b> fila(s) con error: no se importarán.
                  Corrígelas abajo (nombre, precio o la llave ID/SKU) y
                  desaparecerá el error.
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="max-h-[60vh] overflow-auto [-webkit-overflow-scrolling:touch]">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50 text-left text-[11px] font-semibold uppercase text-gray-400 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
                      <tr>
                        <th className="px-3 py-2">Acción</th>
                        <th className="px-3 py-2">Nombre</th>
                        <th className="px-3 py-2">ID/SKU</th>
                        <th className="px-3 py-2 text-right">P. venta</th>
                        <th className="px-3 py-2 text-right">P. compra</th>
                        <th className="px-3 py-2 text-right">Stock</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2 text-center">Eliminar</th>
                        <th className="px-3 py-2">Cambios</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reviewItems.map((it, idx) => {
                        const action = it._meta?.action;
                        if (reviewFilter !== 'all' && action !== reviewFilter)
                          return null;
                        const a = ACTION[action] || ACTION.error;
                        const key =
                          String(it.sku || '').trim() ||
                          (it.id != null && String(it.id).trim()) ||
                          '';
                        const rowKey = hasKey(it);
                        const num = (v) =>
                          v === '' || v == null ? '' : String(v);
                        return (
                          <tr
                            key={idx}
                            className={
                              action === 'error'
                                ? 'bg-red-50/40'
                                : action === 'delete'
                                  ? 'bg-amber-50/30'
                                  : ''
                            }
                          >
                            <td className="whitespace-nowrap px-3 py-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${a.cls}`}
                              >
                                <a.Icon className="h-3.5 w-3.5" />
                                {a.label}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={it.name ?? ''}
                                onChange={(e) =>
                                  editReview(idx, 'name', e.target.value)
                                }
                                className="w-40 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-orange-400 focus:outline-none"
                              />
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-400">
                              {key || '—'}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                value={num(it.salePrice)}
                                onChange={(e) =>
                                  editReview(
                                    idx,
                                    'salePrice',
                                    parseNumber(e.target.value),
                                  )
                                }
                                className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-right text-sm focus:border-orange-400 focus:outline-none"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                value={num(it.purchasePrice)}
                                onChange={(e) =>
                                  editReview(
                                    idx,
                                    'purchasePrice',
                                    parseNumber(e.target.value),
                                  )
                                }
                                className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-right text-sm focus:border-orange-400 focus:outline-none"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                value={num(it.stock)}
                                onChange={(e) =>
                                  editReview(
                                    idx,
                                    'stock',
                                    parseNumber(e.target.value),
                                  )
                                }
                                className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-right text-sm focus:border-orange-400 focus:outline-none"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={String(it.status || '').toUpperCase()}
                                onChange={(e) =>
                                  editReview(idx, 'status', e.target.value)
                                }
                                className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-orange-400 focus:outline-none"
                              >
                                <option value="">—</option>
                                <option value="ACTIVO">Activo</option>
                                <option value="INACTIVO">Inactivo</option>
                              </select>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                disabled={!rowKey}
                                checked={isDeleteFlag(it.delete)}
                                onChange={(e) =>
                                  editReview(
                                    idx,
                                    'delete',
                                    e.target.checked ? 'SÍ' : '',
                                  )
                                }
                                className="h-4 w-4 accent-amber-600 disabled:opacity-30"
                                title={
                                  rowKey
                                    ? 'Sacar del inventario'
                                    : 'Solo para productos existentes (ID/SKU)'
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              {action === 'error' ? (
                                <span className="text-xs font-medium text-red-600">
                                  {it._meta?.error}
                                </span>
                              ) : action === 'update' ? (
                                it._meta?.diff?.length ? (
                                  <div className="flex flex-wrap gap-1">
                                    {it._meta.diff.map((d, i) => (
                                      <span
                                        key={i}
                                        className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700"
                                      >
                                        {d.label}: {d.old} → {d.next}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    Sin cambios
                                  </span>
                                )
                              ) : action === 'delete' ? (
                                <span className="text-xs font-medium text-amber-700">
                                  Se sacará del inventario
                                </span>
                              ) : (
                                <span className="text-xs text-emerald-600">
                                  Producto nuevo
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Barra fija: siempre visible, sin tener que bajar hasta el final. */}
              <div className="sticky bottom-0 z-20 -mx-3 border-t border-gray-200 bg-white/95 px-3 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] backdrop-blur sm:-mx-6 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold">
                    <span className="text-emerald-700">
                      🟢 {counts.create} crear
                    </span>
                    <span className="text-blue-700">
                      🔵 {counts.update} actualizar
                    </span>
                    <span className="text-amber-700">
                      🟡 {counts.delete} eliminar
                    </span>
                    {counts.error > 0 && (
                      <span className="text-red-700">
                        🔴 {counts.error} con error (no se importan)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep('map')}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Volver
                    </button>
                    <button
                      onClick={doImport}
                      disabled={importable === 0}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Confirmar e importar ({importable})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* PASO 3: cargando (loading hasta terminar) */}
      {step === 'importing' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-20 text-center">
          <span className="h-14 w-14 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
          <p className="mt-5 text-base font-semibold text-gray-700">
            Cargando y organizando tu inventario…
          </p>
          <p className="mt-1 text-sm text-gray-400">
            No cierres esta ventana. Esto puede tardar según la cantidad de
            productos.
          </p>
        </div>
      )}

      {/* PASO 4: resumen */}
      {step === 'done' && result && (
        <div className="space-y-4">
          <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white py-10 text-center">
            <CheckCircleIcon className="h-14 w-14 text-emerald-500" />
            <p className="mt-3 text-xl font-bold text-gray-800">
              Carga finalizada
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">
                {result.created} creados
              </span>
              {result.updated > 0 && (
                <span className="rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
                  {result.updated} actualizados
                </span>
              )}
              {result.deleted > 0 && (
                <span className="rounded-full bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700">
                  {result.deleted} eliminados
                </span>
              )}
              {result.failed > 0 && (
                <span className="rounded-full bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-700">
                  {result.failed} con error
                </span>
              )}
              <span className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-600">
                {result.total} filas en total
              </span>
            </div>
          </div>

          {result.failed > 0 && (
            <div className="overflow-hidden rounded-2xl border border-red-200 bg-white">
              <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-2.5">
                <p className="text-sm font-bold text-red-700">
                  Filas con error ({result.failed})
                </p>
                <button
                  onClick={() =>
                    downloadCsv(
                      'errores-importacion.csv',
                      result.errors.map((e) => ({
                        Fila: e.row,
                        Producto: e.name,
                        Error: e.message,
                      })),
                    )
                  }
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Descargar errores (CSV)
                </button>
              </div>
              <div className="max-h-64 overflow-auto [-webkit-overflow-scrolling:touch]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-400">
                    <tr>
                      <th className="px-3 py-2">Fila</th>
                      <th className="px-3 py-2">Producto</th>
                      <th className="px-3 py-2">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.errors.map((e, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                          {e.row}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                          {e.name || '—'}
                        </td>
                        <td className="px-3 py-2 text-red-600">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => {
                setStep('upload');
                setRows([]);
                setHeaders([]);
                setResult(null);
                setReviewItems([]);
              }}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 sm:w-auto"
            >
              Cargar otro archivo
            </button>
            <button
              onClick={() => router.push('/dashboard/inventory')}
              className="w-full rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700 sm:w-auto"
            >
              Ir al inventario
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
