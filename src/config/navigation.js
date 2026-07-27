import {
  HomeIcon,
  BuildingOffice2Icon,
  TagIcon,
  SparklesIcon,
  TruckIcon,
  ArchiveBoxIcon,
  UsersIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  ChartBarSquareIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

export const NAVIGATION = [
  {
    section: 'General',
    items: [
      {
        name: 'Dashboard',
        href: '/CRM/dashboard',
        icon: HomeIcon,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Locales',
        href: '/CRM/dashboard/locals',
        icon: BuildingOffice2Icon,
        roles: ['SUPER_ADMIN'],
      },
    ],
  },

  {
    section: 'Inventario',
    items: [
      {
        name: 'Categorías',
        href: '/CRM/dashboard/categories',
        icon: TagIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
      {
        name: 'Marcas',
        href: '/CRM/dashboard/brands',
        icon: SparklesIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
      {
        name: 'Proveedores',
        href: '/CRM/dashboard/providers',
        icon: TruckIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
      {
        name: 'Inventario',
        href: '/CRM/dashboard/inventory',
        icon: ArchiveBoxIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
    ],
  },

  {
    section: 'Ventas',
    items: [
      {
        name: 'Realizar Factura',
        href: '/CRM/dashboard/sales',
        icon: BanknotesIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
      {
        name: 'Pedidos',
        href: '/CRM/dashboard/orders',
        icon: ShoppingCartIcon,
        roles: ['SUPER_ADMIN'],
      },
      {
        name: 'Ventas Realizadas',
        href: '/CRM/dashboard/delivered_sales',
        icon: ClipboardDocumentCheckIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
    ],
  },

  {
    section: 'Clientes',
    items: [
      {
        name: 'Clientes',
        href: '/CRM/dashboard/customers',
        icon: UsersIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
    ],
  },

  {
    section: 'Operación',
    items: [
      {
        name: 'Citas',
        href: '/CRM/dashboard/appointments',
        icon: CalendarDaysIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'BARBERO', 'RECEPCIONISTA'],
      },
      {
        name: 'Servicios',
        href: '/CRM/dashboard/services',
        icon: WrenchScrewdriverIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA'],
      },
      {
        name: 'Gastos',
        href: '/CRM/dashboard/expenses',
        icon: ChartBarSquareIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
      {
        name: 'Estadísticas',
        href: '/CRM/dashboard/statistics',
        icon: ChartBarSquareIcon,
        roles: ['SUPER_ADMIN'],
      },
    ],
  },

  {
    section: 'Administración',
    items: [
      {
        name: 'Usuarios / Roles',
        href: '/CRM/dashboard/users',
        icon: UserGroupIcon,
        roles: ['SUPER_ADMIN'],
      },
      {
        name: 'Configuración',
        href: '/CRM/dashboard/settings',
        icon: Cog6ToothIcon,
        roles: ['SUPER_ADMIN'],
      },
    ],
  },
];
