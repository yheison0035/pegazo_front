'use client';

import { BUSINESS_TYPES } from '@/config/businessTypes';
import { NAVIGATION } from '@/config/navigation';
import { PLATFORM_NAVIGATION } from '@/config/platformNavigation';
import { planAllowsModule, requiredPlanForModule } from '@/lib/plans';
import { getTerms } from '@/config/terminology';
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

  // Etiquetas del menú según la vertical (Clientes→Pacientes, etc.).
  const t = getTerms(usuario.company);
  const navLabelByModule = {
    customers: t.customerPlural,
    services: t.servicePlural,
    appointments: t.appointmentPlural,
    // "Inventario" solo cambia si la vertical tiene un término propio de producto.
    inventory: t.productPlural !== 'Productos' ? t.productPlural : null,
  };

  // módulos permitidos por tipo de negocio
  const modules = [...(BUSINESS_TYPES[businessType] || BUSINESS_TYPES.COMERCIO)];

  // La tienda online solo aparece si la plataforma se la habilitó a la empresa.
  if (usuario.company?.websiteEnabled) {
    modules.push('website');
  }

  // Filtrar por módulos del negocio + rol. El gating por plan NO oculta: marca
  // el módulo como "bloqueado" (candado) para poder ofrecer el plan superior.
  const filteredSections = NAVIGATION.map((section) => {
    const items = section.items
      .filter((item) => {
        const key = item.href.split('/').pop();
        // El Inicio (home) siempre está disponible; los demás dependen del
        // conjunto de módulos de la vertical.
        const allowedByModule = key === 'dashboard' || modules.includes(key);
        return allowedByModule && item.roles.includes(role);
      })
      .map((item) => {
        const key = item.href.split('/').pop();
        const locked = !planAllowsModule(plan, key);
        return {
          ...item,
          name: navLabelByModule[key] || item.name,
          locked,
          requiredPlan: locked ? requiredPlanForModule(key) : null,
        };
      });

    return { ...section, items };
  }).filter((section) => section.items.length > 0);

  return filteredSections;
}
