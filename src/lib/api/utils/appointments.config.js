export const getEmptyAppointment = () => ({
  date: '',
  startTime: '',
  endTime: '',
  serviceId: '',
  barberId: '',
  customerId: '',
  localId: '',
  notes: '',
  status: '',
});

export const getFormFieldsAppointments = () => [
  { name: 'date', label: 'Fecha', type: 'date', required: true },
  { name: 'startTime', label: 'Hora de Inicio', type: 'time', required: true },
  {
    name: 'endTime',
    label: 'Hora de Finalización',
    type: 'time',
    required: true,
  },
  {
    name: 'serviceId',
    label: 'Servicio',
    type: 'select',
    required: true,
    source: 'services',
  },
  {
    name: 'barberId',
    label: 'Barbero',
    type: 'select',
    required: true,
    source: 'users',
  },
  {
    name: 'customerId',
    label: 'Cliente',
    type: 'select',
    required: true,
    source: 'users',
  },
  {
    name: 'localId',
    label: 'Local',
    type: 'select',
    required: true,
    source: 'locals',
  },
  { name: 'notes', label: 'Notas', type: 'textarea', required: false },
  {
    name: 'status',
    label: 'Estado',
    type: 'select',
    required: true,
    options: [
      { id: 'NUEVA', name: 'PENDIENTE' },
      { id: 'EN_PROCESO', name: 'EN PROCESO' },
      { id: 'PENDIENTE', name: 'PENDIENTE' },
      { id: 'APROBADA', name: 'APROBADA' },
      { id: 'RECHAZADA', name: 'RECHAZADA' },
      { id: 'CANCELADA', name: 'CANCELADA' },
    ],
  },
];

export const getHeaderTableAppointments = () => [
  { name: 'date', title: 'Fecha', show: true, showInput: true },
  { name: 'startTime', title: 'Hora de Inicio', show: true, showInput: true },
  {
    name: 'endTime',
    title: 'Hora de Finalización',
    show: true,
    showInput: true,
  },
  { name: 'serviceId', title: 'Servicio', show: true, showInput: true },
  { name: 'barberId', title: 'Barbero', show: true, showInput: true },
  { name: 'customerId', title: 'Cliente', show: true, showInput: true },
  { name: 'localId', title: 'Local', show: true, showInput: true },
  { name: 'notes', title: 'Notas', show: true, showInput: true },
  { name: 'status', title: 'Estado', show: true, showInput: true },
];

export const viewModalConfig = {
  title: 'Detalles de la Cita',
  subtitle: 'Información completa de la cita programada',
  columns: 3,
  sections: [
    {
      fields: [
        { name: 'date', label: 'Fecha de la Cita', type: 'date' },
        { name: 'startTime', label: 'Hora de Inicio', type: 'time' },
        { name: 'endTime', label: 'Hora de Finalización', type: 'time' },
      ],
    },
    {
      fields: [
        { name: 'service.name', label: 'Servicio' },
        { name: 'barber.name', label: 'Barbero' },
        { name: 'customer.name', label: 'Cliente' },
        { name: 'local.name', label: 'Local' },
      ],
    },
    {
      fields: [
        { name: 'notes', label: 'Notas' },
        { name: 'status', label: 'Estado', type: 'status' },
      ],
    },
  ],
  showComments: false,
};
