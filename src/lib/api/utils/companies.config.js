export const getEmptyCompany = () => ({
  logo: '',
  name: '',
  type: '',
  phone: '',
  manager: '',
  status: '',
});

export const getFormFieldsCompanies = () => [
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
];

export const getHeaderTableCompanies = () => [
  { name: 'logo', title: 'Logo', show: true, showInput: true },
  { name: 'name', title: 'Nombre de la Empresa', show: true, showInput: true },
  { name: 'type', title: 'Tipo de Empresa', show: true, showInput: true },
  { name: 'manager', title: 'Encargado', show: true, showInput: true },
  { name: 'phone', title: 'Teléfono', show: true, showInput: true },
  { name: 'status', title: 'Estado', show: true, showInput: true },
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
      ],
    },
    {
      fields: [
        { name: 'manager', label: 'Encargado' },
        { name: 'status', label: 'Estado', type: 'status' },
      ],
    },
  ],
  showComments: false,
};
