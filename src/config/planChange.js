// Módulo "Cambiar / Mejorar mi plan" (botón del menú, página /dashboard/upgrade
// y CTA del modal de upgrade). APAGADO para TODOS los tipos de negocio: por ahora
// se maneja un solo plan para todos. Para reactivarlo en el futuro basta con
// poner PLAN_CHANGE_ENABLED en true; el código del módulo queda intacto.
// "Mi suscripción" (/dashboard/billing: pago y vencimiento) NO se ve afectado.
export const PLAN_CHANGE_ENABLED = false;

// Solo el dueño (SUPER_ADMIN) gestiona el plan, y solo si el módulo está activo.
export function canChangePlan(role, enabled = PLAN_CHANGE_ENABLED) {
  return !!enabled && role === 'SUPER_ADMIN';
}
