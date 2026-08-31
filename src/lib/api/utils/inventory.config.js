import { canSeeOldPrice } from '@/hooks/inventory.permissions';
import {
  getProductFields,
  WEIGHT_UNIT_OPTIONS,
} from '@/config/verticalProfiles';

// Valida las variantes/cantidad de un producto SEGÚN la vertical del negocio.
// - variantType 'color' (televentas, ecommerce, ropa): cada variante necesita
//   color; el nombre del color lo maneja el selector.
// - 'simple' / 'weight' (la mayoría: tienda, droguería, restaurante, peso…): el
//   color NO aplica; solo importa que la cantidad sea válida (0 o más).
// Devuelve { ok, message }.
export function validateProductVariants(variants, usuario) {
  const fields = getProductFields(usuario?.company?.type);
  const vt = fields.variantType; // 'color' | 'weight' | 'simple'
  const list = Array.isArray(variants) ? variants : [];

  if (!list.length) {
    return {
      ok: false,
      message:
        vt === 'color'
          ? 'Agrega al menos un color con su cantidad.'
          : 'Ingresa la cantidad del producto.',
    };
  }

  for (const v of list) {
    const stock = Number(v?.stock);
    if (!Number.isFinite(stock) || stock < 0) {
      return { ok: false, message: 'La cantidad no puede ser negativa.' };
    }
    if (vt === 'color' && !String(v?.color || '').trim()) {
      return { ok: false, message: 'Cada color debe tener su nombre y cantidad.' };
    }
  }

  return { ok: true };
}

export const getEmptyInventory = () => ({
  sku: '',
  name: '',
  barcode: '',
  description: '',
  color: '',
  stock: 0,
  localId: '',
  providerId: '',
  purchasePrice: '',
  oldPrice: '',
  salePrice: '',
  categoryId: '',
  brandId: '',
  minStock: 0,
  unit: 'UNIDAD',
  trackStock: true,
  expiryDate: '',
  lot: '',
  status: 'ACTIVO',
  variants: [],
  features: [],
  specifications: [],
});

export const getFormFieldsInventory = (usuario) => {
  const canOldPrice = canSeeOldPrice(usuario);
  const fields = getProductFields(usuario?.company?.type);
  const showOldPrice = canOldPrice && fields.oldPrice;

  const vt = fields.variantType; // 'color' | 'weight' | 'simple'

  // Solo en comida tiene sentido elegir si el producto lleva existencias
  // (plato elaborado = sin stock vs. bebida = con stock). En el resto de
  // verticales todo lleva inventario, así que el interruptor se oculta.
  const type = usuario?.company?.type;
  const isFood = ['RESTAURANTE', 'COMIDA_RAPIDA', 'CAFETERIA'].includes(type);

  // Qué campos ocultar según la vertical (no todos manejan marca, etc.).
  const hidden = new Set();
  if (!isFood) hidden.add('trackStock');
  if (!fields.brand) hidden.add('brandId');
  if (!fields.provider) hidden.add('providerId');
  if (!fields.barcode) hidden.add('barcode');
  // La unidad de venta (kg/libra/arroba) solo aplica a verticales por peso.
  if (vt !== 'weight') hidden.add('unit');
  // La "Cantidad" fija (disabled) solo se muestra con variantes de color
  // (el total sale de las variantes); en simple/peso, el editor de cantidad
  // reemplaza ese campo.
  if (vt !== 'color') hidden.add('stock');
  if (!fields.expiry) {
    hidden.add('expiryDate');
    hidden.add('lot');
  }

  const list = [
    {
      name: 'name',
      label: 'Nombre del Producto',
      type: 'text',
      required: true,
      disabled: false,
    },
    {
      name: 'barcode',
      label: 'Codigo de barras',
      type: 'text',
      required: false,
      disabled: false,
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      required: false,
      disabled: false,
    },
    {
      name: 'trackStock',
      label: 'Controlar inventario (existencias)',
      type: 'checkbox',
      required: false,
      helperText:
        'Actívalo para productos con existencias (bebidas, retail). Desactívalo para elaborados al momento sin stock (platos de un menú): se pueden vender siempre.',
    },
    {
      name: 'color',
      label: 'Color',
      type: 'colorSelect',
      required: true,
      disabled: false,
      hideWhen: (fd) => fd.trackStock === false,
    },
    {
      name: 'stock',
      label: 'Cantidad',
      type: 'number',
      required: true,
      disabled: true,
      hideWhen: (fd) => fd.trackStock === false,
    },
    {
      name: 'localId',
      label: 'Local / Punto de Venta',
      type: 'select',
      required: true,
      source: 'locals',
      disabled: false,
    },
    {
      name: 'providerId',
      label: 'Proveedor',
      type: 'select',
      required: true,
      source: 'providers',
      disabled: false,
      // El proveedor solo aplica a productos con existencias (bebidas, insumos).
      hideWhen: (fd) => fd.trackStock === false,
    },
    {
      name: 'purchasePrice',
      label: 'Precio de Compra',
      type: 'text',
      required: true,
      disabled: false,
      // Un plato elaborado no tiene "precio de compra".
      hideWhen: (fd) => fd.trackStock === false,
    },

    {
      name: 'salePrice',
      label: 'Precio de Venta',
      type: 'text',
      required: true,
      disabled: false,
    },
    ...(showOldPrice
      ? [
          {
            name: 'oldPrice',
            label: 'Precio de Venta (Anteriormente)',
            type: 'text',
            required: false,
          },
        ]
      : []),
    {
      name: 'categoryId',
      label: 'Categoría',
      type: 'select',
      required: true,
      source: 'categories',
      disabled: false,
    },
    {
      name: 'brandId',
      label: 'Marca',
      type: 'select',
      required: true,
      source: 'brands',
      disabled: false,
    },
    {
      name: 'minStock',
      label: 'Alerta de stock bajo (opcional)',
      type: 'number',
      required: false,
      disabled: false,
      hideWhen: (fd) => fd.trackStock === false,
    },
    {
      name: 'unitId',
      label: 'Unidad de medida',
      type: 'select',
      required: false,
      source: 'unitsOfMeasure',
      defaultOptionName: 'UNIDAD',
      disabled: false,
    },
    {
      name: 'expiryDate',
      label: 'Fecha de vencimiento',
      type: 'date',
      required: false,
      disabled: false,
    },
    {
      name: 'lot',
      label: 'Lote',
      type: 'text',
      required: false,
      disabled: false,
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { id: 'ACTIVO', name: 'ACTIVO' },
        { id: 'INACTIVO', name: 'INACTIVO' },
      ],
      disabled: false,
    },
  ];

  return list
    .filter((f) => !hidden.has(f.name))
    .map((f) => {
      // El campo 'color' se transforma según el tipo de variante de la vertical.
      if (f.name === 'color') {
        if (vt === 'color') {
          return {
            ...f,
            type: 'colorSelect',
            label: fields.size ? 'Colores y tallas' : 'Colores y stock',
          };
        }
        return {
          ...f,
          type: 'variantQty',
          label: 'Cantidad',
          required: true,
          weight: vt === 'weight',
        };
      }
      // Unidad de venta por peso: kg / libra / arroba.
      if (f.name === 'unit' && vt === 'weight') {
        return { ...f, options: WEIGHT_UNIT_OPTIONS };
      }
      return f;
    });
};

