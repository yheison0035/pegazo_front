export const getHeaderTableProviders = () => {
  return [
    { name: 'code', title: 'Código', show: true },
    { name: 'name', title: 'Nombre del Proveedor', show: true },
    { name: 'company', title: 'Empresa', show: true },
    { name: 'contactName', title: 'Contacto', show: true },
    { name: 'phone', title: 'Teléfono', show: true },
    { name: 'email', title: 'Correo Electrónico', show: false },
    { name: 'city', title: 'Ciudad', show: true },
    { name: 'department', title: 'Departamento', show: false },
    { name: 'address', title: 'Dirección', show: false },
    { name: 'productType', title: 'Tipo de Producto', show: true },
    { name: 'status', title: 'Estado', show: true },
  ];
};
