// Columnas del Excel de inventario (importar / exportar), según la vertical.
// Se comparten entre el importador (auto-mapeo + plantilla) y la exportación,
// de modo que un Excel exportado se puede volver a importar tal cual.

// Campos del CRM a los que se pueden mapear columnas del Excel, según la vertical.
//  - pf: resultado de getProductFields(company.type, company.typeProductFields)
//  - productLabel: término del producto en esta vertical (t.product)
export function getInventoryExcelFields(pf, productLabel = 'producto') {
  const variantType = pf?.variantType || 'simple';
  const isColor = variantType === 'color';
  const isWeight = variantType === 'weight';

  return [
    {
      key: 'name',
      label: `Nombre del ${String(productLabel || 'producto').toLowerCase()}`,
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
    pf?.category && {
      key: 'categoryName',
      label: 'Categoría',
      syn: ['categoria', 'category', 'rubro', 'linea', 'familia', 'grupo'],
    },
    pf?.brand && {
      key: 'brandName',
      label: 'Marca',
      syn: ['marca', 'brand', 'laboratorio', 'fabricante'],
    },
    pf?.provider && {
      key: 'providerName',
      label: 'Proveedor',
      syn: ['proveedor', 'provider', 'supplier', 'distribuidor'],
    },
    pf?.barcode && {
      key: 'barcode',
      label: 'Código de barras',
      syn: ['codigo', 'codigo de barras', 'barcode', 'ean', 'cod', 'referencia', 'ref', 'codigo barras'],
    },
    isColor && {
      key: 'color',
      label: 'Color',
      syn: ['color', 'colour'],
    },
    isColor && pf?.size && {
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
}

// Convierte los productos del endpoint /inventory/export en filas de Excel.
// En verticales por color (ropa/calzado/etc.) cada variante (color/talla) es una
// fila con el mismo nombre de producto (así lo entiende el importador); en el
// resto, una fila por producto con el stock total.
export function productsToExcelRows(products, fields, pf) {
  const variantType = pf?.variantType || 'simple';
  const isColor = variantType === 'color';
  const totalStock = (p) =>
    (p.variants || []).reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  const cell = (p, v, key) => {
    switch (key) {
      case 'name':
        return p.name ?? '';
      case 'salePrice':
        return p.salePrice ?? '';
      case 'purchasePrice':
        return p.purchasePrice ?? '';
      case 'stock':
        return isColor ? (v ? Number(v.stock) || 0 : 0) : totalStock(p);
      case 'categoryName':
        return p.categoryName ?? '';
      case 'brandName':
        return p.brandName ?? '';
      case 'providerName':
        return p.providerName ?? '';
      case 'barcode':
        return p.barcode ?? '';
      case 'color':
        return v?.color && v.color !== 'ÚNICO' ? v.color : '';
      case 'size':
        return v?.size ?? '';
      case 'unit':
        return p.unit && p.unit !== 'UNIDAD' ? p.unit : '';
      case 'localName':
        return p.localName ?? '';
      case 'minStock':
        return p.minStock ?? 0;
      case 'description':
        return p.description ?? '';
      default:
        return '';
    }
  };

  const rows = [];
  for (const p of products || []) {
    const variants = p.variants || [];
    if (isColor && variants.length > 0) {
      for (const v of variants) rows.push(fields.map((f) => cell(p, v, f.key)));
    } else {
      rows.push(fields.map((f) => cell(p, null, f.key)));
    }
  }
  return rows;
}

// Genera y descarga el archivo .xlsx (SheetJS, ya instalado) con los mismos
// encabezados que la plantilla de importación.
export async function downloadInventoryXlsx({ products, fields, pf, filename }) {
  const XLSX = await import('xlsx');
  const header = fields.map((f) => f.label + (f.required ? ' *' : ''));
  const rows = productsToExcelRows(products, fields, pf);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws['!cols'] = fields.map((f) => ({ wch: f.key === 'name' ? 32 : f.key === 'description' ? 36 : 18 }));
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, filename || `inventario-${stamp}.xlsx`);
  return rows.length;
}
