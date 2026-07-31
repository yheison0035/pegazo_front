'use client';

import { BUSINESS_TYPES } from '@/config/businessTypes';
import { NAVIGATION } from '@/config/navigation';
import { PLATFORM_NAVIGATION } from '@/config/platformNavigation';
import { useAuth } from '@/context/authContext';

export default function useNavigation() {
  const auth = useAuth();
  const usuario = auth?.usuario;

  if (!usuario) return [];

  const role = usuario.role;

  if (role === 'SUPER_PLATFORM_ADMIN') {
    return PLATFORM_NAVIGATION;
  }

  const businessType = usuario.company?.type || 'COMERCIO';

  // módulos permitidos por tipo de negocio (+ 'settings' siempre disponible,
  // la Configuración es universal; el filtro por rol decide quién la ve).
  const modules = [
    ...(BUSINESS_TYPES[businessType] || BUSINESS_TYPES.COMERCIO),
    'settings',
  ];

  // filtrar por módulos + roles dentro de secciones
  const filteredSections = NAVIGATION.map((section) => {
    const filteredItems = section.items.filter(
      (item) =>
        modules.includes(item.href.split('/').pop()) && // valida módulo
        item.roles.includes(role)
    );

    return {
      ...section,
      items: filteredItems,
    };
  }).filter((section) => section.items.length > 0);

  return filteredSections;
}
