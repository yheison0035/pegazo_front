import apiFetch from '../../auth/client';

export async function getNotifications(limit = 30) {
  return apiFetch(`/notifications?limit=${limit}`);
}

export async function getUnreadNotificationCount() {
  return apiFetch('/notifications/unread-count');
}

export async function markNotificationRead(id) {
  return apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
  return apiFetch('/notifications/read-all', { method: 'PATCH' });
}

// Persiste en la campana el recordatorio de una cita próxima (idempotente).
export async function notifyAppointmentReminder(appointmentId) {
  return apiFetch('/notifications/appointment-reminder', {
    method: 'POST',
    body: JSON.stringify({ appointmentId }),
  });
}

// Crea (idempotente) el aviso de vencimiento del plan si faltan ≤ 3 días.
export async function notifySubscriptionDue() {
  return apiFetch('/notifications/subscription-due', { method: 'POST' });
}
