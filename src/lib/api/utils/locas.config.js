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

export const getHeaderTableLocals = () => [
  { name: 'code', title: 'Código', show: true },
  { name: 'name', title: 'Nombre del Local', show: true },
  { name: 'address', title: 'Dirección', show: true },
  { name: 'department', title: 'Departamento', show: false },
  { name: 'city', title: 'Ciudad', show: true },
  { name: 'phone', title: 'Teléfono', show: false },
  { name: 'managerId', title: 'Encargado', show: true },
  { name: 'status', title: 'Estado', show: true },
];
