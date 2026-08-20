// Perfil de campos por vertical: qué campos de PRODUCTO aplican a cada tipo de
// negocio. Junto con `businessTypes.js` (módulos del menú) y `terminology.js`
// (vocabulario), estos tres archivos definen cada vertical. Buenas prácticas:
// un solo lugar por concern, y el resto usa el DEFAULT.
//
//  - brand       : marca (laboratorio en droguería, marca de ropa/producto)
//  - provider    : proveedor
//  - barcode     : código de barras
//  - variantType : cómo se maneja la cantidad/variante del producto:
//        'color'  -> color (+ talla en ropa): ropa, ecommerce, televentas
//        'weight' -> cantidad por peso (kg / libra / arroba): carnicería, fruver, súper
//        'simple' -> solo cantidad (unidad): droguería, tienda, restaurante, servicios…
//  - size        : talla (solo ropa; requiere variantType 'color')
//  - category    : categoría
//  - oldPrice    : precio anterior (promociones)
//  - expiry      : vencimiento + lote (droguería / perecederos)

const DEFAULT_PRODUCT_FIELDS = {
  brand: true,
  provider: true,
  barcode: true,
  variantType: 'simple',
  size: false,
  category: true,
  oldPrice: true,
  expiry: false,
};

// Solo se declara lo que difiere del DEFAULT.
const PRODUCT_FIELDS_BY_TYPE = {
  // Retail estándar (sin color): cantidad simple
  COMERCIO: {},
  TELEVENTAS: { variantType: 'color' },
  DISTRIBUCION: {},
  ECOMMERCE: { variantType: 'color' },
  FERIA: {},

  // Súper: cantidad, con opción de peso (algunos productos por kg)
  SUPERMERCADO: { variantType: 'weight', expiry: true },
  DROGUERIA: { expiry: true },

  // Ropa: color + talla
  ROPA: { variantType: 'color', size: true },

  // Peso (kg / libra / arroba), sin marca ni código
  FRUVER: { brand: false, barcode: false, variantType: 'weight' },
  CARNICERIA: {
    brand: false,
    barcode: false,
    variantType: 'weight',
    expiry: true,
  },

  // Floristería / cafetería: cantidad simple, sin marca
  FLORISTERIA: { brand: false, barcode: false },
  CAFETERIA: { brand: false, provider: false },

  // Servicios: insumos simples sin marca
  SERVICIOS: { brand: false, provider: false, barcode: false, oldPrice: false },
  ODONTOLOGIA: { oldPrice: false },

  // Comida: cantidad simple, sin marca/código
  RESTAURANTE: { brand: false, barcode: false, oldPrice: false },
  COMIDA_RAPIDA: { brand: false, provider: false, barcode: false, oldPrice: false },
};

export function getProductFields(type) {
  return { ...DEFAULT_PRODUCT_FIELDS, ...(PRODUCT_FIELDS_BY_TYPE[type] || {}) };
}

// Opciones de unidad de venta según el tipo de variante.
export const WEIGHT_UNIT_OPTIONS = [
  { id: 'UNIDAD', name: 'Unidad' },
  { id: 'KG', name: 'Kilogramo (kg)' },
  { id: 'LIBRA', name: 'Libra (lb)' },
  { id: 'ARROBA', name: 'Arroba (@)' },
];

// Unidades que se venden con decimales (por peso).
export const WEIGHT_UNITS = ['PESO', 'KG', 'LIBRA', 'ARROBA'];

export function unitShortLabel(unit) {
  switch (unit) {
    case 'KG':
    case 'PESO':
      return 'kg';
    case 'LIBRA':
      return 'lb';
    case 'ARROBA':
      return '@';
    default:
      return '';
  }
}
