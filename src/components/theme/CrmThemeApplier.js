'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/authContext';

const VALID = ['orange', 'blue', 'emerald'];

// Aplica el tema de diseño elegido por la empresa poniendo un atributo en el
// <html>. Los overrides de color viven en globals.css.
export default function CrmThemeApplier() {
  const { usuario } = useAuth();
  const theme = usuario?.company?.crmTheme;

  useEffect(() => {
    // Antes de tener la sesión, intenta leer de localStorage para evitar parpadeo.
    let value = theme;
    if (!value && typeof window !== 'undefined') {
      try {
        value = JSON.parse(localStorage.getItem('usuario') || '{}')?.company
          ?.crmTheme;
      } catch (_) {}
    }
    const t = VALID.includes(value) ? value : 'orange';
    document.documentElement.dataset.crmTheme = t;
  }, [theme]);

  return null;
}
