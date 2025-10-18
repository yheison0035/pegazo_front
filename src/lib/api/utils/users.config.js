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
    local: '',
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
    options: [
      { id: 'SUPER_ADMIN', name: 'SUPER_ADMIN' },
      { id: 'ADMIN', name: 'ADMIN' },
      { id: 'ASESOR', name: 'ASESOR' },
    ],
  },
  { name: 'name', label: 'Nombre y Apellido', type: 'text', required: true },
  { name: 'email', label: 'Correo Electrónico', type: 'email', required: true },
  { name: 'phone', label: 'Celular', type: 'text', required: true },
  { name: 'address', label: 'Dirección', type: 'text', required: true },
  {
    name: 'birthdate',
    label: 'Fecha de Nacimiento',
    type: 'text',
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
  { name: 'local', label: 'Local', type: 'select', required: true },
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

export const getHeaderTableUsers = () => {
  return [
    { name: 'rol', title: 'Rol', show: true },
    { name: 'name', title: 'Nombre Completo', show: true },
    { name: 'local', title: 'Local Asignado', show: true },
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
