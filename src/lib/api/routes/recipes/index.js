import apiFetch from '../../auth/client';

export async function getRecipe(inventoryId) {
  return apiFetch(`/recipes/${inventoryId}`);
}

export async function setRecipe(inventoryId, items) {
  return apiFetch(`/recipes/${inventoryId}`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}
