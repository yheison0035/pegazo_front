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
    customers: ['view', 'create', 'edit'],
    sales: ['view', 'create'],
    delivered_sales: ['view'],
    expenses: ['view', 'create'],
    providers: ['view', 'create'],
    categories: ['view', 'create'],
    brands: ['view', 'create'],
    statistics: ['view'],
  },

  ASESOR: {
    sales: ['view', 'create'],
    customers: ['view', 'create'],
    inventory: ['view'],
  },
};
