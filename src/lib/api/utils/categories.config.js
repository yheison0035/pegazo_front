export const getEmptyCategory = () => ({
  name: '',
  description: '',
  status: 'ACTIVO',
});

export const getFormFieldsCategories = () => [
  {
    name: 'name',
    label: 'Nombre de la Categoría',
    type: 'text',
    required: true,
  },
  {
    name: 'description',
    label: 'Descripción',
    type: 'textarea',
    required: false,
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

export const getHeaderTableCategories = () => [
  { name: 'name', title: 'Nombre de la Categoría', show: true },
  { name: 'description', title: 'Descripción', show: true },
  { name: 'status', title: 'Estado', show: true },
  { name: 'updatedAt', title: 'Última Actualización', show: false },
];
