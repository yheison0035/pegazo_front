export const getEmptyLocal = () => ({
  name: '',
  address: '',
  department: '',
  city: '',
  phone: '',
  userId: '',
  status: '',
});

export const getFormFieldsLocals = () => [
  { name: 'name', label: 'Nombre del Local', type: 'text', required: true },
  { name: 'address', label: 'Dirección', type: 'text', required: true },
  { name: 'department', label: 'Departamento', type: 'text', required: true },
  { name: 'city', label: 'Ciudad', type: 'text', required: true },
  { name: 'phone', label: 'Celular', type: 'text', required: true },
  {
    name: 'userId',
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
      { id: 'ACTIVO', name: 'ACTIVO' },
      { id: 'INACTIVO', name: 'INACTIVO' },
    ],
  },
];

export const getHeaderTableLocals = () => [
  { name: 'name', title: 'Nombre del Local', show: true },
  { name: 'address', title: 'Dirección', show: true },
  { name: 'department', title: 'Departamento', show: false },
  { name: 'city', title: 'Ciudad', show: true },
  { name: 'userId', title: 'Encargado', show: true },
  { name: 'status', title: 'Estado', show: true },
  { name: 'phone', title: 'Teléfono', show: true },
];
