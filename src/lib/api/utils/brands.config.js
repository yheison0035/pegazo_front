export const getEmptyBrand = () => ({
  name: '',
  description: '',
  status: 'ACTIVO',
  localId: '',
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
  {
    name: 'localId',
    label: 'Local / Punto de Venta',
    type: 'select',
    required: true,
    source: 'locals',
    disabled: false,
  },
];

export const getHeaderTableBrands = () => [
  { name: 'name', title: 'Nombre de la Marca', show: true, showInput: true },
  { name: 'description', title: 'Descripción', show: true, showInput: true },
  { name: 'status', title: 'Estado', show: true, showInput: true },
  {
    name: 'localId',
    title: 'Local / Punto de Venta',
    show: true,
    showInput: true,
  },
  {
    name: 'updatedAt',
    title: 'Última Actualización',
    show: false,
    showInput: false,
  },
];

export const viewModalConfig = {
  title: 'Detalles de la Marca',
  subtitle: 'Información completa de la marca',
  columns: 2,
  sections: [
    {
      fields: [
        { name: 'name', label: 'Nombre de la Marca' },
        { name: 'description', label: 'Descripción' },
        { name: 'local.name', label: 'Local / Punto de Venta' },
      ],
    },
    {
      fields: [
        { name: 'status', label: 'Estado', type: 'status' },
        { name: 'createdAt', label: 'Fecha Creación', type: 'date' },
        { name: 'updatedAt', label: 'Última Actualización', type: 'date' },
      ],
    },
  ],
  showComments: false,
};
