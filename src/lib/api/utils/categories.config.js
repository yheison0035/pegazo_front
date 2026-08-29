export const getEmptyCategory = () => ({
  name: '',
  description: '',
  status: 'ACTIVO',
  localId: '',
  earnsCommission: false,
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
  {
    name: 'localId',
    label: 'Local / Punto de Venta',
    type: 'select',
    required: true,
    source: 'locals',
    disabled: false,
  },
  {
    name: 'earnsCommission',
    label: 'Los productos de esta categoría dan comisión al empleado',
    type: 'checkbox',
    required: false,
    helperText:
      'Actívalo solo para insumos. Para cervezas/bebidas déjalo desactivado (no generan comisión).',
  },
];

export const getHeaderTableCategories = () => [
  {
    name: 'name',
    title: 'Nombre de la Categoría',
    show: true,
    showInput: true,
  },
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
  {
    name: 'lastAudit',
    title: 'Última modificación',
    show: true,
    showInput: false,
  },
];

export const viewModalConfig = {
  title: 'Detalles de la Categoría',
  subtitle: 'Información de la categoría',
  columns: 2,
  sections: [
    {
      fields: [
        { name: 'name', label: 'Nombre' },
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
