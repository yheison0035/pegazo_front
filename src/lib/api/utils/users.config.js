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
    commissionServiceRate: '',
    commissionProductRate: '',
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
  {
    name: 'name',
    label: 'Nombre y Apellido',
    type: 'text',
    source: null,
    required: true,
  },
  {
    name: 'email',
    label: 'Correo Electrónico',
    type: 'email',
    source: null,
    required: true,
  },
  {
    name: 'phone',
    label: 'Celular',
    type: 'text',
    source: null,
    required: true,
  },
  {
    name: 'address',
    label: 'Dirección',
    type: 'text',
    source: null,
    required: true,
  },
  {
    name: 'birthdate',
    label: 'Fecha de Nacimiento',
    type: 'date',
    source: null,
    required: true,
  },
  {
    name: 'document',
    label: 'Documento',
    type: 'text',
    source: null,
    required: true,
  },
  {
    name: 'department',
    label: 'Departamento',
    type: 'select',
    source: null,
    required: true,
  },
  {
    name: 'city',
    label: 'Ciudad',
    type: 'select',
    source: null,
    required: true,
  },
  {
    name: 'localId',
    label: 'Local / Punto de Venta',
    type: 'select',
    required: false,
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
    source: 'status',
    disabled: false,
  },
  {
    name: 'commissionServiceRate',
    label: 'Comisión por servicios/cortes (%) — opcional',
    type: 'number',
    source: null,
    required: false,
  },
  {
    name: 'commissionProductRate',
    label: 'Comisión por productos (%) — opcional',
    type: 'number',
    source: null,
    required: false,
  },
  {
    name: 'password',
    label: 'Contraseña',
    type: 'password',
    source: null,
    required: true,
  },
];

export const getHeaderTableUsers = () => {
  return [
    { name: 'role', title: 'Rol', show: true, showInput: true },
    { name: 'name', title: 'Nombre Completo', show: true, showInput: true },
    {
      name: 'managedLocals',
      title: 'Locales Admin',
      show: true,
      showInput: true,
    },
    { name: 'localId', title: 'Local Asignado', show: true, showInput: true },
    { name: 'document', title: 'Documento', show: true, showInput: true },
    { name: 'email', title: 'Correo Electrónico', show: true, showInput: true },
    { name: 'phone', title: 'Teléfono', show: true, showInput: true },
    { name: 'address', title: 'Dirección', show: true, showInput: true },
    { name: 'status', title: 'Estado', show: true, showInput: true },
    {
      name: 'birthdate',
      title: 'Fecha de Nacimiento',
      show: false,
      showInput: false,
    },
    {
      name: 'department',
      title: 'Departamento',
      show: false,
      showInput: false,
    },
    { name: 'city', title: 'Ciudad', show: false, showInput: false },
    {
      name: 'lastLogin',
      title: 'Último Acceso',
      show: false,
      showInput: false,
    },
    {
      name: 'createdAt',
      title: 'Fecha de Registro',
      show: false,
      showInput: false,
    },
  ];
};

export const viewModalConfig = {
  title: 'Detalles del Local',
  subtitle: 'Información completa del punto de venta',
  columns: 3,
  sections: [
    {
      fields: [
        { name: 'role', label: 'Rol', type: 'role' },
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
        { name: 'birthdate', label: 'Fecha de Nacimiento', type: 'dateOnly' },
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
