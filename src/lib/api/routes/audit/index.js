import apiFetch from '../../auth/client';

// Historial completo de cambios de un registro (para el modal de detalle del
// campo "última modificación"). Solo dueño/admin (el backend lo restringe).
export async function getAuditHistory(entity, id) {
  return apiFetch(`/audit/${entity}/${id}`);
}
