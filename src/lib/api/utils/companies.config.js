export const getEmptyCompany = () => ({
  logo: '',
  name: '',
  type: '',
  phone: '',
  manager: '',
  status: '',
  plan: '',
  paidUntil: '',
  startDate: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
});

export const getFormFieldsCompanies = (includeAdmin = false) => [
  { name: 'logo', label: 'Logo de la Empresa', type: 'text', required: true },
  { name: 'name', label: 'Nombre de la Empresa', type: 'text', required: true },
  {
    name: 'type',
    label: 'Tipo de Empresa',
    type: 'select',
    required: false,
    source: 'typeCompanies',
  },
  { name: 'phone', label: 'Celular', type: 'text', required: true },
  { name: 'manager', label: 'Encargado', type: 'text', required: true },

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
  {
    name: 'plan',
    label: 'Plan',
    type: 'text',
    required: false,
  },
  {
    name: 'startDate',
    label: 'Cliente desde (si se deja vacío se usa la fecha de creación)',
    type: 'date',
    required: false,
  },
  {
    name: 'paidUntil',
    label: 'Pago al día hasta (vencimiento)',
    type: 'date',
    required: false,
  },

  // Solo al crear: credenciales del administrador inicial de la empresa, para
  // que pueda iniciar sesión y de ahí en adelante gestione todo por su cuenta.
  ...(includeAdmin
    ? [
        {
          name: 'adminName',
          label: 'Nombre del administrador',
          type: 'text',
          required: false,
        },
        {
          name: 'adminEmail',
          label: 'Correo del administrador (para iniciar sesión)',
          type: 'email',
          required: true,
        },
        {
          name: 'adminPassword',
          label: 'Contraseña del administrador',
          type: 'password',
          required: true,
        },
      ]
    : []),
];

export const getHeaderTableCompanies = () => [
  { name: 'logo', title: 'Logo', show: true, showInput: false },
  { name: 'name', title: 'Nombre de la Empresa', show: true, showInput: true },
  { name: 'type', title: 'Tipo de Empresa', show: true, showInput: true },
  { name: 'manager', title: 'Encargado', show: true, showInput: true },
  {
    name: 'adminEmail',
    title: 'Correo de acceso',
    show: true,
    showInput: false,
  },
  { name: 'phone', title: 'Teléfono', show: true, showInput: true },
  { name: 'status', title: 'Estado', show: true, showInput: true },
  { name: 'startDate', title: 'Cliente desde', show: true, showInput: false },
  { name: 'paidUntil', title: 'Pago hasta', show: true, showInput: false },
];

export const viewModalConfig = {
  title: 'Detalles de la Empresa',
  subtitle: 'Información completa de la empresa seleccionada',
  columns: 2,
  sections: [
    {
      fields: [
        { name: 'name', label: 'Nombre de la Empresa' },
        { name: 'type', label: 'Tipo de Empresa' },
        { name: 'phone', label: 'Teléfono' },
        { name: 'adminEmail', label: 'Correo de acceso (administrador)' },
        { name: 'adminName', label: 'Administrador' },
      ],
    },
    {
      fields: [
        { name: 'manager', label: 'Encargado' },
        { name: 'status', label: 'Estado', type: 'status' },
        { name: 'plan', label: 'Plan' },
        { name: 'startDate', label: 'Cliente desde', type: 'date' },
        { name: 'createdAt', label: 'Registrada el', type: 'date' },
        { name: 'paidUntil', label: 'Pago al día hasta', type: 'date' },
      ],
    },
  ],
  showComments: false,
};
