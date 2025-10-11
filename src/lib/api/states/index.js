import apiFetch from '../auth/client';

export async function getStates() {
  return apiFetch('/states'); // GET /states
}

export async function getStateById(id) {
  return apiFetch(`/states/${id}`); // GET /states/:id
}
