export const getEmptyProvider = () => ({
  name: '',
  contactName: '',
  phone: '',
  email: '',
  city: '',
  department: '',
  address: '',
  productType: '',
  status: 'ACTIVO',
});

export const getFormFieldsProviders = () => [
  { name: 'name', label: 'Empresa', type: 'text', required: true },
  {
    name: 'contactName',
    label: 'Nombre de Contacto',
    type: 'text',
    required: true,
  },
  { name: 'phone', label: 'Celular', type: 'text', required: true },
  {
    name: 'email',
    label: 'Correo Electrónico',
    type: 'email',
    required: true,
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
      { id: 'ACTIVO', name: 'ACTIVO' },
      { id: 'INACTIVO', name: 'INACTIVO' },
    ],
  },
];

export const getHeaderTableProviders = () => [
  { name: 'name', title: 'Empresa', show: true },
  { name: 'contactName', title: 'Nombre de Contacto', show: true },
  { name: 'email', title: 'Correo Electrónico', show: false },
  { name: 'productType', title: 'Tipo de Producto', show: true },
  { name: 'address', title: 'Dirección', show: true },
  { name: 'city', title: 'Ciudad', show: true },
  { name: 'department', title: 'Departamento', show: false },
  { name: 'status', title: 'Estado', show: true },
  { name: 'phone', title: 'Teléfono', show: true },
];
