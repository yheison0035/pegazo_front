import apiFetch from '../../auth/client';

// Subida genérica de imágenes a Cloudinary vía el backend. Reutiliza el
// endpoint de imágenes ya existente y devuelve { data: { url } }. Sirve para
// fotos de usuario y cualquier otra imagen suelta que necesite una URL.
export async function uploadImage(file) {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch('/companies/logo-upload', { method: 'POST', body: fd });
}
