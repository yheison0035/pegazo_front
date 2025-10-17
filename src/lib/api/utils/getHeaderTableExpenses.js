export const getHeaderTableExpenses = () => {
  return [
    { name: 'code', title: 'Código / Referencia', show: true },
    { name: 'concept', title: 'Concepto del Gasto', show: true },
    { name: 'category', title: 'Categoría', show: true }, // Ej: servicios, arriendo, insumos, publicidad
    { name: 'amount', title: 'Valor', show: true },
    { name: 'paymentMethod', title: 'Método de Pago', show: true },
    { name: 'provider', title: 'Proveedor / Destinatario', show: true },
    { name: 'local', title: 'Local / Punto de Venta', show: true },
    { name: 'notes', title: 'Observaciones', show: false },
    { name: 'status', title: 'Estado', show: true }, // pagado / pendiente
    { name: 'expenseDate', title: 'Fecha del Gasto', show: true },
  ];
};
