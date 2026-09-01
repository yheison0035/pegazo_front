import apiFetch from '../../auth/client';

// --- Plataforma (CRUD de comunicados) ---
export async function getAnnouncements() {
  return apiFetch('/announcements');
}

export async function createAnnouncement(dto) {
  return apiFetch('/announcements', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateAnnouncement(id, dto) {
  return apiFetch(`/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deleteAnnouncement(id) {
  return apiFetch(`/announcements/${id}`, { method: 'DELETE' });
}

// --- Negocio autenticado: comunicados vigentes que le corresponden ---
export async function getMyAnnouncements() {
  return apiFetch('/my-announcements');
}
