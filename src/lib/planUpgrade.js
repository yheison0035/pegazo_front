// Canal simple (evento del navegador) para abrir el modal "Mejora tu plan"
// desde cualquier parte: menú bloqueado, errores 403 de plan del backend, etc.

export const PLAN_UPGRADE_EVENT = 'pegazo:plan-upgrade';

export function openPlanUpgrade(detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(PLAN_UPGRADE_EVENT, { detail })
    );
  }
}
