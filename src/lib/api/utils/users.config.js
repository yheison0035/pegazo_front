export const getEmptyUser = () => {
  return {
    role: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    birthdate: '',
    document: '',
    department: '',
    city: '',
    localId: '',
    status: '',
    password: '',
  };
};

export const getFormFieldsUsers = () => [
  {
    name: 'role',
    label: 'Rol',
    type: 'select',
    required: true,
    source: 'roles',
    disabled: false,
  },
  { name: 'name', label: 'Nombre y Apellido', type: 'text', required: true },
  { name: 'email', label: 'Correo Electrónico', type: 'email', required: true },
  { name: 'phone', label: 'Celular', type: 'text', required: true },
  { name: 'address', label: 'Dirección', type: 'text', required: true },
  {
    name: 'birthdate',
    label: 'Fecha de Nacimiento',
    type: 'date',
    required: true,
  },
  {
    name: 'document',
    label: 'Documento',
    type: 'text',
    required: true,
  },
  { name: 'department', label: 'Departamento', type: 'select', required: true },
  { name: 'city', label: 'Ciudad', type: 'select', required: true },
  {
    name: 'localId',
    label: 'Local / Punto de Venta',
    type: 'select',
    required: true,
    source: 'locals',
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
  },
  { name: 'password', label: 'Contraseña', type: 'password' },
];

export const getHeaderTableUsers = () => {
  return [
    { name: 'role', title: 'Rol', show: true },
    { name: 'name', title: 'Nombre Completo', show: true },
    { name: 'localId', title: 'Local Asignado', show: true },
    { name: 'document', title: 'Documento', show: true },
    { name: 'email', title: 'Correo Electrónico', show: true },
    { name: 'phone', title: 'Teléfono', show: true },
    { name: 'address', title: 'Dirección', show: true },
    { name: 'birthdate', title: 'Fecha de Nacimiento', show: false },
    { name: 'department', title: 'Departamento', show: false },
    { name: 'city', title: 'Ciudad', show: false },
    { name: 'status', title: 'Estado', show: true },
    { name: 'lastLogin', title: 'Último Acceso', show: false },
    { name: 'createdAt', title: 'Fecha de Registro', show: false },
  ];
};

export const viewModalConfig = {
  title: 'Detalles del Local',
  subtitle: 'Información completa del punto de venta',
  columns: 3,
  sections: [
    {
      fields: [
        { name: 'role', label: 'Role' },
        { name: 'name', label: 'Nombre' },
        { name: 'local', label: 'Local Asignado', type: 'locals' },
        { name: 'document', label: 'Documento' },
        { name: 'department', label: 'Departamento' },
      ],
    },
    {
      fields: [
        { name: 'email', label: 'Correo Electrónico' },
        { name: 'phone', label: 'Teléfono' },
        { name: 'address', label: 'Dirección' },
        { name: 'birthdate', label: 'Fecha de Nacimiento', type: 'date' },
        { name: 'city', label: 'Ciudad' },
      ],
    },
    {
      fields: [
        { name: 'status', label: 'Estado', type: 'status' },
        { name: 'createdAt', label: 'Fecha de Registro', type: 'date' },
      ],
    },
  ],
  showComments: false,
};
