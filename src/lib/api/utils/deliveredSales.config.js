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
