// Presentación de planes ADAPTADA por tipo de negocio (una sola estructura de
// precios, features con el lenguaje de cada vertical). Se usa en la página
// "Mejorar plan" y en el modal de upgrade dentro del CRM.
//
// El gating real (qué se limita en el CRM) lo hace MODULE_MIN_PLAN en plans.js
// junto con effectiveModules(vertical). Esto es solo la CAPA DE PRESENTACIÓN:
// qué destacar en cada plan según el negocio.

// Agrupamos los ~15 tipos de negocio en 4 familias para no repetir copy.
const GROUP_BY_TYPE = {
  // Servicios con agenda
  BARBERIA: 'servicios',
  PELUQUERIA: 'servicios',
  SPA: 'servicios',
  ESTETICA: 'servicios',
  SALON_BELLEZA: 'servicios',
  // Comida
  RESTAURANTE: 'comida',
  COMIDA_RAPIDA: 'comida',
  CAFETERIA: 'comida',
  // Salud (agenda + historia clínica)
  ODONTOLOGIA: 'salud',
  VETERINARIA: 'salud',
  CONSULTORIO: 'salud',
  MEDICINA: 'salud',
  // Retail / mostrador con productos
  COMERCIO: 'retail',
  FERRETERIA: 'retail',
  ROPA: 'retail',
  SUPERMERCADO: 'retail',
  MINIMERCADO: 'retail',
  TIENDA: 'retail',
  REPUESTOS: 'retail',
};

const DEFAULT_GROUP = 'retail';

// Titular por grupo (aparece arriba del comparativo, "para tu barbería…").
const TAGLINE = {
  servicios: 'Pensado para tu negocio de servicios con agenda',
  comida: 'Pensado para tu restaurante o punto de comida',
  salud: 'Pensado para tu consultorio o clínica',
  retail: 'Pensado para tu negocio de mostrador e inventario',
};

// Lo que se DESTACA en cada plan según la familia. Lo transversal (facturación
// electrónica, tienda online, certificado) va igual para todos, más abajo.
const HIGHLIGHTS = {
  servicios: {
    DESPEGUE: ['Agenda de citas básica', 'Servicios y clientes', 'Ventas (POS)'],
    IMPULSO: [
      'Citas por profesional (barbero/estilista)',
      'Comisiones por empleado',
      'Fidelización de clientes',
      'Gastos y caja',
    ],
    ALTURA: ['Varias sedes', 'Reportes por sede y profesional'],
    ORBITA: ['Sedes y usuarios ilimitados', 'Nómina electrónica de tu equipo'],
  },
  comida: {
    DESPEGUE: ['Menú y ventas (POS)', 'Clientes'],
    IMPULSO: [
      'Mesas y comandas',
      'Pantalla de cocina (KDS)',
      'Insumos y recetas',
      'Gastos y caja',
    ],
    ALTURA: ['Varias sedes / puntos', 'Reportes por sede'],
    ORBITA: ['Cadena ilimitada', 'Nómina electrónica'],
  },
  salud: {
    DESPEGUE: ['Agenda de citas', 'Pacientes y servicios'],
    IMPULSO: [
      'Citas por profesional',
      'Fidelización',
      'Gastos y caja',
    ],
    ALTURA: [
      'Historia clínica del paciente',
      'Odontograma / evoluciones / consentimientos',
      'Varias sedes',
    ],
    ORBITA: ['Sedes y usuarios ilimitados', 'Nómina electrónica'],
  },
  retail: {
    DESPEGUE: ['Ventas (POS)', 'Inventario básico', 'Clientes'],
    IMPULSO: [
      'Inventario completo',
      'Compras y proveedores',
      'Cartera / fiado',
      'Gastos y caja',
    ],
    ALTURA: [
      'Tienda online conectada al inventario',
      'Varias sedes / bodegas',
      'Avisos de consignación al banco',
    ],
    ORBITA: ['Sedes y usuarios ilimitados', 'Nómina electrónica', 'API'],
  },
};

// Transversal a TODAS las verticales (se agrega según el plan).
const CROSS = {
  IMPULSO: [
    '🧾 Facturación electrónica DIAN ilimitada',
    '🔐 Certificado y firma digital incluidos',
    'Estadísticas completas',
    'Roles y permisos',
    'Soporte prioritario por WhatsApp',
  ],
  ALTURA: ['📊 Estadísticas a profundidad'],
  ORBITA: ['Gerente de cuenta y capacitación'],
};

export function groupForType(type) {
  return GROUP_BY_TYPE[type] || DEFAULT_GROUP;
}

export function taglineForType(type) {
  return TAGLINE[groupForType(type)];
}

// Devuelve las features a mostrar para un plan, adaptadas al tipo de negocio.
// Incluye "Todo lo de <plan anterior>" para reflejar el acumulado.
export function planFeaturesForType(planId, type, prevPlanName) {
  const group = groupForType(type);
  const own = HIGHLIGHTS[group]?.[planId] || [];
  const cross = CROSS[planId] || [];
  const acc = prevPlanName ? [`Todo lo de ${prevPlanName}`] : [];
  return [...acc, ...own, ...cross];
}
