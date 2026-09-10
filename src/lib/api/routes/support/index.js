import apiFetch from '../../auth/client';

// ---- Negocio (cliente) ----
export async function getSupportThread() {
  return apiFetch('/support');
}
export async function sendSupportMessage(body) {
  return apiFetch('/support', {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}
export async function getSupportUnread() {
  return apiFetch('/support/unread-count');
}

// ---- Plataforma (soporte) ----
export async function getSupportThreads() {
  return apiFetch('/support/threads');
}
export async function getPlatformSupportThread(companyId) {
  return apiFetch(`/support/threads/${companyId}`);
}
export async function sendPlatformSupport(companyId, body) {
  return apiFetch(`/support/threads/${companyId}`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}
export async function getPlatformSupportUnread() {
  return apiFetch('/support/platform/unread-count');
}
