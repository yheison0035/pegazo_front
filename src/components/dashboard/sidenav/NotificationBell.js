'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/toastContext';
import {
  getNotifications,
  getUnreadNotificationCount,
} from '@/lib/api/routes/notifications';

// Campana de notificaciones in-app (todos los usuarios). Sondea en tiempo real,
// muestra un toast al llegar una nueva (sin voz) y mantiene el contador de no
// leídas. Al hacer clic abre el módulo /dashboard/notifications (lista completa
// con estado leído/no leído). No renderiza panel propio para no quedar recortada
// por el menú lateral (que usa transform).
export default function NotificationBell({ expanded }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const active = pathname === '/dashboard/notifications';
  const [unread, setUnread] = useState(0);
  const known = useRef(new Set());
  const initialized = useRef(false);

  const enabled = !!usuario?.id;

  const poll = useCallback(async () => {
    if (!enabled) return;
    try {
      // Lista reciente para detectar nuevas (toast) + conteo real de no leídas.
      const [listRes, countRes] = await Promise.all([
        getNotifications(15),
        getUnreadNotificationCount(),
      ]);
      const list = Array.isArray(listRes?.data) ? listRes.data : [];
      if (initialized.current) {
        const nuevas = list.filter(
          (n) => !known.current.has(n.id) && !n.read,
        );
        [...nuevas].reverse().forEach((n) => {
          toast.show({ type: 'info', title: n.title, message: n.body });
        });
      }
      list.forEach((n) => known.current.add(n.id));
      initialized.current = true;
      setUnread(Number(countRes?.data?.count) || 0);
    } catch {
      /* silencioso: la campana no debe romper la navegación */
    }
  }, [enabled, toast]);

  useEffect(() => {
    if (!enabled) return;
    poll();
    const t = setInterval(poll, 8000);
    const onChange = () => poll();
    window.addEventListener('notifications-changed', onChange);
    return () => {
      clearInterval(t);
      window.removeEventListener('notifications-changed', onChange);
    };
  }, [enabled, poll]);

  if (!enabled) return null;

  return (
    <div className="border-t border-white/10 px-2 py-3">
      <button
        type="button"
        onClick={() => router.push('/dashboard/notifications')}
        title="Notificaciones"
        className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2 transition ${
          active
            ? 'bg-gradient-to-r from-orange-500/25 to-amber-500/10 text-white shadow-inner'
            : 'text-gray-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-orange-400" />
        )}
        <span className="relative flex-none">
          <BellIcon
            className={`h-6 w-6 ${unread > 0 ? 'text-orange-300' : 'text-gray-300'}`}
          />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </span>
        {expanded && (
          <span className="flex items-center gap-2 whitespace-nowrap text-sm font-medium">
            Notificaciones
            {unread > 0 && (
              <span className="rounded-full bg-red-500/90 px-1.5 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </span>
        )}
      </button>
    </div>
  );
}
