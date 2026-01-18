export const getEmptyCustomer = () => ({
  type_document: '',
  document: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  city: '',
  address: '',
  status: '',
  localId: '',
});

export const getFormFieldsCustomers = () => [
  {
    name: 'type_document',
    label: 'Tipo de Documento',
    type: 'select',
    required: true,
    options: [
      { id: 'CC', name: 'Cédula de Ciudadanía' },
      { id: 'NIT', name: 'NIT' },
      { id: 'CR', name: 'Cédula de Residencia' },
      { id: 'CE', name: 'Cédula de Extranjería' },
      { id: 'TE', name: 'Tarjeta de Extranjería' },
      { id: 'PEP', name: 'Permiso Especial de Permanencia' },
      { id: 'DIE', name: 'Documento de Identidad de Extranjería' },
    ],
    disabled: false,
  },
  {
    name: 'document',
    label: 'Documento',
    type: 'text',
    required: true,
    disabled: false,
  },
  {
    name: 'name',
    label: 'Nombre Completo',
    type: 'text',
    required: true,
    disabled: false,
  },
  {
    name: 'email',
    label: 'Correo Electrónico',
    type: 'email',
    required: false,
    disabled: false,
  },
  {
    name: 'phone',
    label: 'Teléfono / Celular',
    type: 'text',
    required: true,
    disabled: false,
  },
  {
    name: 'department',
    label: 'Departamento',
    type: 'text',
    required: false,
    disabled: false,
  },
  {
    name: 'city',
    label: 'Ciudad',
    type: 'text',
    required: false,
    disabled: false,
  },
  {
    name: 'address',
    label: 'Dirección',
    type: 'text',
    required: false,
    disabled: false,
  },
  {
    name: 'status',
    label: 'Estado',
    type: 'select',
    required: false,
    options: [{ id: 'ACTIVO', name: 'ACTIVO' }],
    disabled: false,
  },
  {
    name: 'localId',
    label: 'Local / Punto de Venta',
    type: 'select',
    required: true,
    source: 'locals',
    disabled: false,
  },
];

export const getHeaderTableCustomers = () => [
  { name: 'type_document', title: 'Tipo de Documento', show: true },
  { name: 'document', title: 'Documento', show: true },
  { name: 'name', title: 'Nombre Completo', show: true },
  { name: 'email', title: 'Correo', show: true },
  { name: 'localId', title: 'Local / Punto de Venta', show: true },
  { name: 'phone', title: 'Teléfono', show: true },
  { name: 'department', title: 'Departamento', show: false },
  { name: 'city', title: 'Ciudad', show: true },
  { name: 'address', title: 'Dirección', show: false },
  { name: 'status', title: 'Estado', show: true },
];

export const viewModalConfig = {
  title: 'Detalles del Cliente',
  subtitle: 'Información completa del cliente',
  columns: 3,
  sections: [
    {
      fields: [
        { name: 'type_document', label: 'Tipo de Documento' },
        { name: 'document', label: 'Documento' },
        { name: 'name', label: 'Nombre Completo' },
        { name: 'email', label: 'Correo Electrónico' },
        { name: 'phone', label: 'Teléfono' },
      ],
    },
    {
      fields: [
        { name: 'department', label: 'Departamento' },
        { name: 'city', label: 'Ciudad' },
        { name: 'address', label: 'Dirección' },
        { name: 'local.name', label: 'Local / Punto de Venta' },
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
