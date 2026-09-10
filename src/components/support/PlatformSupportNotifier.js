'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/toastContext';
import { getPlatformSupportUnread } from '@/lib/api/routes/support';

// Aviso en tiempo real para SUPER_PLATFORM: sondea los mensajes de soporte sin
// leer y muestra un toast cuando entra uno nuevo, aunque no esté en la bandeja.
export default function PlatformSupportNotifier() {
  const { usuario } = useAuth();
  const toast = useToast();
  const prev = useRef(null);

  const isPlatform = usuario?.role === 'SUPER_PLATFORM_ADMIN';

  useEffect(() => {
    if (!isPlatform) return;
    let alive = true;
    const poll = async () => {
      try {
        const { data } = await getPlatformSupportUnread();
        const c = Number(data?.count) || 0;
        if (!alive) return;
        if (prev.current != null && c > prev.current) {
          toast.show({
            type: 'info',
            title: 'Nuevo mensaje de soporte',
            message: 'Un negocio te escribió. Ábrelo en Soporte.',
          });
        }
        prev.current = c;
      } catch {
        /* silencioso */
      }
    };
    poll();
    const t = setInterval(poll, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [isPlatform, toast]);

  return null;
}
