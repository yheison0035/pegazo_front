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
