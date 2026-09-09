'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BellIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/toastContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/api/routes/notifications';

// Tiempo relativo corto: "ahora", "hace 5 min", "hace 2 h", "hace 3 d".
function timeAgo(dateStr) {
  try {
    const d = new Date(dateStr).getTime();
    const s = Math.max(0, Math.floor((Date.now() - d) / 1000));
    if (s < 60) return 'ahora';
    const m = Math.floor(s / 60);
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const days = Math.floor(h / 24);
    return `hace ${days} d`;
  } catch {
    return '';
  }
}

// Campana de notificaciones in-app (todos los usuarios). Sondea en tiempo real,
// muestra un toast al llegar una nueva (sin voz) y la deja en el panel con
// estado leído/no leído. El contador no baja hasta marcarlas leídas.
export default function NotificationBell({ expanded }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const known = useRef(new Set());
  const initialized = useRef(false);

  const enabled = !!usuario?.id;
  const unread = items.filter((n) => !n.read).length;

  const poll = useCallback(async () => {
    if (!enabled) return;
    try {
      const { data } = await getNotifications(30);
      const list = Array.isArray(data) ? data : [];
      // Detecta las nuevas (que no habíamos visto) para el toast. En la primera
      // carga no se anuncia el histórico, solo se registra.
      if (initialized.current) {
        const nuevas = list.filter((n) => !known.current.has(n.id) && !n.read);
        // De más antigua a más nueva para que la más reciente quede arriba.
        [...nuevas].reverse().forEach((n) => {
          toast.show({ type: 'info', title: n.title, message: n.body });
        });
      }
      list.forEach((n) => known.current.add(n.id));
      initialized.current = true;
      setItems(list);
    } catch {
      // silencioso: la campana no debe romper la navegación
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

  const openNotification = async (n) => {
    if (!n.read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      try {
        await markNotificationRead(n.id);
      } catch {
        /* noop */
      }
    }
    setOpen(false);
    if (n.url) router.push(n.url);
  };

  const markAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      /* noop */
    }
  };

  if (!enabled) return null;

  return (
    <>
      <div className="border-t border-white/10 px-2 py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Notificaciones"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-gray-300 transition hover:bg-white/10"
        >
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

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-4 pt-20"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-white">
                <BellIcon className="h-5 w-5" /> Notificaciones
                {unread > 0 && (
                  <span className="rounded-full bg-white/25 px-2 text-xs font-semibold">
                    {unread} sin leer
                  </span>
                )}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-end border-b border-gray-100 px-4 py-2">
              <button
                onClick={markAll}
                disabled={unread === 0}
                className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 disabled:cursor-not-allowed disabled:text-gray-300"
              >
                <CheckIcon className="h-4 w-4" /> Marcar todas como leídas
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-14 text-center text-sm text-gray-400">
                  No tienes notificaciones.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {items.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => openNotification(n)}
                        className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
                          n.read ? 'bg-white' : 'bg-orange-50/60'
                        }`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 flex-none rounded-full ${
                            n.read ? 'bg-transparent' : 'bg-orange-500'
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className={`truncate text-sm ${
                                n.read
                                  ? 'font-medium text-gray-700'
                                  : 'font-semibold text-gray-900'
                              }`}
                            >
                              {n.title}
                            </span>
                            <span className="flex-none text-[11px] text-gray-400">
                              {timeAgo(n.createdAt)}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            {n.body}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
