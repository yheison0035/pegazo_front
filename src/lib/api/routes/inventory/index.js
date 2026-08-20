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

// Productos con stock bajo (stock total <= alerta de stock mínimo).
export async function getLowStock() {
  return apiFetch('/inventory/low-stock');
}

// Productos por vencer (próximos 30 días o ya vencidos).
export async function getExpiring() {
  return apiFetch('/inventory/expiring');
}

export async function createProduct(dto) {
  const { id: _id, createdAt, updatedAt, color, sku, stock, ...cleanDto } = dto;

  const body = {
    ...cleanDto,
    brandId: Number(cleanDto.brandId) || null,
    categoryId: Number(cleanDto.categoryId) || null,
    localId: Number(cleanDto.localId) || null,
    providerId: Number(cleanDto.providerId) || null,
    minStock: Number(cleanDto.minStock) || 0,
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
    publishInEcommerce,
    ...cleanDto
  } = dto;

  const cleanVariants = Array.isArray(cleanDto.variants)
    ? cleanDto.variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        color: v.color,
        ...(v.size ? { size: v.size } : {}),
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
    minStock: Number(cleanDto.minStock) || 0,
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

  // Lista final en el orden en que quedaron (ya sin las eliminadas).
  const finalImages = images.filter((img) => !img._removed);

  // Archivos nuevos, en su orden.
  finalImages
    .filter((img) => img.file)
    .forEach((img) => formData.append('images', img.file));

  // Ids de las existentes que se conservan.
  finalImages
    .filter((img) => img.id)
    .forEach((img) => formData.append('keepImageIds', img.id));

  // Orden final: por cada imagen, su id (existente) o 'NEW' (archivo nuevo).
  // El backend usa esto para reposicionar TODO (incluida la "Principal").
  finalImages.forEach((img) =>
    formData.append('order', img.id ? String(img.id) : 'NEW')
  );

  return apiFetch(`/inventory/${productId}/images`, {
    method: 'PUT',
    body: formData,
    headers: undefined,
  });
}
