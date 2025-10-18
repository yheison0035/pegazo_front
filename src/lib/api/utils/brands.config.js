export const getEmptyBrand = () => ({
  name: '',
  description: '',
  status: 'Activo',
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

export const getHeaderTableBrands = () => [
  { name: 'code', title: 'Código', show: true },
  { name: 'name', title: 'Nombre de la Marca', show: true },
  { name: 'description', title: 'Descripción', show: true },
  { name: 'status', title: 'Estado', show: true },
  { name: 'updatedAt', title: 'Última Actualización', show: false },
];
