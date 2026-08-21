'use client';

import { BUSINESS_TYPES, HIDDEN_MODULES } from '@/config/businessTypes';
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
    // "Inventario" -> nombre propio: catalogLabel (ej. "Menú" en restaurante)
    // o el plural del producto de la vertical (Medicamentos, Prendas…).
    inventory:
      t.catalogLabel ||
      (t.productPlural !== 'Productos' ? t.productPlural : null),
  };

  // Módulos del tipo de negocio (lista curada y explícita por vertical).
  // 'settings' (Configuración) siempre está disponible para el dueño.
  const modules = [
    ...(BUSINESS_TYPES[businessType] || BUSINESS_TYPES.COMERCIO),
    'settings',
  ];

  // La Tienda online (y Pedidos) SOLO aparecen cuando la plataforma ya montó el
  // sitio del cliente: requiere `websiteEnabled` Y un `domain` cargado. Mientras
  // superplatform no le adquiera/asigne el dominio y cargue el sitio, el dueño
  // no ve el módulo. Así queda 100% dinámico según el estado real de su tienda.
  if (usuario.company?.websiteEnabled && usuario.company?.domain) {
    modules.push('website');
    if (!modules.includes('orders')) modules.push('orders');
  }

  // Oculta los módulos que aún no están 100% terminados/comprobados.
  const visibleModules = modules.filter((m) => !HIDDEN_MODULES.has(m));

  // Filtrar por módulos del negocio + rol. El gating por plan NO oculta: marca
  // el módulo como "bloqueado" (candado) para poder ofrecer el plan superior.
  const filteredSections = NAVIGATION.map((section) => {
    const items = section.items
      .filter((item) => {
        const key = item.href.split('/').pop();
        // El Inicio (home) siempre está disponible; los demás dependen del
        // conjunto de módulos de la vertical.
        const allowedByModule =
          key === 'dashboard' || visibleModules.includes(key);
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
