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
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

export const NAVIGATION = [
  {
    section: 'General',
    items: [
      {
        name: 'Inicio',
        href: '/dashboard',
        icon: HomeIcon,
        roles: [
          'SUPER_ADMIN',
          'ADMIN',
          'RECEPCIONISTA',
          'COORDINADOR',
          'AUXILIAR',
          'ASESOR',
          'BODEGUERO',
          'VENTAS',
        ],
      },
      {
        name: 'Locales',
        href: '/dashboard/locals',
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
        href: '/dashboard/categories',
        icon: TagIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
      {
        name: 'Marcas',
        href: '/dashboard/brands',
        icon: SparklesIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
      {
        name: 'Proveedores',
        href: '/dashboard/providers',
        icon: TruckIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
      {
        name: 'Inventario',
        href: '/dashboard/inventory',
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
        href: '/dashboard/sales',
        icon: BanknotesIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
      {
        name: 'Pedidos',
        href: '/dashboard/orders',
        icon: ShoppingCartIcon,
        roles: ['SUPER_ADMIN'],
      },
      {
        name: 'Ventas Realizadas',
        href: '/dashboard/delivered_sales',
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
        href: '/dashboard/customers',
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
        href: '/dashboard/appointments',
        icon: CalendarDaysIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'BARBERO', 'RECEPCIONISTA'],
      },
      {
        name: 'Servicios',
        href: '/dashboard/services',
        icon: WrenchScrewdriverIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA'],
      },
      {
        name: 'Gastos',
        href: '/dashboard/expenses',
        icon: ChartBarSquareIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
      {
        name: 'Estadísticas',
        href: '/dashboard/statistics',
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
        href: '/dashboard/users',
        icon: UserGroupIcon,
        roles: ['SUPER_ADMIN'],
      },
      {
        name: 'Tienda online',
        href: '/dashboard/website',
        icon: GlobeAltIcon,
        roles: ['SUPER_ADMIN'],
      },
      {
        name: 'Configuración',
        href: '/dashboard/settings',
        icon: Cog6ToothIcon,
        roles: ['SUPER_ADMIN'],
      },
    ],
  },
];
