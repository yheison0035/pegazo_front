'use client';

import { BUSINESS_TYPES } from '@/config/businessTypes';
import { NAVIGATION } from '@/config/navigation';
import { PLATFORM_NAVIGATION } from '@/config/platformNavigation';
import { EINVOICE_ENABLED } from '@/config/features';
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

  // módulos permitidos por tipo de negocio. La Configuración fiscal (settings)
  // solo aparece cuando la factura electrónica está habilitada (flag), para no
  // mostrar en producción cosas de FE que aún no funcionan.
  const modules = [
    ...(BUSINESS_TYPES[businessType] || BUSINESS_TYPES.COMERCIO),
    ...(EINVOICE_ENABLED ? ['settings'] : []),
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
