import apiFetch from '../../auth/client';

export async function getProducts(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('limit', String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/inventory?${query.toString()}`);
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
    slug,
    stock,
    createdBy,
    createdById,
    updatedBy,
    updatedById,
    ...cleanDto
  } = dto;

  const cleanVariants = Array.isArray(cleanDto.variants)
    ? cleanDto.variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        color: v.color,
        stock: Number(v.stock),
      }))
    : [];

  const cleanFeatures = Array.isArray(cleanDto.features)
    ? cleanDto.features.map((v) => ({
        title: v.title,
        description: v.description,
        order: Number(v.order),
      }))
    : [];

  const cleanSpecifications = Array.isArray(cleanDto.specifications)
    ? cleanDto.specifications.map((v) => ({
        key: v.key,
        value: v.value,
        order: Number(v.order),
      }))
    : [];

  const body = {
    ...cleanDto,
    variants: cleanVariants,
    features: cleanFeatures,
    specifications: cleanSpecifications,
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

  const formData = new FormData();

  const keepImageIds = images
    .filter((img) => img.id && !img._removed)
    .map((img) => img.id);

  images
    .filter((img) => img.file)
    .forEach((img) => {
      formData.append('images', img.file);
    });

  keepImageIds.forEach((id) => {
    formData.append('keepImageIds', id);
  });

  return apiFetch(`/inventory/${productId}/images`, {
    method: 'PUT',
    body: formData,
    headers: undefined,
  });
}
