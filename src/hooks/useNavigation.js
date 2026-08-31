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

  // Control MANUAL de módulos por empresa (definido por la plataforma). Si tiene
  // valores, MANDA: el cliente solo ve los módulos marcados. Vacío = por defecto
  // (según su tipo de negocio). 'dashboard' y 'settings' siempre disponibles.
  const manual = usuario.company?.enabledModules;
  const useManual = Array.isArray(manual) && manual.length > 0;
  const CORE = new Set(['dashboard', 'settings']);

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
    // Aviso de consignaciones al banco: disponible para cualquier negocio.
    'bank',
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
  // Catálogos de configuración: cada uno hereda el gating (tipo de negocio +
  // plan) de su módulo padre. Así nunca aparecen en una vertical que no usa el
  // módulo (ej: "Tipos de cargo" solo donde hay employee-charges).
  const CONFIG_PARENT = {
    'expense-categories': 'expenses',
    'charge-categories': 'employee-charges',
    'payment-methods': 'sales',
  };

  const isAllowedKey = (k) =>
    CORE.has(k) ||
    (useManual ? manual.includes(k) : visibleModules.includes(k));

  const filteredSections = NAVIGATION.map((section) => {
    const items = section.items
      .filter((item) => {
        const key = item.href.split('/').pop();
        // Inicio/Configuración siempre; los catálogos heredan de su padre; los
        // demás: si hay control manual, solo los marcados; si no, los de la
        // vertical.
        const allowedByModule =
          isAllowedKey(key) ||
          (CONFIG_PARENT[key] && isAllowedKey(CONFIG_PARENT[key]));
        return allowedByModule && item.roles.includes(role);
      })
      .map((item) => {
        const key = item.href.split('/').pop();
        // El candado de plan usa el módulo padre para los catálogos.
        const planKey = CONFIG_PARENT[key] || key;
        const locked = useManual ? false : !planAllowsModule(plan, planKey);
        return {
          ...item,
          name: navLabelByModule[key] || item.name,
          locked,
          requiredPlan: locked ? requiredPlanForModule(planKey) : null,
        };
      });

    // Anida los catálogos de configuración como sub-ítems de su módulo padre
    // (acordeón en el sidebar) para no alargar el menú.
    const byKey = {};
    for (const it of items) byKey[it.href.split('/').pop()] = it;
    const nested = [];
    for (const it of items) {
      const key = it.href.split('/').pop();
      const parentKey = CONFIG_PARENT[key];
      const parent = parentKey ? byKey[parentKey] : null;
      if (parent) {
        (parent.children = parent.children || []).push(it);
      } else {
        nested.push(it);
      }
    }

    return { ...section, items: nested };
  }).filter((section) => section.items.length > 0);

  return filteredSections;
}
