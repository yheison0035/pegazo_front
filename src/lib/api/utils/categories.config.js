export const getEmptyCategory = () => ({
  name: '',
  description: '',
  status: 'Activo',
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
    type: 'text',
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

export const getHeaderTableCategories = () => [
  { name: 'code', title: 'Código', show: true },
  { name: 'name', title: 'Nombre de la Categoría', show: true },
  { name: 'description', title: 'Descripción', show: true },
  { name: 'status', title: 'Estado', show: true },
  { name: 'updatedAt', title: 'Última Actualización', show: false },
];
