import apiFetch from '../../auth/client';
import { toFullISO } from '../../utils/utils';

export async function getUsers() {
  return apiFetch('/users');
}

export async function getUserById(id) {
  return apiFetch(`/users/${id}`);
}

export async function createUser(dto) {
  const body = {
    ...dto,
    localId: dto.localId ? Number(dto.localId) : null,
    role: dto.role || 'ASESOR',
    status: dto.status || 'ACTIVO',
  };
  return apiFetch('/users', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateUser(id, dto) {
  const {
    id: _id,
    createdAt,
    updatedAt,
    password,
    managedLocals,
    local,
    avatar,
    ...cleanDto
  } = dto;

  const body = {
    ...cleanDto,
    localId: cleanDto.localId ? Number(cleanDto.localId) : null,
    birthdate: cleanDto.birthdate ? toFullISO(cleanDto.birthdate) : undefined,
    ...(password ? { password } : {}),
  };

  return apiFetch(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteUser(id) {
  return apiFetch(`/users/${id}`, { method: 'DELETE' });
}

export async function toggleUserRole(id) {
  return apiFetch(`/users/${id}`, { method: 'PATCH' });
}

export async function uploadUserAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch('/users/upload-avatar', {
    method: 'POST',
    body: formData,
  });
}

export async function deleteUserAvatar() {
  return apiFetch('/users/avatar', {
    method: 'DELETE',
  });
}
