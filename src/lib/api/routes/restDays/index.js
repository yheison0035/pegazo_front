import apiFetch from '../../auth/client';

export async function getRestDaysProfessionals() {
  return apiFetch('/rest-days/professionals');
}

export async function getRestDays(userId) {
  return apiFetch(`/rest-days/${userId}`);
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
