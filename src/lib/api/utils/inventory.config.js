import { canSeeOldPrice } from '@/hooks/inventory.permissions';

export const getEmptyInventory = () => ({
  sku: '',
  name: '',
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
  status: 'ACTIVO',
  variants: [],
});

export const getFormFieldsInventory = (usuario) => {
  const showOldPrice = canSeeOldPrice(usuario);

  return [
    {
      name: 'name',
      label: 'Nombre del Producto',
      type: 'text',
      required: true,
      disabled: false,
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      required: true,
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
};

export const getHeaderTableInventory = (usuario) => {
  const showOldPrice = canSeeOldPrice(usuario);

  return [
    { name: 'image', title: 'Imagen Principal', show: true },
    { name: 'name', title: 'Nombre del Producto', show: true },
    { name: 'stock', title: 'Cantidad', show: true },
    { name: 'localId', title: 'Local / Punto de Venta', show: true },
    { name: 'providerId', title: 'Proveedor', show: true },
    { name: 'purchasePrice', title: 'Precio de Compra', show: false },
    { name: 'salePrice', title: 'Precio de Venta', show: true },
    {
      name: 'oldPrice',
      title: 'Precio de Venta (Anteriormente)',
      show: showOldPrice,
    },
    { name: 'categoryId', title: 'Categoría', show: false },
    { name: 'brandId', title: 'Marca', show: false },
    { name: 'status', title: 'Estado', show: true },
    { name: 'updatedAt', title: 'Última Actualización', show: false },
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
          { name: 'status', label: 'Estado', type: 'status' },
          { name: 'description', label: 'Descripción' },
          { name: 'purchasePrice', label: 'Precio de Compra' },
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
