import apiFetch from '../../auth/client';

export async function getProducts() {
  return apiFetch('/inventory');
}

export async function getProductById(id) {
  return apiFetch(`/inventory/${id}`);
}

export async function createProduct(dto) {
  const { id: _id, createdAt, updatedAt, color, sku, stock, ...cleanDto } = dto;

  const body = {
    ...cleanDto,
    brandId: Number(cleanDto.brandId) || null,
    categoryId: Number(cleanDto.categoryId) || null,
    localId: Number(cleanDto.localId) || null,
    providerId: Number(cleanDto.providerId) || null,
  };

  return apiFetch('/inventory', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateProduct(id, dto) {
  const {
    id: _id,
    createdAt,
    updatedAt,
    brand,
    category,
    images,
    local,
    provider,
    stock,
    ...cleanDto
  } = dto;

  const cleanVariants = Array.isArray(cleanDto.variants)
    ? cleanDto.variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        color: v.color,
        stock: Number(v.stock),
      }))
    : [];

  const body = {
    ...cleanDto,
    variants: cleanVariants,
    localId: Number(cleanDto.localId) || null,
    providerId: Number(cleanDto.providerId) || null,
    categoryId: Number(cleanDto.categoryId) || null,
    brandId: Number(cleanDto.brandId) || null,
  };

  return apiFetch(`/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteProduct(id) {
  return apiFetch(`/inventory/${id}`, { method: 'DELETE' });
}

export async function uploadProductImages(productId, images) {
  if (!Array.isArray(images)) return;

  const existingImages = images.filter((img) => img.id);
  const newImages = images.filter((img) => img.file);

  const keepImageIds = existingImages.map((img) => img.id);

  const formData = new FormData();

  // Nuevas imágenes
  newImages.forEach((img) => {
    formData.append('images', img.file);
  });

  // Orden de imágenes existentes
  keepImageIds.forEach((id) => {
    formData.append('keepImageIds', id);
  });

  return apiFetch(`/inventory/${productId}/images`, {
    method: 'PUT',
    body: formData,
    headers: undefined,
  });
}
