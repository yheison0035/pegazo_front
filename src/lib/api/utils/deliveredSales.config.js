// `electronic` = la empresa tiene facturación electrónica activa. Solo entonces
// se muestra la columna/filtro "Tipo" (Normal vs Electrónica); si no, ni aparece.
export const getHeaderTableDeliveredSales = ({ electronic = false } = {}) => {
  return [
    { name: 'code', title: 'Factura / Venta #', show: true, showInput: true },
    ...(electronic
      ? [
          {
            name: 'invoiceType',
            title: 'Tipo',
            show: true,
            showInput: true,
            type: 'select',
            options: [
              { value: '', label: 'Todas' },
              { value: 'NORMAL', label: 'Normal' },
              { value: 'ELECTRONICA', label: 'Electrónica' },
            ],
          },
        ]
      : []),
    { name: 'customer', title: 'Cliente', show: true, showInput: true },
    { name: 'totalAmount', title: 'Total Venta', show: true, showInput: true },
    {
      name: 'paymentMethod',
      title: 'Método de Pago',
      show: true,
      showInput: true,
    },
    {
      name: 'localId',
      title: 'Local / Punto de Venta',
      show: true,
      showInput: true,
    },
    { name: 'userId', title: 'Vendedor / Asesor', show: true, showInput: true },
    { name: 'paymentStatus', title: 'Estado', show: true, showInput: true },
    { name: 'saleDate', title: 'Fecha de Venta', show: true, showInput: true },
    {
      name: 'lastAudit',
      title: 'Última modificación',
      show: true,
      showInput: false,
    },
  ];
};

export const viewModalConfig = {
  title: 'Detalles de la Venta',
  subtitle: 'Información completa de la venta',
  columns: 2,
  sections: [
    {
      fields: [
        { name: 'code', label: 'Codigo del Producto' },
        { name: 'customer.name', label: 'Cliente' },
        { name: 'totalAmount', label: 'Total de Venta' },
        { name: 'paymentMethod', label: 'Metodo de Pago' },
      ],
    },
    {
      fields: [
        { name: 'local.name', label: 'Local Venta' },
        { name: 'user.name', label: 'Asesor' },
        { name: 'paymentStatus', label: 'Estado del Pago', type: 'status' },
        { name: 'saleDate', label: 'Fecha de Venta', type: 'date' },
      ],
    },
  ],
  showComments: false,
};
