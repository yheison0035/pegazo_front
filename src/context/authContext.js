'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin, logout as apiLogout } from '@/lib/api/auth/auth';
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
    } catch (err) {
      throw new Error(err.message || 'Credenciales inválidas');
    }
  };

  const logout = () => {
    apiLogout();
    setUsuario(null);
    router.push('/CRM');
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
