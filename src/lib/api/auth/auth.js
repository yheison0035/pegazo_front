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
