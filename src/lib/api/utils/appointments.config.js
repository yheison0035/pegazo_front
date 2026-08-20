export const getEmptyAppointment = () => ({
  date: '',
  startTime: '',
  serviceId: '',
  barberId: '',
  customerId: '',
  localId: '',
  notes: '',
  // Toda cita nace CONFIRMADA por defecto.
  status: 'CONFIRMADA',
});

export const getFormFieldsAppointments = (t = {}) => [
  {
    name: 'localId',
    label: 'Local',
    type: 'select',
    required: true,
    source: 'locals',
  },
  {
    name: 'serviceId',
    label: t.service || 'Servicio',
    type: 'select',
    required: true,
    source: 'services',
  },
  {
    name: 'barberId',
    label: t.attendant || 'Barbero',
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
    label: t.customer || 'Cliente',
    type: 'searchSelect',
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
      { id: 'CONFIRMADA', name: 'Confirmada' },
      { id: 'EN_PROCESO', name: 'En proceso' },
      { id: 'COMPLETADA', name: 'Completada' },
      { id: 'NO_ASISTIO', name: 'No asistió' },
      { id: 'CANCELADA', name: 'Cancelada' },
    ],
  },
];

export const getHeaderTableAppointments = (t = {}) => [
  { name: 'status', title: 'Estado', show: true, showInput: true },
  { name: 'date', title: 'Fecha', show: true, showInput: true },
  { name: 'startTime', title: 'Hora cita', show: true, showInput: true },
  {
    name: 'serviceId',
    title: t.service || 'Servicio',
    show: true,
    showInput: true,
  },
  {
    name: 'barberId',
    title: t.attendant || 'Barbero',
    show: true,
    showInput: true,
  },
  {
    name: 'customerId',
    title: t.customer || 'Cliente',
    show: true,
    showInput: true,
  },
  {
    name: 'clientConfirmed',
    title: 'Confirmación',
    show: true,
    showInput: false,
  },
  { name: 'localId', title: 'Local', show: true, showInput: true },
  { name: 'notes', title: 'Notas', show: true, showInput: true },
  {
    name: 'lastAudit',
    title: 'Última modificación',
    show: true,
    showInput: false,
  },
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
