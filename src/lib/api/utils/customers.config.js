export const getEmptyCustomer = () => ({
  type: '',
  document: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  city: '',
  address: '',
  birthdate: '',
  status: '',
});

export const getFormFieldsCustomers = () => [
  {
    name: 'type',
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
  },
  { name: 'document', label: 'Documento', type: 'text', required: true },
  { name: 'firstName', label: 'Nombre', type: 'text', required: true },
  { name: 'lastName', label: 'Apellido', type: 'text', required: true },
  { name: 'email', label: 'Correo Electrónico', type: 'email', required: true },
  { name: 'phone', label: 'Teléfono / Celular', type: 'text', required: true },
  { name: 'department', label: 'Departamento', type: 'text', required: true },
  { name: 'city', label: 'Ciudad', type: 'text', required: true },
  { name: 'address', label: 'Dirección', type: 'text', required: false },
  {
    name: 'birthdate',
    label: 'Fecha de Nacimiento',
    type: 'date',
    required: false,
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

export const getHeaderTableCustomers = () => [
  { name: 'type', title: 'Tipo de Documento', show: true },
  { name: 'document', title: 'Documento', show: true },
  { name: 'firstName', title: 'Nombre', show: true },
  { name: 'lastName', title: 'Apellido', show: true },
  { name: 'email', title: 'Correo', show: true },
  { name: 'phone', title: 'Teléfono', show: true },
  { name: 'department', title: 'Departamento', show: true },
  { name: 'city', title: 'Ciudad', show: true },
  { name: 'address', title: 'Dirección', show: false },
  { name: 'birthdate', title: 'Fecha de Nacimiento', show: false },
  { name: 'status', title: 'Estado', show: true },
];
