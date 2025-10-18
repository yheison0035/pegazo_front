export const getEmptyProvider = () => ({
  name: '',
  company: '',
  contactName: '',
  phone: '',
  email: '',
  city: '',
  department: '',
  address: '',
  productType: '',
  status: '',
});

export const getFormFieldsProviders = () => [
  { name: 'name', label: 'Nombre del Proveedor', type: 'text', required: true },
  { name: 'company', label: 'Empresa', type: 'text', required: true },
  {
    name: 'contactName',
    label: 'Nombre de Contacto',
    type: 'text',
    required: false,
  },
  { name: 'phone', label: 'Celular', type: 'text', required: true },
  {
    name: 'email',
    label: 'Correo Electrónico',
    type: 'email',
    required: false,
  },
  { name: 'city', label: 'Ciudad', type: 'text', required: true },
  { name: 'department', label: 'Departamento', type: 'text', required: false },
  { name: 'address', label: 'Dirección', type: 'text', required: false },
  {
    name: 'productType',
    label: 'Tipo de Producto',
    type: 'text',
    required: true,
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

export const getHeaderTableProviders = () => [
  { name: 'code', title: 'Código', show: true },
  { name: 'name', title: 'Nombre del Proveedor', show: true },
  { name: 'company', title: 'Empresa', show: true },
  { name: 'contactName', title: 'Contacto', show: true },
  { name: 'phone', title: 'Teléfono', show: true },
  { name: 'email', title: 'Correo Electrónico', show: false },
  { name: 'city', title: 'Ciudad', show: true },
  { name: 'department', title: 'Departamento', show: false },
  { name: 'address', title: 'Dirección', show: false },
  { name: 'productType', title: 'Tipo de Producto', show: true },
  { name: 'status', title: 'Estado', show: true },
];
