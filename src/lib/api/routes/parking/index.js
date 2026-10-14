import apiFetch from '../../auth/client';

// PARQUEADERO — operación (ingreso/salida) + tarifas por tipo de vehículo.
export const getParking = () => apiFetch('/parking');
export const getParkingHistory = (limit = 30) =>
  apiFetch(`/parking/history?limit=${limit}`);

export const getParkingSettings = () => apiFetch('/parking/settings');
export const updateParkingSettings = (dto) =>
  apiFetch('/parking/settings', { method: 'PATCH', body: JSON.stringify(dto) });

export const getVehicleTypes = () => apiFetch('/parking/types');
export const createVehicleType = (dto) =>
  apiFetch('/parking/types', { method: 'POST', body: JSON.stringify(dto) });
export const updateVehicleType = (id, dto) =>
  apiFetch(`/parking/types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
export const deleteVehicleType = (id) =>
  apiFetch(`/parking/types/${id}`, { method: 'DELETE' });

export const parkingCheckIn = (dto) =>
  apiFetch('/parking/checkin', { method: 'POST', body: JSON.stringify(dto) });
export const parkingQuote = (id) => apiFetch(`/parking/${id}/quote`);
export const parkingCheckout = (id, dto) =>
  apiFetch(`/parking/${id}/checkout`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
export const parkingCancel = (id) =>
  apiFetch(`/parking/${id}/cancel`, { method: 'POST' });
