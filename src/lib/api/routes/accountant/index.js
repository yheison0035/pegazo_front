import apiFetch from '../../auth/client';

// Registro/login del contador (identidad independiente).
export async function accountantRegister(payload) {
  return apiFetch('/accountant/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload),
  });
}
export async function accountantLogin(email, password) {
  return apiFetch('/accountant/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  });
}
export async function getAccountantMe() {
  return apiFetch('/accountant/me');
}
