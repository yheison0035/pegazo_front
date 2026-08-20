import { canSeeOldPrice } from '@/hooks/inventory.permissions';
import { getProductFields } from '@/config/verticalProfiles';

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
  status: 'ACTIVO',
  variants: [],
  features: [],
  specifications: [],
});

export const getFormFieldsInventory = (usuario) => {
  const canOldPrice = canSeeOldPrice(usuario);
  const fields = getProductFields(usuario?.company?.type);
  const showOldPrice = canOldPrice && fields.oldPrice;

  // Qué campos ocultar según la vertical (no todos manejan marca, etc.).
  const hidden = new Set();
  if (!fields.brand) hidden.add('brandId');
  if (!fields.provider) hidden.add('providerId');
  if (!fields.barcode) hidden.add('barcode');
  if (!fields.unit) hidden.add('unit');

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
      name: 'color',
      label: 'Color',
      type: 'colorSelect',
      required: true,
      disabled: false,
    },
    {
      name: 'stock',
      label: 'Cantidad',
      type: 'number',
      required: true,
      disabled: true,
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
    },
    {
      name: 'purchasePrice',
      label: 'Precio de Compra',
      type: 'text',
      required: true,
      disabled: false,
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
    },
    {
      name: 'unit',
      label: 'Unidad de venta',
      type: 'select',
      required: false,
      options: [
        { id: 'UNIDAD', name: 'Por unidad' },
        { id: 'PESO', name: 'Por peso (kg)' },
      ],
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

  return list.filter((f) => !hidden.has(f.name));
};

export const getHeaderTableInventory = (usuario) => {
  const showOldPrice = canSeeOldPrice(usuario);

  return [
    { name: 'image', title: 'Imagen Principal', show: true, showInput: false },
    { name: 'name', title: 'Nombre del Producto', show: true, showInput: true },
    { name: 'barcode', title: 'Codigo de barras', show: true, showInput: true },
    { name: 'stock', title: 'Cantidad', show: true, showInput: false },
    {
      name: 'localId',
      title: 'Local / Punto de Venta',
      show: true,
      showInput: true,
    },
    { name: 'providerId', title: 'Proveedor', show: true, showInput: true },
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
