export const getEmptyLocal = () => ({
  name: '',
  address: '',
  department: '',
  city: '',
  phone: '',
  logo: '',
  nit: '',
  email: '',
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
    name: 'logo',
    label:
      'Logo del local (para facturas y correos; si lo dejas vacío usa el de la empresa)',
    type: 'logo',
    required: false,
  },
  {
    name: 'nit',
    label: 'NIT del local (opcional; vacío = NIT de la empresa)',
    type: 'text',
    required: false,
  },
  {
    name: 'email',
    label: 'Correo del local (opcional; vacío = correo de la empresa)',
    type: 'text',
    required: false,
  },
  {
    name: 'managerId',
    label: 'Encargado',
    type: 'select',
    required: false,
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
  { name: 'name', title: 'Nombre del Local', show: true, showInput: true },
  { name: 'address', title: 'Dirección', show: true, showInput: true },
  { name: 'department', title: 'Departamento', show: false, showInput: false },
  { name: 'city', title: 'Ciudad', show: true, showInput: true },
  { name: 'managerId', title: 'Encargado', show: true, showInput: true },
  { name: 'status', title: 'Estado', show: true, showInput: true },
  { name: 'phone', title: 'Teléfono', show: true, showInput: true },
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
        { name: 'nit', label: 'NIT del local' },
        { name: 'email', label: 'Correo del local' },
      ],
    },
  ],
  showComments: false,
};
