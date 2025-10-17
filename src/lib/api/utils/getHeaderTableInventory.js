export const getEmptyLocal = () => ({
  name: '',
  address: '',
  department: '',
  city: '',
  phone: '',
  managerId: '',
  status: '',
});

export const getFormFieldsLocals = () => [
  { name: 'name', label: 'Nombre del Local', type: 'text', required: true },
  { name: 'address', label: 'Dirección', type: 'text', required: true },
  { name: 'department', label: 'Departamento', type: 'text', required: true },
  { name: 'city', label: 'Ciudad', type: 'text', required: true },
  { name: 'phone', label: 'Celular', type: 'text', required: true },
  {
    name: 'managerId',
    label: 'Encargado',
    type: 'select',
    required: true,
    source: 'users',
  },
  {
    name: 'status',
    label: 'Estado',
    type: 'select',
    required: true,
    options: [
      { id: 'Activo', name: 'Activo' },
      { id: 'Inactivo', name: 'Inactivo' },
    ],
  },
];

export const getHeaderTableInventory = () => [
  { name: 'sku', title: 'Código / SKU', show: true },
  { name: 'name', title: 'Nombre del Producto', show: true },
  { name: 'color', title: 'Color', show: true },
  { name: 'stock', title: 'Cantidad', show: true },
  { name: 'local', title: 'Local / Punto de Venta', show: true },
  { name: 'provider', title: 'Proveedor', show: true },
  { name: 'purchasePrice', title: 'Precio de Compra', show: false },
  { name: 'salePrice', title: 'Precio de Venta', show: true },
  { name: 'category', title: 'Categoría', show: false },
  { name: 'brand', title: 'Marca', show: false },
  { name: 'status', title: 'Estado', show: true },
  { name: 'updatedAt', title: 'Última Actualización', show: false },
];
