import apiFetch from '../../auth/client';

export async function getRestDaysProfessionals() {
  return apiFetch('/rest-days/professionals');
}

export async function getRestDays(userId) {
  return apiFetch(`/rest-days/${userId}`);
}

// Los descansos del propio usuario (rol barbero/profesional).
export async function getMyRestDays() {
  return apiFetch('/rest-days/mine');
}

// Resumen de descansos de todos los profesionales (para el calendario).
export async function getRestDaysOverview() {
  return apiFetch('/rest-days/overview');
}

export async function setRestWeekdays(userId, restWeekdays) {
  return apiFetch(`/rest-days/${userId}/weekdays`, {
    method: 'PUT',
    body: JSON.stringify({ restWeekdays }),
  });
}

export async function addTimeOff(userId, dto) {
  return apiFetch(`/rest-days/${userId}/time-off`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function removeTimeOff(id) {
  return apiFetch(`/rest-days/time-off/${id}`, { method: 'DELETE' });
}
