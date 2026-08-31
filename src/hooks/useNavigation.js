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
  // Gating: cada catálogo hereda la visibilidad (vertical + plan) de su módulo
  // padre. Así nunca aparece en una vertical que no usa el módulo.
  const GATING_PARENT = {
    'expense-categories': 'expenses',
    'charge-categories': 'employee-charges',
    'payment-methods': 'sales',
    'units-of-measure': 'inventory',
  };
  // Anidado visual (acordeón): bajo qué ítem del menú se agrupa. Puede diferir
  // del gating (ej: métodos de pago se agrupan bajo Caja, pero se muestran
  // siempre que haya ventas; si no hay Caja en la vertical, quedan sueltos).
  const NEST_PARENT = {
    'expense-categories': 'expenses',
    'charge-categories': 'employee-charges',
    'payment-methods': 'cash',
    'units-of-measure': 'inventory',
  };
  // Etiqueta del sub-ítem que abre la vista propia del módulo padre.
  const SELF_LABEL = {
    expenses: 'Lista de gastos',
    'employee-charges': 'Lista de cargos',
    cash: 'Ver caja',
    inventory: 'Ver inventario',
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
          (GATING_PARENT[key] && isAllowedKey(GATING_PARENT[key]));
        return allowedByModule && item.roles.includes(role);
      })
      .map((item) => {
        const key = item.href.split('/').pop();
        // El candado de plan usa el módulo padre para los catálogos.
        const planKey = GATING_PARENT[key] || key;
        const locked = useManual ? false : !planAllowsModule(plan, planKey);
        return {
          ...item,
          name: navLabelByModule[key] || item.name,
          locked,
          requiredPlan: locked ? requiredPlanForModule(planKey) : null,
        };
      });

    // Anida los catálogos como sub-ítems de su módulo padre (acordeón). El padre
    // pasa a ser un grupo que NO navega: su vista propia entra como primer
    // sub-ítem ("Lista de gastos", etc.).
    const byKey = {};
    for (const it of items) byKey[it.href.split('/').pop()] = it;
    const nested = [];
    for (const it of items) {
      const key = it.href.split('/').pop();
      const parentKey = NEST_PARENT[key];
      const parent = parentKey ? byKey[parentKey] : null;
      if (parent) {
        if (!parent.children) {
          parent.isGroup = true;
          parent.children = [
            {
              name: SELF_LABEL[parentKey] || parent.name,
              href: parent.href,
              icon: parent.icon,
              roles: parent.roles,
              locked: parent.locked,
              requiredPlan: parent.requiredPlan,
            },
          ];
        }
        parent.children.push(it);
      } else {
        nested.push(it);
      }
    }

    return { ...section, items: nested };
  }).filter((section) => section.items.length > 0);

  return filteredSections;
}
