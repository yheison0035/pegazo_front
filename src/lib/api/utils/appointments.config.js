export const getEmptyAppointment = () => ({
  date: '',
  startTime: '',
  serviceId: '',
  barberId: '',
  customerId: '',
  localId: '',
  notes: '',
  status: '',
});

export const getFormFieldsAppointments = () => [
  {
    name: 'localId',
    label: 'Local',
    type: 'select',
    required: true,
    source: 'locals',
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
    source: 'getUsersByRole',
  },
  { name: 'date', label: 'Fecha de la Cita', type: 'date', required: true },
  {
    name: 'startTime',
    label: 'Hora cita',
    type: 'select',
    required: true,
    source: 'getAvailability',
  },
  {
    name: 'customerId',
    label: 'Cliente',
    type: 'select',
    required: true,
    source: 'customers',
  },
  { name: 'notes', label: 'Notas', type: 'textarea', required: false },
  {
    name: 'status',
    label: 'Estado',
    type: 'select',
    required: true,
    options: [
      { id: 'CONFIRMADA', name: 'CONFIRMADA' },
      { id: 'COMPLETADA', name: 'COMPLETADA' },
      { id: 'CANCELADA', name: 'CANCELADA' },
    ],
  },
];

export const getHeaderTableAppointments = () => [
  { name: 'status', title: 'Estado', show: true, showInput: true },
  { name: 'date', title: 'Fecha', show: true, showInput: true },
  { name: 'startTime', title: 'Hora cita', show: true, showInput: true },
  { name: 'serviceId', title: 'Servicio', show: true, showInput: true },
  { name: 'barberId', title: 'Barbero', show: true, showInput: true },
  { name: 'customerId', title: 'Cliente', show: true, showInput: true },
  { name: 'localId', title: 'Local', show: true, showInput: true },
  { name: 'notes', title: 'Notas', show: true, showInput: true },
];

export const viewModalConfig = {
  title: 'Detalles de la Cita',
  subtitle: 'Información completa de la cita programada',
  columns: 3,
  sections: [
    {
      fields: [
        { name: 'date', label: 'Fecha de la Cita', type: 'dateOnly' },
        { name: 'startTime', label: 'Hora de Inicio', type: 'time' },
        { name: 'service.name', label: 'Servicio' },
      ],
    },
    {
      fields: [
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
