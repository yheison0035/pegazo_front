'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import { getVapidPublicKey, subscribePush } from '@/lib/api/routes/push';

// Convierte la llave pública VAPID (base64url) al formato que espera el
// navegador (Uint8Array).
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// Registra al usuario para notificaciones push (por rol) en la PWA. Si el
// permiso ya está dado, se suscribe en silencio; si está "por preguntar", pide
// permiso (en Android muestra el diálogo). Nunca rompe la app si algo falla.
export default function PushRegister() {
  const { usuario } = useAuth();

  useEffect(() => {
    if (!usuario?.id) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (typeof Notification === 'undefined') return;

    let cancelled = false;

    const doSubscribe = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          const res = await getVapidPublicKey();
          const key = res?.data?.publicKey;
          if (!key) return; // backend sin VAPID configurado
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key),
          });
        }
        if (cancelled) return;
        await subscribePush(sub.toJSON());
      } catch {
        /* sin permiso o no soportado: la app sigue igual */
      }
    };

    const run = async () => {
      if (Notification.permission === 'granted') {
        doSubscribe();
      } else if (Notification.permission === 'default') {
        try {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') doSubscribe();
        } catch {
          /* iOS puede requerir gesto del usuario; se reintenta al próximo ingreso */
        }
      }
    };

    // Pequeño retardo para no competir con la carga inicial.
    const t = setTimeout(run, 1500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [usuario?.id]);

  return null;
}
