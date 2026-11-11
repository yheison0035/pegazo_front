'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/context/authContext';
import { getLocals } from '@/lib/api/routes/locals';

// Sede ACTIVA global del panel (selector de la parte superior). Es la fuente
// única: cada módulo la lee para mostrar solo esa sede. Vacío = todas las sedes
// accesibles. Solo tiene sentido para quien ve más de una sede (el dueño); un
// usuario con una sola sede no ve el selector y su sede ya está fijada.
const LocalScopeContext = createContext({
  activeLocal: '',
  setActiveLocal: () => {},
  locals: [],
  multi: false,
});

export function LocalScopeProvider({ children }) {
  const { usuario } = useAuth();
  // El selector global de sede es SOLO para el dueño (SUPER_ADMIN). Los demás
  // roles ven su local asignado (admin) o ya ven todo (coordinador/auxiliar),
  // así que ni ven el selector ni acotan por sede activa.
  const isOwner = usuario?.role === 'SUPER_ADMIN';
  const storageKey = `pegazo:activeLocal:${usuario?.company?.id || 0}:${usuario?.id || 0}`;

  const [locals, setLocals] = useState([]);
  const [activeLocal, setActive] = useState('');

  // Restaura la última sede elegida (por usuario/empresa).
  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      setActive(v || '');
    } catch {
      setActive('');
    }
  }, [storageKey]);

  // Carga las sedes accesibles (el backend ya filtra por rol).
  useEffect(() => {
    if (!usuario?.id) {
      setLocals([]);
      return;
    }
    let alive = true;
    getLocals({ all: true })
      .then((r) => {
        if (alive) setLocals(r?.data || []);
      })
      .catch(() => {
        if (alive) setLocals([]);
      });
    return () => {
      alive = false;
    };
  }, [usuario?.id]);

  const setActiveLocal = useCallback(
    (v) => {
      const val = v ? String(v) : '';
      setActive(val);
      try {
        if (val) localStorage.setItem(storageKey, val);
        else localStorage.removeItem(storageKey);
      } catch {
        /* almacenamiento no disponible */
      }
    },
    [storageKey],
  );

  // Si la sede guardada ya no está entre las accesibles, se limpia.
  useEffect(() => {
    if (!activeLocal || locals.length === 0) return;
    if (!locals.some((l) => String(l.id) === String(activeLocal))) {
      setActiveLocal('');
    }
  }, [locals, activeLocal, setActiveLocal]);

  const value = useMemo(
    () => ({
      // Solo el dueño acota por sede activa; para el resto es '' (ven lo suyo).
      activeLocal: isOwner ? activeLocal : '',
      setActiveLocal,
      locals,
      // El selector solo aparece para el dueño con 2+ sedes.
      multi: isOwner && locals.length > 1,
    }),
    [isOwner, activeLocal, setActiveLocal, locals],
  );

  return (
    <LocalScopeContext.Provider value={value}>
      {children}
    </LocalScopeContext.Provider>
  );
}

export function useLocalScope() {
  return useContext(LocalScopeContext);
}
