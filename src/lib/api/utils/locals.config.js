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
  { name: 'managerId', title: 'Encargado', show: true },
  { name: 'status', title: 'Estado', show: true },
  { name: 'phone', title: 'Teléfono', show: true },
];

export const viewModalConfig = {
  title: 'Detalles del Local',
  subtitle: 'Información completa del punto de venta',
  columns: 3,
  sections: [
    {
      fields: [
        { name: 'name', label: 'Nombre del Local' },
        { name: 'address', label: 'Dirección' },
        { name: 'phone', label: 'Teléfono' },
      ],
    },
    {
      fields: [
        { name: 'city', label: 'Ciudad' },
        { name: 'department', label: 'Departamento' },
        { name: 'status', label: 'Estado', type: 'status' },
      ],
    },
    {
      fields: [
        { name: 'createdAt', label: 'Fecha de Registro', type: 'date' },
        { name: 'manager.name', label: 'Encargado' },
        { name: 'manager.email', label: 'Correo Encargado' },
      ],
    },
  ],
  showComments: false,
};
