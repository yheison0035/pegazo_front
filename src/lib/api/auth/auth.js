import apiFetch from './client';

export async function login(email, password) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    auth: false,
  });

  const { data } = res;

  const token = data?.access_token;
  if (!token) throw new Error('No se recibió token del servidor');

  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
  return res;
}

export async function forgotPassword(email) {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
    auth: false,
  });
}

export async function resetPassword(token, password) {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
    auth: false,
  });
}

export async function requestPasswordOtp(identifier) {
  return apiFetch('/auth/forgot-password-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
    auth: false,
  });
}

export async function resetPasswordWithOtp(identifier, code, password) {
  return apiFetch('/auth/reset-password-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier, code, password }),
    auth: false,
  });
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}
