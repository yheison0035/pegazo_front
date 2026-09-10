import apiFetch from '../../auth/client';

// Sube una imagen del chat a Cloudinary (carpeta support) y devuelve su URL.
export async function uploadSupportImage(file) {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch('/support/upload', { method: 'POST', body: fd });
}

// ---- Negocio (cliente) ----
export async function getSupportThread() {
  return apiFetch('/support');
}
export async function sendSupportMessage(body, imageUrl) {
  return apiFetch('/support', {
    method: 'POST',
    body: JSON.stringify({ body, imageUrl }),
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
export async function sendPlatformSupport(companyId, body, imageUrl) {
  return apiFetch(`/support/threads/${companyId}`, {
    method: 'POST',
    body: JSON.stringify({ body, imageUrl }),
  });
}
export async function getPlatformSupportUnread() {
  return apiFetch('/support/platform/unread-count');
}
