export const ROLE_PERMISSIONS = {
  SUPER_PLATFORM_ADMIN: {
    '*': ['*'],
  },

  SUPER_ADMIN: {
    '*': ['view', 'create', 'edit', 'delete', 'export', 'import'],
  },

  ADMIN: {
    locals: ['view', 'create', 'edit'],
    inventory: ['view', 'create', 'edit'],
    customers: ['view', 'create', 'edit', 'delete'],
    sales: ['view', 'create'],
    delivered_sales: ['view'],
    expenses: ['view', 'create', 'edit'],
    providers: ['view', 'create', 'edit', 'delete'],
    categories: ['view', 'create', 'edit', 'delete'],
    brands: ['view', 'create', 'edit', 'delete'],
    statistics: ['view'],
    services: ['view'],
    appointments: ['view', 'create', 'edit', 'delete'],
  },

  ASESOR: {
    sales: ['view', 'create'],
    customers: ['view', 'create', 'edit'],
    inventory: ['view'],
    providers: ['view'],
    categories: ['view'],
    brands: ['view'],
    delivered_sales: ['view'],
    expenses: ['view', 'create', 'edit'],
  },

  // Profesional que presta el servicio (Barbero, Doctor, Estilista…). Ve solo
  // sus citas. BARBERO se mantiene como alias heredado con el mismo alcance.
  PROFESIONAL: {
    appointments: ['view'],
  },
  BARBERO: {
    appointments: ['view'],
  },

  // Vendedor de mostrador (retail): vende y gestiona clientes; ve el catálogo.
  VENTAS: {
    sales: ['view', 'create'],
    customers: ['view', 'create'],
    delivered_sales: ['view'],
    inventory: ['view'],
  },

  // Bodeguero: gestiona el inventario y su cadena (proveedores/categorías/
  // marcas). No vende ni ve clientes.
  BODEGUERO: {
    inventory: ['view', 'create', 'edit'],
    providers: ['view', 'create', 'edit'],
    categories: ['view', 'create', 'edit'],
    brands: ['view', 'create', 'edit'],
  },

  // Restaurante ----------------------------------------------------------
  // Mesas y Cocina no se gestionan por 'can()' (se controlan por menú), así
  // que estos permisos solo abren lo adicional que el rol puede consultar.
  CAJA: {
    sales: ['view', 'create'],
    delivered_sales: ['view'],
    customers: ['view', 'create'],
  },
  MESERO: {
    customers: ['view', 'create'],
  },
  COCINERO: {},

  // Puede todo MENOS locales, estadísticas, usuarios y roles.
  // Puede ver, crear y editar, pero NO eliminar.
  RECEPCIONISTA: {
    inventory: ['view', 'create', 'edit'],
    customers: ['view', 'create', 'edit'],
    sales: ['view', 'create'],
    delivered_sales: ['view'],
    expenses: ['view', 'create', 'edit'],
    providers: ['view', 'create', 'edit'],
    categories: ['view', 'create', 'edit'],
    brands: ['view', 'create', 'edit'],
    services: ['view', 'create', 'edit'],
    appointments: ['view', 'create', 'edit'],
  },
};
