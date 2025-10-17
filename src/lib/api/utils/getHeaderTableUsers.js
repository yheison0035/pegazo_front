export const getHeaderTableUsers = () => {
  return [
    { name: 'code', title: 'Código / ID', show: true },
    { name: 'name', title: 'Nombre Completo', show: true },
    { name: 'email', title: 'Correo Electrónico', show: true },
    { name: 'phone', title: 'Teléfono', show: true },
    { name: 'role', title: 'Rol', show: true }, // SUPER_ADMIN / ADMIN / ASESOR
    { name: 'local', title: 'Local Asignado', show: true },
    { name: 'status', title: 'Estado', show: true }, // Activo / Inactivo
    { name: 'lastLogin', title: 'Último Acceso', show: false },
    { name: 'createdAt', title: 'Fecha de Registro', show: false },
  ];
};
