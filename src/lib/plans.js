// Fuente única de verdad de los planes de Pegazo. Se usa en la landing (sección
// de precios) y en el panel (selector de plan al crear/editar una empresa).
// Si cambian precios o nombres, se edita solo aquí.

export const PLANS = [
  {
    id: 'DESPEGUE',
    name: 'Despegue',
    emoji: '🛫',
    tagline: 'Para el que arranca',
    priceLabel: 'Gratis',
    priceMonthly: 0,
    priceSuffix: '',
    yearLabel: '',
    highlight: false,
    limits: ['1 usuario', '1 sede', '50 productos', '100 clientes'],
    features: [
      'Ventas (POS)',
      'Inventario básico',
      'Clientes',
      'Reportes básicos',
    ],
    cta: 'Empezar gratis',
  },
  {
    id: 'IMPULSO',
    name: 'Impulso',
    emoji: '🚀',
    tagline: 'Negocio en marcha',
    priceLabel: '$39.900',
    priceMonthly: 39900,
    priceSuffix: '/mes',
    yearLabel: '$399.000/año · 2 meses gratis',
    highlight: true,
    limits: ['3 usuarios', '1 sede', 'Productos ilimitados', 'Clientes ilimitados'],
    features: [
      'Todo lo de Despegue',
      'Gastos',
      'Fiado / crédito',
      'Citas y servicios',
      'Roles y permisos',
      'Fidelización',
      'Estadísticas completas',
      '🧾 Facturación electrónica DIAN ilimitada',
      'Soporte prioritario por WhatsApp',
    ],
    cta: 'Probar 14 días gratis',
  },
  {
    id: 'ALTURA',
    name: 'Altura',
    emoji: '📈',
    tagline: 'Crece con varias sedes',
    priceLabel: '$89.900',
    priceMonthly: 89900,
    priceSuffix: '/mes',
    yearLabel: '$899.000/año · 2 meses gratis',
    highlight: false,
    limits: ['10 usuarios', 'Hasta 3 sedes', 'Productos ilimitados', 'Clientes ilimitados'],
    features: [
      'Todo lo de Impulso',
      'Multi-sede (hasta 3 sedes)',
      'Reportes por sede · estadísticas a profundidad',
      '🛒 Tienda online conectada a tu inventario',
      '🏦 Avisos de consignación al banco',
      '🩺 Historia clínica (salud)',
    ],
    cta: 'Probar 14 días gratis',
  },
  {
    id: 'ORBITA',
    name: 'Órbita',
    emoji: '🪐',
    tagline: 'Cadena o empresa',
    priceLabel: '$179.900',
    priceMonthly: 179900,
    priceSuffix: '/mes',
    yearLabel: '$1.799.000/año · 2 meses gratis',
    highlight: false,
    limits: ['Usuarios ilimitados', 'Sedes ilimitadas', 'Productos ilimitados', 'Clientes ilimitados'],
    features: [
      'Todo lo de Altura',
      'Usuarios y sedes ilimitados',
      '💼 Nómina electrónica',
      'Integraciones y API',
      'Gerente de cuenta dedicado y capacitación',
    ],
    cta: 'Hablar con ventas',
  },
];

// Opciones para selects (panel de administración de la plataforma).
export const PLAN_OPTIONS = PLANS.map((p) => ({ id: p.id, name: p.name }));

// Gating de funciones por plan. Plan mínimo requerido por cada módulo del menú.
// Los módulos que no aparecen aquí son base (todos los planes). Debe coincidir
// con el backend (src/common/plan-limits.service.ts). Empresas sin plan o con
// plan desconocido = sin restricción (no se les cambia lo que ya usan).
export const MODULE_MIN_PLAN = {
  // Impulso: negocio en marcha
  expenses: 'IMPULSO',
  appointments: 'IMPULSO',
  services: 'IMPULSO',
  users: 'IMPULSO',
  statistics: 'IMPULSO',
  fiado: 'IMPULSO',
  loyalty: 'IMPULSO', // fidelización
  'facturacion-electronica': 'IMPULSO', // factura electrónica DIAN ilimitada
  // Altura: crece con varias sedes
  website: 'ALTURA',
  shipping: 'ALTURA',
  bank: 'ALTURA', // avisos de consignación (banco)
  clinical: 'ALTURA', // historia clínica (salud)
  // Órbita: cadena / empresa
  payroll: 'ORBITA', // nómina electrónica (cuando se implemente)
};

export const PLAN_ORDER = ['DESPEGUE', 'IMPULSO', 'ALTURA', 'ORBITA'];
const PLAN_RANK = { DESPEGUE: 1, IMPULSO: 2, ALTURA: 3, ORBITA: 4 };

export function planAllowsModule(plan, moduleKey) {
  const min = MODULE_MIN_PLAN[moduleKey];
  if (!min) return true; // módulo base
  if (!plan) return true; // sin plan → sin gating (empresas existentes)
  const rank = PLAN_RANK[plan];
  if (!rank) return true; // plan desconocido → sin gating
  return rank >= PLAN_RANK[min];
}

// Plan mínimo requerido por un módulo (para el mensaje de "mejora tu plan").
export function requiredPlanForModule(moduleKey) {
  return MODULE_MIN_PLAN[moduleKey] || null;
}

// Versión DINÁMICA: usa la config de planes que viene en /auth/me
// (usuario.planConfig = { gates, plans }). Si no hay config, cae al estático.
export function planAllowsModuleDynamic(plan, moduleKey, planConfig) {
  if (!planConfig?.gates) return planAllowsModule(plan, moduleKey);
  const g = planConfig.gates[moduleKey];
  const min = !g || g === 'BASE' ? null : g;
  if (!min) return true;
  if (!plan) return true;
  const rankOf = (id) =>
    planConfig.plans?.find((p) => p.id === id)?.order || 0;
  const r = rankOf(plan);
  if (!r) return true;
  return r >= rankOf(min);
}

export function requiredPlanForModuleDynamic(moduleKey, planConfig) {
  if (!planConfig?.gates) return requiredPlanForModule(moduleKey);
  const g = planConfig.gates[moduleKey];
  return !g || g === 'BASE' ? null : g;
}

export function getPlan(planId) {
  return PLANS.find((p) => p.id === planId) || null;
}
