'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BellIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/api/routes/notifications';

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

function fmtFull(dateStr) {
  try {
    return new Date(dateStr).toLocaleString('es-CO');
  } catch {
    return '';
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all'); // all | unread

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getNotifications(60);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unread = items.filter((n) => !n.read).length;
  const visible = tab === 'unread' ? items.filter((n) => !n.read) : items;

  const openNotification = async (n) => {
    if (!n.read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      try {
        await markNotificationRead(n.id);
        window.dispatchEvent(new Event('notifications-changed'));
      } catch {
        /* noop */
      }
    }
    if (n.url) router.push(n.url);
  };

  const markAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    try {
      await markAllNotificationsRead();
      window.dispatchEvent(new Event('notifications-changed'));
    } catch {
      /* noop */
    }
  };

  return (
    <div className="mx-auto mt-6 max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <BellIcon className="h-6 w-6 text-orange-500" /> Notificaciones
          </h1>
          <p className="text-sm text-gray-500">
            Avisos del negocio en tiempo real. Marca como leídas las que ya
            revisaste.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4" /> Actualizar
          </button>
          <button
            onClick={markAll}
            disabled={unread === 0}
            className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4" /> Marcar todas
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {[
          ['all', 'Todas'],
          ['unread', `Sin leer${unread ? ` (${unread})` : ''}`],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === k
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Cargando…</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
          {tab === 'unread'
            ? 'No tienes notificaciones sin leer.'
            : 'No tienes notificaciones.'}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {visible.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => openNotification(n)}
                className={`flex w-full gap-3 px-5 py-4 text-left transition hover:bg-gray-50 ${
                  n.read ? 'bg-white' : 'bg-orange-50/60'
                }`}
              >
                <span
                  className={`mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${
                    n.read ? 'bg-gray-200' : 'bg-orange-500'
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm ${
                        n.read
                          ? 'font-medium text-gray-700'
                          : 'font-semibold text-gray-900'
                      }`}
                    >
                      {n.title}
                    </span>
                    <span
                      className="flex-none text-[11px] text-gray-400"
                      title={fmtFull(n.createdAt)}
                    >
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm text-gray-500">
                    {n.body}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
