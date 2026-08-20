'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  login as apiLogin,
  logout as apiLogout,
  registerBusiness as apiRegisterBusiness,
} from '@/lib/api/auth/auth';
import apiFetch from '@/lib/api/auth/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      setUsuario(JSON.parse(storedUser));
    }

    setLoading(false);

    // Refresca el perfil en segundo plano para tener siempre datos al día
    // (incluido el plan de la empresa), sin depender de volver a iniciar sesión.
    if (token) {
      apiFetch('/auth/me')
        .then((profile) => {
          const userData = profile?.data;
          if (userData) {
            localStorage.setItem('usuario', JSON.stringify(userData));
            setUsuario(userData);
          }
        })
        .catch(() => {
          // Si el token expiró, apiFetch ya lo eliminó: se cierra la sesión.
          if (!localStorage.getItem('token')) {
            localStorage.removeItem('usuario');
            setUsuario(null);
          }
        });
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await apiLogin(email, password);
      const { data } = res;

      const token = data?.access_token;
      if (!token) throw new Error('Token no recibido');

      localStorage.setItem('token', token);

      const profile = await apiFetch('/auth/me');
      const { data: userData } = profile;

      localStorage.setItem('usuario', JSON.stringify(userData));
      setUsuario(userData);

      return userData;
    } catch (err) {
      throw new Error(err.message || 'Credenciales inválidas');
    }
  };

  // Auto-registro de negocio: crea la empresa + admin y deja la sesión iniciada.
  const registerBusiness = async (payload) => {
    const res = await apiRegisterBusiness(payload);
    const token = res?.data?.access_token;
    if (!token) throw new Error('No se recibió token del servidor');

    localStorage.setItem('token', token);

    const profile = await apiFetch('/auth/me');
    const { data: userData } = profile;

    localStorage.setItem('usuario', JSON.stringify(userData));
    setUsuario(userData);

    return userData;
  };

  const logout = () => {
    apiLogout();
    // Limpia la marca de "agenda ya mostrada" para que el modal de citas
    // vuelva a aparecer en el próximo inicio de sesión.
    try {
      sessionStorage.removeItem('pegazo:agenda-shown');
    } catch {
      /* ignora */
    }
    setUsuario(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{ usuario, setUsuario, loading, login, logout, registerBusiness }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
