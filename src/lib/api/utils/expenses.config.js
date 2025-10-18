export const getEmptyExpense = () => ({
  concept: '',
  category: '',
  amount: '',
  paymentMethod: '',
  provider: '',
  local: '',
  notes: '',
  status: 'Pendiente',
  expenseDate: '',
});

export const getFormFieldsExpenses = () => [
  {
    name: 'concept',
    label: 'Concepto del Gasto',
    type: 'text',
    required: true,
  },
  {
    name: 'category',
    label: 'Categoría',
    type: 'select',
    required: true,
    options: [
      { id: 'Servicios', name: 'Servicios' },
      { id: 'Arriendo', name: 'Arriendo' },
      { id: 'Insumos', name: 'Insumos' },
      { id: 'Publicidad', name: 'Publicidad' },
      { id: 'Transporte', name: 'Transporte' },
      { id: 'Nomina', name: 'Nómina' },
      { id: 'Otros', name: 'Otros' },
    ],
  },
  { name: 'amount', label: 'Valor del Gasto', type: 'number', required: true },
  {
    name: 'paymentMethod',
    label: 'Método de Pago',
    type: 'select',
    required: true,
    options: [
      { id: 'Efectivo', name: 'Efectivo' },
      { id: 'Transferencia', name: 'Transferencia' },
      { id: 'Tarjeta', name: 'Tarjeta' },
      { id: 'Cheque', name: 'Cheque' },
      { id: 'Otro', name: 'Otro' },
    ],
  },
  {
    name: 'provider',
    label: 'Proveedor / Destinatario',
    type: 'select',
    required: false,
    source: 'providers',
  },
  {
    name: 'local',
    label: 'Local / Punto de Venta',
    type: 'select',
    required: false,
    source: 'locals',
  },
  { name: 'notes', label: 'Observaciones', type: 'textarea', required: false },
  {
    name: 'status',
    label: 'Estado',
    type: 'select',
    required: true,
    options: [
      { id: 'Pagado', name: 'Pagado' },
      { id: 'Pendiente', name: 'Pendiente' },
    ],
  },
  {
    name: 'expenseDate',
    label: 'Fecha del Gasto',
    type: 'date',
    required: true,
  },
];

export const getHeaderTableExpenses = () => [
  { name: 'code', title: 'Código / Referencia', show: true },
  { name: 'concept', title: 'Concepto del Gasto', show: true },
  { name: 'category', title: 'Categoría', show: true },
  { name: 'amount', title: 'Valor', show: true },
  { name: 'paymentMethod', title: 'Método de Pago', show: true },
  { name: 'provider', title: 'Proveedor / Destinatario', show: true },
  { name: 'local', title: 'Local / Punto de Venta', show: true },
  { name: 'notes', title: 'Observaciones', show: false },
  { name: 'status', title: 'Estado', show: true },
  { name: 'expenseDate', title: 'Fecha del Gasto', show: true },
];
