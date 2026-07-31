import apiFetch from '../../auth/client';

// El SUPER_PLATFORM_ADMIN puede configurar la tienda de cualquier empresa
// pasando companyId; una empresa normal configura siempre la suya.
function withCompany(path, companyId) {
  return companyId ? `${path}?companyId=${companyId}` : path;
}

export async function getWebsiteConfig(companyId) {
  return apiFetch(withCompany('/website/admin/config', companyId));
}

export async function updateWebsiteConfig(dto, companyId) {
  return apiFetch(withCompany('/website/admin/config', companyId), {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function uploadWebsiteImage(file, companyId) {
  const formData = new FormData();
  formData.append('image', file);

  return apiFetch(withCompany('/website/admin/upload', companyId), {
    method: 'POST',
    body: formData,
    headers: undefined,
  });
}

export async function createWebsiteBanner(dto, companyId) {
  return apiFetch(withCompany('/website/admin/banners', companyId), {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateWebsiteBanner(id, dto, companyId) {
  return apiFetch(withCompany(`/website/admin/banners/${id}`, companyId), {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deleteWebsiteBanner(id, companyId) {
  return apiFetch(withCompany(`/website/admin/banners/${id}`, companyId), {
    method: 'DELETE',
  });
}
