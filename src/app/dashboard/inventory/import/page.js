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
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import useTerms from '@/hooks/useTerms';
import { getProductFields } from '@/config/verticalProfiles';
import { bulkImportProducts } from '@/lib/api/routes/inventory';
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

export default function ImportInventory() {
  const router = useRouter();
  const { usuario } = useAuth();
  const t = useTerms();
  const fileRef = useRef(null);

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

  const [step, setStep] = useState('upload'); // upload | map | importing | done
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]); // [{index, label}]
  const [rows, setRows] = useState([]); // array de arrays (sin encabezado)
  const [mapping, setMapping] = useState({}); // { fieldKey: columnIndex|'' }
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const autoMap = (hdrs) => {
    const map = {};
    const used = new Set();
    FIELDS.forEach((f) => {
      const hit = hdrs.find(
        (h) =>
          !used.has(h.index) &&
          f.syn.some((s) => {
            const n = norm(h.label);
            const ns = norm(s);
            return n === ns || n.includes(ns) || ns.includes(n);
          }),
      );
      if (hit) {
        map[f.key] = hit.index;
        used.add(hit.index);
      } else {
        map[f.key] = '';
      }
    });
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

  // Construye los productos normalizados listos para el backend, ADAPTANDO el
  // stock a la vertical: por color/talla (agrupa filas del mismo producto en
  // varias variantes) o una sola cantidad (peso/simple).
  const buildItems = () => {
    const get = (row, key) => {
      const idx = mapping[key];
      if (idx === '' || idx === undefined || idx === null) return '';
      return row[idx] ?? '';
    };
    // Fila → objeto con todos los campos mapeados.
    const raw = rows
      .map((row, i) => {
        const o = { row: i + 2 };
        FIELDS.forEach((f) => {
          const v = get(row, f.key);
          o[f.key] = f.num ? parseNumber(v) : String(v).trim();
        });
        return o;
      })
      .filter((o) => o.name); // debe tener al menos nombre

    const pick = (o) => {
      const p = { row: o.row };
      PRODUCT_KEYS.forEach((k) => {
        if (o[k] !== undefined) p[k] = o[k];
      });
      return p;
    };

    if (!isColor) {
      // Peso / simple: cada fila es un producto con UNA variante cantidad.
      return raw.map((o) => {
        const p = pick(o);
        p.variants = [{ color: 'ÚNICO', stock: Number(o.stock) || 0 }];
        return p;
      });
    }

    // Color (y talla en ropa/calzado): se agrupan las filas con el MISMO nombre
    // en un producto con varias variantes.
    const groups = new Map();
    for (const o of raw) {
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
    return [...groups.values()];
  };

  const missingRequired = FIELDS.filter(
    (f) => f.required && (mapping[f.key] === '' || mapping[f.key] == null),
  );

  const doImport = async () => {
    const items = buildItems();
    if (!items.length) {
      setError('No hay filas para importar.');
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
      setStep('map');
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
    ws.getRow(1).font = { bold: true };
    cols.forEach((_, i) => (ws.getColumn(i + 1).width = 22));

    // Hoja oculta con las listas reales para alimentar los desplegables.
    const LIST_FIELDS = ['localName', 'categoryName', 'brandName', 'providerName'];
    const wsListas = wb.addWorksheet('Listas');
    const listRef = {}; // fieldKey -> { letter, lastRow }
    let lcol = 1;
    for (const key of LIST_FIELDS) {
      const vals = lists[key] || [];
      const letter = colLetter(lcol);
      wsListas.getCell(`${letter}1`).value = key;
      vals.forEach((v, i) => (wsListas.getCell(`${letter}${i + 2}`).value = v));
      listRef[key] = { letter, lastRow: vals.length + 1 };
      lcol++;
    }
    wsListas.state = 'hidden';

    // Aplica el desplegable a cada columna de lista presente en la plantilla.
    LIST_FIELDS.forEach((key) => {
      const idx = FIELDS.findIndex((f) => f.key === key);
      const ref = listRef[key];
      if (idx < 0 || !ref || ref.lastRow < 2) return; // sin datos → sin desplegable
      const letter = colLetter(idx + 1);
      ws.dataValidations.add(`${letter}2:${letter}1000`, {
        type: 'list',
        allowBlank: true,
        formulae: [`=Listas!$${ref.letter}$2:$${ref.letter}$${ref.lastRow}`],
        showErrorMessage: false, // permite escribir nombres nuevos
        showDropDown: true,
      });
    });

    // Hoja de instrucciones.
    const tips = [
      ['Cómo llenar la plantilla'],
      ['Los campos con * son obligatorios: nombre y precio de venta.'],
      ['Puedes usar tus propios nombres de columna: el sistema los detecta.'],
      ['Local, categoría, marca y proveedor traen un DESPLEGABLE con lo que ya tienes registrado.'],
      ['Puedes elegir del desplegable o escribir uno nuevo; si no existe, se crea al importar.'],
      ['Ojo: escribe bien el nombre del LOCAL para no crear uno repetido por error.'],
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
    <div className="mx-auto w-full max-w-5xl p-4">
      <button
        onClick={() => router.push('/dashboard/inventory')}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Volver al inventario
      </button>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">
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
            <p className="border-b border-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700">
              Vista previa (primeras {previewRows.length} filas)
            </p>
            <div className="overflow-x-auto">
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

          <div className="flex justify-end gap-2">
            <button
              onClick={() => router.push('/dashboard/inventory')}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={doImport}
              disabled={missingRequired.length > 0}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              Importar {rows.length} filas
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: cargando (loading hasta terminar) */}
      {step === 'importing' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-20 text-center">
          <span className="h-14 w-14 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
          <p className="mt-5 text-base font-semibold text-gray-700">
            Cargando e organizando tu inventario…
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
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-400">
                    <tr>
                      <th className="px-3 py-2">Fila</th>
                      <th className="px-3 py-2">Producto</th>
                      <th className="px-3 py-2">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.errors.map((e, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-500">{e.row}</td>
                        <td className="px-3 py-2 text-gray-700">
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

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setStep('upload');
                setRows([]);
                setHeaders([]);
                setResult(null);
              }}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cargar otro archivo
            </button>
            <button
              onClick={() => router.push('/dashboard/inventory')}
              className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700"
            >
              Ir al inventario
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
