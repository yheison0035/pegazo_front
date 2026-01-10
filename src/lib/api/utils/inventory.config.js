// config/forms/inventoryConfig.js

export const getEmptyInventory = () => ({
  sku: '',
  name: '',
  color: '',
  stock: 0,
  local: '',
  providerId: '',
  purchasePrice: '',
  salePrice: '',
  categoryId: '',
  brandId: '',
  status: 'ACTIVO',
});

export const getFormFieldsInventory = () => [
  { name: 'name', label: 'Nombre del Producto', type: 'text', required: true },
  {
    name: 'color',
    label: 'Color',
    type: 'colorSelect',
    required: true,
  },
  { name: 'stock', label: 'Cantidad', type: 'number', required: true },
  {
    name: 'local',
    label: 'Local / Punto de Venta',
    type: 'select',
    required: true,
    source: 'locals',
  },
  {
    name: 'providerId',
    label: 'Proveedor',
    type: 'select',
    required: true,
    source: 'providers',
  },
  {
    name: 'purchasePrice',
    label: 'Precio de Compra',
    type: 'text',
    required: true,
  },
  { name: 'salePrice', label: 'Precio de Venta', type: 'text', required: true },
  ,
  {
    name: 'categoryId',
    label: 'Categoría',
    type: 'select',
    required: true,
    source: 'categories',
  },
  {
    name: 'brandId',
    label: 'Marca',
    type: 'select',
    required: true,
    source: 'brands',
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
  },
];

export const getHeaderTableInventory = () => [
  { name: 'image', title: 'Imagen Principal', show: true },
  { name: 'name', title: 'Nombre del Producto', show: true },
  { name: 'stock', title: 'Cantidad', show: true },
  { name: 'localId', title: 'Local / Punto de Venta', show: true },
  { name: 'providerId', title: 'Proveedor', show: true },
  { name: 'purchasePrice', title: 'Precio de Compra', show: false },
  { name: 'salePrice', title: 'Precio de Venta', show: true },
  { name: 'categoryId', title: 'Categoría', show: false },
  { name: 'brandId', title: 'Marca', show: false },
  { name: 'status', title: 'Estado', show: true },
  { name: 'updatedAt', title: 'Última Actualización', show: false },
];