export const getHeaderTableInventory = (usuario) => {
  const canOldPrice = canSeeOldPrice(usuario);
  const fields = getProductFields(usuario?.company?.type);
  const showOldPrice = canOldPrice && fields.oldPrice;

  return [
    { name: 'image', title: 'Imagen Principal', show: true, showInput: false },
    { name: 'name', title: 'Nombre del Producto', show: true, showInput: true },
    {
      name: 'barcode',
      title: 'Codigo de barras',
      show: fields.barcode,
      showInput: fields.barcode,
    },
    { name: 'stock', title: 'Cantidad', show: true, showInput: false },
    {
      name: 'localId',
      title: 'Local / Punto de Venta',
      show: true,
      showInput: true,
    },
    {
      name: 'providerId',
      title: 'Proveedor',
      show: fields.provider,
      showInput: fields.provider,
    },
    {
      name: 'purchasePrice',
      title: 'Precio de Compra',
      show: false,
      showInput: false,
    },
    {
      name: 'salePrice',
      title: 'Precio de Venta',
      show: true,
      showInput: true,
    },
    {
      name: 'oldPrice',
      title: 'Precio de Venta (Anteriormente)',
      show: showOldPrice,
      showInput: true,
    },
    { name: 'categoryId', title: 'Categoría', show: false, showInput: false },
    { name: 'brandId', title: 'Marca', show: false, showInput: false },
    { name: 'status', title: 'Estado', show: true, showInput: true },
    {
      name: 'updatedAt',
      title: 'Última Actualización',
      show: false,
      showInput: false,
    },
    {
      name: 'lastAudit',
      title: 'Última modificación',
      show: true,
      showInput: false,
    },
  ];
};

export const viewModalConfig = (usuario) => {
  const showOldPrice = canSeeOldPrice(usuario);

  return {
    title: 'Detalles del Producto',
    subtitle: 'Información completa del producto',
    columns: 3,
    sections: [
      {
        fields: [
          { name: 'name', label: 'Nombre del Producto' },
          { name: 'barcode', label: 'Código de barras' },
          { name: 'status', label: 'Estado', type: 'status' },
          { name: 'description', label: 'Descripción' },
        ],
      },

      {
        fields: [
          { name: 'salePrice', label: 'Precio de Venta' },
          ...(showOldPrice
            ? [
                {
                  name: 'oldPrice',
                  label: 'Precio de Venta (Anteriormente)',
                },
              ]
            : []),
          { name: 'stock', label: 'Cantidad Total' },
          { name: 'createdAt', label: 'Fecha de Creación', type: 'date' },
          { name: 'updatedAt', label: 'Última Actualización', type: 'date' },
        ],
      },

      {
        fields: [
          { name: 'category.name', label: 'Categoría' },
          { name: 'brand.name', label: 'Marca' },
          { name: 'provider.name', label: 'Proveedor' },
          { name: 'local.name', label: 'Local / Punto de Venta' },
        ],
      },
    ],
    showComments: false,
  };
};
