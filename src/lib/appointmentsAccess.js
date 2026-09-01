import { BUSINESS_TYPES } from '@/config/businessTypes';
import { planAllowsModule } from '@/lib/plans';

// Módulos EFECTIVOS de la empresa (misma prioridad que el menú): override manual
// por empresa → configuración del tipo en BD (typeModules) → mapa por defecto.
// Así el Inicio se adapta a las verticales nuevas creadas desde la plataforma.
export function effectiveModules(usuario) {
  const company = usuario?.company;
  const manual = company?.enabledModules;
  if (Array.isArray(manual) && manual.length) return manual;
  const typeMods = company?.typeModules;
  if (Array.isArray(typeMods) && typeMods.length) return typeMods;
  return BUSINESS_TYPES[company?.type] || BUSINESS_TYPES.COMERCIO;
}

// La agenda de inicio y los recordatorios de citas solo aplican a empresas que
// realmente manejan citas: sus módulos incluyen `appointments` y su plan lo
// tiene habilitado (IMPULSO+).
export function usesAppointments(usuario) {
  if (!usuario) return false;
  // El creador de la plataforma no opera una empresa de citas.
  if (usuario.role === 'SUPER_PLATFORM_ADMIN') return false;

  const plan = usuario.company?.plan;
  return (
    effectiveModules(usuario).includes('appointments') &&
    planAllowsModule(plan, 'appointments')
  );
}

// ¿La empresa es de servicios/citas? (independiente del plan). Usado para
// mostrar herramientas propias de servicios como "reactivar clientes".
export function isServicesBusiness(usuario) {
  if (!usuario) return false;
  if (usuario.role === 'SUPER_PLATFORM_ADMIN') return false;
  return effectiveModules(usuario).includes('appointments');
}

// ¿La empresa es de comida (restaurante/bar/pizzería…)? Se detecta por el
// módulo de cocina (KDS), que solo tienen los negocios de comida. Así aplica a
// cualquier vertical de comida, incluidas las creadas desde la plataforma.
export function isFoodBusiness(usuario) {
  if (!usuario) return false;
  if (usuario.role === 'SUPER_PLATFORM_ADMIN') return false;
  const m = effectiveModules(usuario);
  return m.includes('kitchen') || m.includes('mesas');
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
