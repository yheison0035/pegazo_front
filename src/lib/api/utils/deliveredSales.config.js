export const getHeaderTableDeliveredSales = () => {
  return [
    { name: 'code', title: 'Factura / Venta #', show: true },
    { name: 'customer', title: 'Cliente', show: true },
    { name: 'totalAmount', title: 'Total Venta', show: true },
    { name: 'paymentMethod', title: 'Método de Pago', show: true },
    { name: 'localId', title: 'Local / Punto de Venta', show: true },
    { name: 'userId', title: 'Vendedor / Asesor', show: true },
    { name: 'paymentStatus', title: 'Estado', show: true },
    { name: 'saleDate', title: 'Fecha de Venta', show: true },
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
