export const getEmptyBrand = () => ({
  name: '',
  description: '',
  status: 'ACTIVO',
});

export const getFormFieldsBrands = () => [
  {
    name: 'name',
    label: 'Nombre de la Marca',
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

export const getHeaderTableBrands = () => [
  { name: 'name', title: 'Nombre de la Marca', show: true },
  { name: 'description', title: 'Descripción', show: true },
  { name: 'status', title: 'Estado', show: true },
  { name: 'updatedAt', title: 'Última Actualización', show: false },
];
