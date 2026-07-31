import {
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';

export const PLATFORM_NAVIGATION = [
  {
    section: 'Operación',
    items: [
      {
        name: 'Empresas',
        href: '/platform/companies',
        icon: BuildingOfficeIcon,
      },
      {
        name: 'Usuarios Globales',
        href: '/platform/users',
        icon: UsersIcon,
      },
      {
        name: 'Cupones',
        href: '/platform/coupons',
        icon: TicketIcon,
      },
      {
        name: 'Estadísticas Globales',
        href: '/platform/statistics',
        icon: ChartBarIcon,
      },
      {
        name: 'Configuración',
        href: '/platform/settings',
        icon: Cog6ToothIcon,
      },
    ],
  },
];
