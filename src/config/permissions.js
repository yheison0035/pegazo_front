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

  BARBERO: {
    appointments: ['view'],
  },
};
