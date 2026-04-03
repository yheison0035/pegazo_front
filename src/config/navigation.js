import {
  ArchiveBoxIcon,
  BuildingOfficeIcon,
  TagIcon,
  SparklesIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

export const NAVIGATION = {
  locals: {
    name: 'Locales',
    href: '/CRM/dashboard/locals',
    icon: BuildingOfficeIcon,
    roles: ['SUPER_ADMIN'],
  },
  categories: {
    name: 'Categorías',
    href: '/CRM/dashboard/categories',
    icon: TagIcon,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  brands: {
    name: 'Marcas',
    href: '/CRM/dashboard/brands',
    icon: SparklesIcon,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  providers: {
    name: 'Proveedores',
    href: '/CRM/dashboard/providers',
    icon: BuildingStorefrontIcon,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  inventory: {
    name: 'Inventario',
    href: '/CRM/dashboard/inventory',
    icon: ArchiveBoxIcon,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  customers: {
    name: 'Clientes',
    href: '/CRM/dashboard/customers',
    icon: UsersIcon,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  users: {
    name: 'Usuarios / Roles',
    href: '/CRM/dashboard/users',
    icon: Cog6ToothIcon,
    roles: ['SUPER_ADMIN'],
  },
  orders: {
    name: 'Pedidos',
    href: '/CRM/dashboard/orders',
    icon: ClipboardDocumentListIcon,
    roles: ['SUPER_ADMIN'],
  },
  sales: {
    name: 'Realizar Venta',
    href: '/CRM/dashboard/sales',
    icon: BanknotesIcon,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  delivered_sales: {
    name: 'Ventas Realizadas',
    href: '/CRM/dashboard/delivered_sales',
    icon: ClipboardDocumentCheckIcon,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  expenses: {
    name: 'Gastos',
    href: '/CRM/dashboard/expenses',
    icon: ChartBarIcon,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  statistics: {
    name: 'Estadísticas',
    href: '/CRM/dashboard/statistics',
    icon: AdjustmentsHorizontalIcon,
    roles: ['SUPER_ADMIN'],
  },
};
