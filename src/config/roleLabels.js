import { getTerms } from './terminology';

// Etiqueta base de cada rol, independiente de la vertical.
const BASE_LABELS = {
  SUPER_PLATFORM_ADMIN: 'Administrador de plataforma',
  SUPER_ADMIN: 'Administrador principal',
  ADMIN: 'Administrador',
  COORDINADOR: 'Coordinador',
  ASESOR: 'Vendedor',
  VENTAS: 'Vendedor',
  AUXILIAR: 'Auxiliar',
  BODEGUERO: 'Bodeguero',
  RECEPCIONISTA: 'Recepcionista',
  CAJA: 'Cajero',
  MESERO: 'Mesero',
  COCINERO: 'Cocinero',
  // El rol "Profesional" es el que presta el servicio; su nombre cambia por
  // vertical (Barbero, Doctor, Estilista…). BARBERO queda como alias heredado.
  PROFESIONAL: 'Profesional',
  BARBERO: 'Profesional',
};

// Roles cuyo nombre visible se toma de la terminología del negocio (attendant):
// el "Profesional/Atendedor" que presta el servicio.
const VERTICAL_LABELED = new Set(['PROFESIONAL', 'BARBERO']);

// Roles que NO se ofrecen al crear un usuario (obsoletos o de sistema), pero
// siguen siendo válidos si ya estaban asignados.
export const LEGACY_ROLES = new Set(['BARBERO', 'VENTAS']);

// Roles que tiene sentido asignar en cada tipo de negocio. El dropdown de
// creación de usuarios solo ofrece estos (ADMIN siempre disponible). Un rol
// heredado ya asignado sigue siendo válido aunque no aparezca aquí.
const ROLES_BY_TYPE = {
  // Servicios con agenda: el "Profesional" atiende (Barbero/Doctor/Estilista…)
  SERVICIOS: ['ADMIN', 'RECEPCIONISTA', 'PROFESIONAL', 'CAJA', 'AUXILIAR'],
  ODONTOLOGIA: ['ADMIN', 'RECEPCIONISTA', 'PROFESIONAL', 'CAJA', 'AUXILIAR'],

  // Comida: salón y cocina
  RESTAURANTE: ['ADMIN', 'CAJA', 'MESERO', 'COCINERO'],
  COMIDA_RAPIDA: ['ADMIN', 'CAJA', 'MESERO', 'COCINERO'],

  // Canales de venta (pedidos)
  TELEVENTAS: ['ADMIN', 'ASESOR', 'BODEGUERO', 'CAJA'],
  ECOMMERCE: ['ADMIN', 'ASESOR', 'BODEGUERO', 'CAJA'],
  DISTRIBUCION: ['ADMIN', 'ASESOR', 'BODEGUERO', 'CAJA'],
};

// Retail de mostrador: comparten el mismo set.
const RETAIL_ROLES = ['ADMIN', 'CAJA', 'ASESOR', 'BODEGUERO', 'RECEPCIONISTA'];
[
  'COMERCIO',
  'SUPERMERCADO',
  'DROGUERIA',
  'FRUVER',
  'FLORISTERIA',
  'CAFETERIA',
  'CARNICERIA',
  'ROPA',
].forEach((t) => {
  ROLES_BY_TYPE[t] = RETAIL_ROLES;
});

const DEFAULT_ROLES = ['ADMIN', 'ASESOR', 'CAJA', 'BODEGUERO', 'RECEPCIONISTA'];

/**
 * IDs de rol que se pueden asignar en un tipo de negocio (para el dropdown).
 * @param {string} type tipo de empresa (company.type)
 */
export function assignableRolesForType(type) {
  return ROLES_BY_TYPE[type] || DEFAULT_ROLES;
}

/**
 * Nombre visible de un rol, adaptado al tipo de negocio.
 * @param {string} roleId  valor del enum (p. ej. 'PROFESIONAL')
 * @param {object} company empresa actual (para leer su terminología)
 */
export function roleLabel(roleId, company) {
  if (!roleId) return '';
  if (VERTICAL_LABELED.has(roleId)) {
    const t = getTerms(company);
    return t.attendant || BASE_LABELS[roleId] || roleId;
  }
  return BASE_LABELS[roleId] || roleId.replace(/_/g, ' ');
}
