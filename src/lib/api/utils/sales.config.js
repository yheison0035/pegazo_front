export const getEmptySale = () => ({
  code: '',
  customer: '',
  products: [],
  totalAmount: '',
  paymentMethod: '',
  local: '',
  seller: '',
  status: 'Pendiente',
  saleDate: '',
  notes: '',
});

export const getFormFieldsSales = () => [
  {
    name: 'products',
    label: 'Productos Vendidos',
    type: 'productSelect',
    required: true,
    source: 'products',
  },
  {
    name: 'paymentMethod',
    label: 'Método de Pago',
    type: 'select',
    required: true,
    options: [
      { id: 'Efectivo', name: 'Efectivo' },
      { id: 'Transferencia', name: 'Transferencia' },
      { id: 'Tarjeta', name: 'Tarjeta' },
      { id: 'Crédito', name: 'Crédito' },
    ],
  },
  {
    name: 'local',
    label: 'Local / Punto de Venta',
    type: 'select',
    required: false,
    source: 'locals',
  },
  {
    name: 'seller',
    label: 'Vendedor / Asesor',
    type: 'select',
    required: true,
    source: 'users',
  },
  {
    name: 'status',
    label: 'Estado',
    type: 'select',
    required: true,
    options: [
      { id: 'Pagada', name: 'Pagada' },
      { id: 'Pendiente', name: 'Pendiente' },
      { id: 'Cancelada', name: 'Cancelada' },
    ],
  },
  {
    name: 'saleDate',
    label: 'Fecha de la Venta',
    type: 'date',
    required: true,
  },
  {
    name: 'notes',
    label: 'Observaciones',
    type: 'textarea',
    required: false,
  },
  {
    name: 'customer',
    label: 'Cliente',
    type: 'select',
    required: true,
    source: 'customers',
  },
];
