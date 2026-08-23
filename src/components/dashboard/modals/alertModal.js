'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/context/toastContext';

// Adaptador de compatibilidad: antes AlertModal era un modal que bloqueaba la
// pantalla. Ahora TODAS las alertas del CRM son notificaciones (toasts) con el
// mismo diseño, que aparecen y se ocultan solas en tiempo real. Se conserva la
// misma API (type/message/onClose/url/title) para no tener que tocar las
// decenas de pantallas que ya lo usan: en cuanto llega un `message`, se muestra
// el toast y se limpia el estado del padre (onClose) para que pueda repetirse.
export default function AlertModal({ type = 'info', message, onClose, url, title }) {
  const toast = useToast();
  const lastRef = useRef(null);

  useEffect(() => {
    if (message && message !== lastRef.current) {
      lastRef.current = message;
      toast.show({ type, message, url, title });
      // Limpia el estado del padre (normalmente setAlert({})): el toast ya vive
      // por su cuenta, y así el mismo mensaje puede volver a dispararse luego.
      onClose?.();
    }
    if (!message) lastRef.current = null;
    // Solo reaccionamos al cambio de `message` (patrón de uso en todo el CRM).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  return null;
}
