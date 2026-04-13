export const getEmptyService = () => ({
  name: '',
  description: '',
  duration: '',
  status: 'ACTIVO',
  locals: [{ localId: '', price: '' }],
});

export const getFormFieldsServices = () => [
  { name: 'name', label: 'Nombre del Servicio', type: 'text', required: true },
  {
    name: 'description',
    label: 'Descripción',
    type: 'textarea',
    required: true,
  },
  { name: 'duration', label: 'Duración (min)', type: 'text', required: true },
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

export const getHeaderTableServices = () => [
  { name: 'name', title: 'Nombre del Servicio', show: true, showInput: true },
  { name: 'description', title: 'Descripción', show: true, showInput: true },
  { name: 'duration', title: 'Duración', show: true, showInput: true },
  { name: 'status', title: 'Estado', show: true, showInput: true },
];

export const viewModalConfig = {
  title: 'Detalles del Servicio',
  subtitle: 'Información completa del servicio',
  columns: 2,
  sections: [
    {
      fields: [
        { name: 'name', label: 'Nombre del Servicio' },
        { name: 'description', label: 'Descripción' },
      ],
    },
    {
      fields: [
        { name: 'duration', label: 'Duración (min)' },
        { name: 'status', label: 'Estado', type: 'status' },
      ],
    },
  ],
  showComments: false,
};
