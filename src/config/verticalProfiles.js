// Perfil de campos por vertical: qué campos de PRODUCTO aplican a cada tipo de
// negocio. Junto con `businessTypes.js` (módulos del menú) y `terminology.js`
// (vocabulario), estos tres archivos definen cada vertical. Buenas prácticas:
// un solo lugar por concern, y el resto usa el DEFAULT.
//
//  - brand    : marca (laboratorio en droguería, marca de ropa/producto)
//  - provider : proveedor
//  - barcode  : código de barras
//  - size     : talla (ropa/calzado)
//  - unit     : unidad de venta (permite "por peso / kg")
//  - category : categoría
//  - oldPrice : precio anterior (promociones)

const DEFAULT_PRODUCT_FIELDS = {
  brand: true,
  provider: true,
  barcode: true,
  size: false,
  unit: false,
  category: true,
  oldPrice: true,
  expiry: false, // vencimiento + lote (droguería / perecederos)
};

// Solo se declara lo que difiere del DEFAULT.
const PRODUCT_FIELDS_BY_TYPE = {
  // Retail con marca + código de barras
  COMERCIO: {},
  SUPERMERCADO: { unit: true, expiry: true },
  DROGUERIA: { unit: true, expiry: true },

  // Ropa: marca + talla, sin venta por peso
  ROPA: { size: true },

  // Frutas y verduras: sin marca ni código de barras, se vende por peso
  FRUVER: { brand: false, barcode: false, unit: true },

  // Floristería: sin marca ni código de barras
  FLORISTERIA: { brand: false, barcode: false },

  // Cafetería / panadería: sin marca
  CAFETERIA: { brand: false, provider: false },

  // Servicios (barbería, spa): los "productos" son insumos simples, sin marca
  SERVICIOS: { brand: false, provider: false, barcode: false, oldPrice: false },

  // Odontología: insumos clínicos, con marca y proveedor
  ODONTOLOGIA: { oldPrice: false },

  // Restaurante / comidas rápidas: los "platos" no tienen marca ni código
  RESTAURANTE: { brand: false, barcode: false, oldPrice: false },
  COMIDA_RAPIDA: { brand: false, provider: false, barcode: false, oldPrice: false },

  // Televentas / distribución / ecommerce: retail estándar
  TELEVENTAS: {},
  DISTRIBUCION: {},
  ECOMMERCE: {},
};

export function getProductFields(type) {
  return { ...DEFAULT_PRODUCT_FIELDS, ...(PRODUCT_FIELDS_BY_TYPE[type] || {}) };
}
