import apiFetch from '../../auth/client';

export async function getUsers(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;

  const query = new URLSearchParams();

  query.set('page', String(page));
  query.set('limit', String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/users?${query.toString()}`);
}

export async function getUserById(id) {
  return apiFetch(`/users/${id}`);
}

// Autoservicio de perfil: cualquier rol puede leer/editar sus propios datos.
export async function getMyProfile() {
  return apiFetch('/users/me/profile');
}

// Solo datos personales + contraseña. El rol y el correo NUNCA se envían: no
// se pueden cambiar desde el perfil (y el backend igual los ignora).
export async function updateMyProfile(dto = {}) {
  const {
    name,
    phone,
    address,
    birthdate,
    document,
    department,
    city,
    password,
  } = dto;

  const body = {
    name,
    phone,
    address,
    document,
    department,
    city,
    ...(birthdate ? { birthdate: new Date(birthdate) } : {}),
    ...(password ? { password } : {}),
  };

  return apiFetch('/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// Listado global de usuarios (todas las empresas) — plataforma
export async function getGlobalUsers(params = {}) {
  const { page = 1, limit = 20, ...filters } = params;

  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  return apiFetch(`/users/platform/all?${query.toString()}`);
}

// Soporte de plataforma: activar/desactivar cualquier usuario.
export async function platformSetUserStatus(id, status) {
  return apiFetch(`/users/platform/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// Soporte de plataforma: resetear la contraseña de cualquier usuario.
export async function platformResetUserPassword(id, password) {
  return apiFetch(`/users/platform/${id}/reset-password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}

// Plataforma: crear un usuario en una empresa.
export async function platformCreateUser(companyId, dto) {
  return apiFetch(`/users/platform/company/${companyId}`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// Plataforma: editar rol/estado/sede/empresa de un usuario.
export async function platformUpdateUser(id, dto) {
  return apiFetch(`/users/platform/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function createUser(dto) {
  const body = {
    ...dto,
    localId: dto.localId ? Number(dto.localId) : null,
    role: dto.role || 'ASESOR',
    status: dto.status || 'ACTIVO',
    birthdate: new Date(dto.birthdate),
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
    company,
    companyId,
    ...cleanDto
  } = dto;

  const body = {
    ...cleanDto,
    localId: cleanDto.localId ? Number(cleanDto.localId) : null,
    birthdate: new Date(cleanDto.birthdate),
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

export async function getUsersByRole(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  const res = await apiFetch(`/users/by-role?${query.toString()}`);

  return res.data || res;
}

// Profesionales para la reserva pública (sin sesión): deriva la empresa del local.
export async function getPublicProfessionals(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });
  const res = await apiFetch(`/public/professionals?${query.toString()}`, {
    auth: false,
  });
  return res?.data ?? res ?? [];
}
