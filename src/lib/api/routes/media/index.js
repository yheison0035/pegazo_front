import apiFetch from '../../auth/client';

// Subida de imágenes de usuario a Cloudinary. Usa el endpoint de usuarios
// (accesible a admins de empresa), NO el de logo de empresa que está reservado
// al admin de plataforma. Devuelve { data: { url } }.
export async function uploadImage(file) {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch('/users/image-upload', { method: 'POST', body: fd });
}
