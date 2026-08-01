'use client';

import { BUSINESS_TYPES } from '@/config/businessTypes';
import { NAVIGATION } from '@/config/navigation';
import { PLATFORM_NAVIGATION } from '@/config/platformNavigation';
import { planAllowsModule } from '@/lib/plans';
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
  const plan = usuario.company?.plan;

  // módulos permitidos por tipo de negocio
  let modules = [...(BUSINESS_TYPES[businessType] || BUSINESS_TYPES.COMERCIO)];

  // La tienda online solo aparece si la plataforma se la habilitó a la empresa.
  if (usuario.company?.websiteEnabled) {
    modules.push('website');
  }

  // Gating por plan: cada plan solo ve las funciones que incluye. Empresas sin
  // plan no se restringen (planAllowsModule devuelve true).
  modules = modules.filter((m) => planAllowsModule(plan, m));

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
