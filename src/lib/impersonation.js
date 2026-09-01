'use client';

import apiFetch from '@/lib/api/auth/client';
import { impersonateCompany } from '@/lib/api/routes/companies';

const ORIGIN_KEY = 'impersonation_origin';

// La plataforma "entra como" una empresa: guarda su sesión de plataforma,
// activa el token de la empresa e hidrata el usuario. Devuelve el usuario.
export async function enterAsCompany(companyId) {
  const originToken = localStorage.getItem('token');
  const originUser = localStorage.getItem('usuario');
  const res = await impersonateCompany(companyId);
  const token = res?.data?.access_token;
  if (!token) throw new Error('No se pudo entrar como la empresa.');
  localStorage.setItem(
    ORIGIN_KEY,
    JSON.stringify({ token: originToken, usuario: originUser }),
  );
  localStorage.setItem('token', token);
  if (res?.data?.user) {
    localStorage.setItem('usuario', JSON.stringify(res.data.user));
  }
  // Hidrata el perfil completo (empresa con tema, módulos, features…).
  try {
    const profile = await apiFetch('/auth/me');
    if (profile?.data) {
      localStorage.setItem('usuario', JSON.stringify(profile.data));
      return profile.data;
    }
  } catch {
    /* si falla, ya quedó el user del token */
  }
  return res?.data?.user || null;
}

// Vuelve a la sesión de plataforma.
export function exitImpersonation() {
  const raw = localStorage.getItem(ORIGIN_KEY);
  if (!raw) return false;
  try {
    const { token, usuario } = JSON.parse(raw);
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    if (usuario) localStorage.setItem('usuario', usuario);
    else localStorage.removeItem('usuario');
  } catch {
    return false;
  }
  localStorage.removeItem(ORIGIN_KEY);
  return true;
}

export function isImpersonating() {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(ORIGIN_KEY);
}
