export const getHeaderTableDeliveredSales = () => {
  return [
    { name: 'invoiceNumber', title: 'Factura / Venta #', show: true },
    { name: 'customer', title: 'Cliente', show: true },
    { name: 'paymentMethod', title: 'Método de Pago', show: true },
    { name: 'total', title: 'Total Venta', show: true },
    { name: 'local', title: 'Local / Punto de Venta', show: true },
    { name: 'advisor', title: 'Asesor', show: true },
    { name: 'status', title: 'Estado', show: true },
    { name: 'saleDate', title: 'Fecha de Venta', show: true },
  ];
};

export const getHeaderTableSaleItems = () => {
  return [
    { name: 'sku', title: 'Código / SKU', show: true },
    { name: 'name', title: 'Producto', show: true },
    { name: 'color', title: 'Color', show: true },
    { name: 'quantity', title: 'Cantidad', show: true },
    { name: 'salePrice', title: 'Precio Unitario', show: true },
    { name: 'total', title: 'Subtotal', show: true },
    { name: 'provider', title: 'Proveedor', show: false },
    { name: 'category', title: 'Categoría', show: false },
    { name: 'brand', title: 'Marca', show: false },
  ];
};
