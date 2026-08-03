import { BUSINESS_TYPES } from '@/config/businessTypes';
import { planAllowsModule } from '@/lib/plans';

// La agenda de inicio y los recordatorios de citas solo aplican a empresas que
// realmente manejan citas: su tipo de negocio incluye el módulo `appointments`
// (hoy, SERVICIOS) y su plan lo tiene habilitado (IMPULSO+).
export function usesAppointments(usuario) {
  if (!usuario) return false;
  // El creador de la plataforma no opera una empresa de citas.
  if (usuario.role === 'SUPER_PLATFORM_ADMIN') return false;

  const type = usuario.company?.type || 'COMERCIO';
  const plan = usuario.company?.plan;
  const modules = BUSINESS_TYPES[type] || BUSINESS_TYPES.COMERCIO;

  return modules.includes('appointments') && planAllowsModule(plan, 'appointments');
}

// ¿La empresa es de servicios/citas? (independiente del plan). Usado para
// mostrar herramientas propias de servicios como "reactivar clientes".
export function isServicesBusiness(usuario) {
  if (!usuario) return false;
  if (usuario.role === 'SUPER_PLATFORM_ADMIN') return false;
  const type = usuario.company?.type || 'COMERCIO';
  const modules = BUSINESS_TYPES[type] || BUSINESS_TYPES.COMERCIO;
  return modules.includes('appointments');
}

// Fecha de "hoy" en calendario Colombia (UTC-5) en formato YYYY-MM-DD. Se usa
// como clave para mostrar el modal / recordatorios una sola vez por día.
export function colombiaToday() {
  return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
}

// Texto "en 1 h 30 min" / "en 45 min" / "ahora" según los ms que faltan.
export function timeUntilLabel(ms) {
  if (ms <= 0) return 'ahora';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `en ${m} min`;
  if (m === 0) return `en ${h} h`;
  return `en ${h} h ${m} min`;
}
