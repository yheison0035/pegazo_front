import {
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export const PLATFORM_NAVIGATION = [
  {
    name: 'Empresas',
    href: '/CRM/platform/companies',
    icon: BuildingOfficeIcon,
  },
  {
    name: 'Usuarios Globales',
    href: '/CRM/platform/users',
    icon: UsersIcon,
  },
  {
    name: 'Estadísticas Globales',
    href: '/CRM/platform/statistics',
    icon: ChartBarIcon,
  },
  {
    name: 'Configuración',
    href: '/CRM/platform/settings',
    icon: Cog6ToothIcon,
  },
];
