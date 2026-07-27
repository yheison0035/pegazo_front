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
  { name: 'name', title: 'Empresa', show: true, showInput: true },
  {
    name: 'contactName',
    title: 'Nombre de Contacto',
    show: true,
    showInput: true,
  },
  {
    name: 'productType',
    title: 'Tipo de Producto',
    show: true,
    showInput: true,
  },
  { name: 'address', title: 'Dirección', show: true, showInput: true },
  { name: 'city', title: 'Ciudad', show: true, showInput: true },
  { name: 'status', title: 'Estado', show: true, showInput: true },
  { name: 'phone', title: 'Teléfono', show: true, showInput: true },
  { name: 'email', title: 'Correo Electrónico', show: false, showInput: false },
  { name: 'department', title: 'Departamento', show: false, showInput: false },
  {
    name: 'lastAudit',
    title: 'Última modificación',
    show: true,
    showInput: false,
  },
];

export const viewModalConfig = {
  title: 'Detalles del Proveedor',
  subtitle: 'Información completa del proveedor',
  columns: 3,
  sections: [
    {
      fields: [
        { name: 'name', label: 'Empresa' },
        { name: 'contactName', label: 'Nombre de Contacto' },
        { name: 'phone', label: 'Teléfono' },
        { name: 'createdAt', label: 'Fecha de Registro', type: 'date' },
      ],
    },
    {
      fields: [
        { name: 'email', label: 'Correo Electrónico' },
        { name: 'productType', label: 'Tipo de Producto' },
        { name: 'status', label: 'Estado', type: 'status' },
      ],
    },
    {
      fields: [
        { name: 'city', label: 'Ciudad' },
        { name: 'department', label: 'Departamento' },
        { name: 'address', label: 'Dirección' },
      ],
    },
  ],
  showComments: false,
};
