export const getEmptyExpense = () => ({
  concept: '',
  type: '',
  amount: '',
  paymentMethod: '',
  paidTo: '',
  localId: '',
  providerId: '',
  notes: '',
  status: 'ACTIVO',
  expenseDate: '',
});

export const getFormFieldsExpenses = () => [
  {
    name: 'concept',
    label: 'Concepto del Gasto',
    type: 'text',
    required: true,
    source: null,
    disabled: false,
  },
  {
    name: 'expenseCategoryId',
    label: 'Tipo de Gasto',
    type: 'select',
    required: true,
    source: 'expenseCategories',
    disabled: false,
  },
  {
    name: 'amount',
    label: 'Valor del Gasto',
    type: 'text',
    required: true,
    source: null,
    disabled: false,
  },
  {
    name: 'paymentMethod',
    label: 'Método de Pago',
    type: 'select',
    required: true,
    source: 'paymentMethod',
    disabled: false,
  },
  {
    name: 'paidTo',
    label: 'Pagado a',
    type: 'text',
    required: false,
    source: null,
    disabled: false,
  },
  {
    name: 'providerId',
    label: 'Proveedor',
    type: 'select',
    required: false,
    source: 'providers',
    disabled: false,
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
    name: 'expenseDate',
    label: 'Fecha del Gasto',
    type: 'date',
    required: true,
    source: null,
    disabled: false,
  },
  {
    name: 'status',
    label: 'Estado',
    type: 'select',
    required: true,
    source: null,
    options: [{ id: 'ACTIVO', name: 'ACTIVO' }],
    disabled: false,
  },
  {
    name: 'notes',
    label: 'Observaciones',
    type: 'textarea',
    required: false,
    source: null,
    disabled: false,
  },
];

export const getHeaderTableExpenses = () => [
  { name: 'concept', title: 'Concepto', show: true, showInput: true },
  { name: 'type', title: 'Tipo', show: true, showInput: true },
  { name: 'amount', title: 'Valor', show: true, showInput: true },
  {
    name: 'paymentMethod',
    title: 'Método de Pago',
    show: true,
    showInput: true,
  },
  { name: 'paidTo', title: 'Pagado a', show: true, showInput: true },
  {
    name: 'localId',
    title: 'Local / Punto de Venta',
    show: true,
    showInput: true,
  },
  { name: 'providerId', title: 'Proveedor', show: true, showInput: true },
  { name: 'expenseDate', title: 'Fecha', show: true, showInput: true },
  { name: 'status', title: 'Estado', show: true, showInput: true },
  {
    name: 'lastAudit',
    title: 'Última modificación',
    show: true,
    showInput: false,
  },
];

export const viewModalConfig = {
  title: 'Detalles del Pago',
  subtitle: 'Información completa del pago',
  columns: 3,
  sections: [
    {
      fields: [
        { name: 'concept', label: 'Concepto' },
        { name: 'type', label: 'Tipo' },
        { name: 'amount', label: 'Valor' },
        { name: 'paidTo', label: 'Pagado a' },
      ],
    },
    {
      fields: [
        { name: 'paymentMethod', label: 'Método de Pago' },
        { name: 'provider.name', label: 'Proveedor' },
        { name: 'local.name', label: 'Local / Punto de Venta' },
        { name: 'status', label: 'Estado', type: 'status' },
      ],
    },
    {
      fields: [
        { name: 'expenseDate', label: 'Fecha de Pago', type: 'date' },
        { name: 'createdAt', label: 'Fecha de Registro', type: 'date' },
        { name: 'notes', label: 'Observaciones' },
      ],
    },
  ],
  showComments: false,
};
