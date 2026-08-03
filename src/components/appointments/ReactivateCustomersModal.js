'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  XMarkIcon,
  UserPlusIcon,
  ClockIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import {
  getInactiveCustomers,
  markWinbackContacted,
} from '@/lib/api/routes/delivered_sales';
import { buildWinbackUrl } from '@/lib/appointmentConfirm';

function WaIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2C6.48 2 2 6.24 2 11.5c0 1.98.64 3.81 1.73 5.34L2 22l5.34-1.7c1.5.9 3.2 1.4 4.99 1.4 5.52 0 10-4.24 10-9.5S17.52 2 12 2zm0 17.5c-1.58 0-3.1-.43-4.42-1.25l-.32-.2-3.17 1.01.97-3.07-.21-.32C4.28 14.18 3.8 12.86 3.8 11.5 3.8 7.64 7.47 4.5 12 4.5s8.2 3.14 8.2 7S16.53 19.5 12 19.5zm4.7-5.57c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.57.12-.17.25-.65.8-.8.97-.15.17-.3.19-.55.06-.25-.12-1.04-.38-1.98-1.22-.73-.64-1.22-1.43-1.37-1.68-.15-.25-.02-.39.11-.51.12-.12.25-.3.37-.45.12-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.12-.57-1.38-.78-1.88-.2-.48-.4-.42-.57-.43h-.48c-.17 0-.45.06-.68.32-.23.25-.9.88-.9 2.15s.92 2.5 1.05 2.67c.12.17 1.8 2.76 4.36 3.87 2.56 1.11 2.56.74 3.02.7.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z" />
    </svg>
  );
}

function contactedLabel(iso) {
  if (!iso) return 'Escrito';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'Escrito hoy';
  if (days === 1) return 'Escrito ayer';
  return `Escrito hace ${days} días`;
}

// Modal con los clientes que no vuelven hace 20+ días para reactivarlos por
// WhatsApp. Se divide en "Por escribir" y "Escritos" (contactados esta semana).
export default function ReactivateCustomersModal({ onClose }) {
  const auth = useAuth();
  const companyName = auth?.usuario?.company?.name;
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [tab, setTab] = useState('pending'); // 'pending' | 'done'
  // Contactados en esta sesión (optimista): id -> ISO
  const [justMarked, setJustMarked] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getInactiveCustomers({ minDays: 20 });
        if (alive) setList(res?.data || []);
      } catch {
        if (alive) setList([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const isContacted = (c) => c.contacted || Boolean(justMarked[c.id]);
  const contactedAtOf = (c) => justMarked[c.id] || c.contactedAt;

  const { pending, done } = useMemo(() => {
    const p = [];
    const d = [];
    for (const c of list) (isContacted(c) ? d : p).push(c);
    return { pending: p, done: d };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, justMarked]);

  const write = async (c) => {
    window.open(buildWinbackUrl(c, companyName), '_blank', 'noopener,noreferrer');
    if (isContacted(c)) return;
    // Optimista: pasa a "Escritos" al momento.
    setJustMarked((m) => ({ ...m, [c.id]: new Date().toISOString() }));
    try {
      await markWinbackContacted(c.id);
    } catch {
      // Si falla, se revierte para que se pueda reintentar.
      setJustMarked((m) => {
        const next = { ...m };
        delete next[c.id];
        return next;
      });
    }
  };

  const rows = tab === 'pending' ? pending : done;

  const TabButton = ({ id, label, count }) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        tab === id
          ? 'bg-white text-gray-800 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
      <span
        className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] ${
          tab === id ? 'bg-gray-100 text-gray-600' : 'bg-gray-200/70 text-gray-500'
        }`}
      >
        {count}
      </span>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-none bg-gradient-to-br from-slate-800 to-slate-700 p-5 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/70 transition hover:text-white"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/90">
            <UserPlusIcon className="h-5 w-5" />
          </div>
          <h2 className="mt-2 text-lg font-bold">Clientes por reactivar</h2>
          <p className="text-sm text-white/80">
            No vuelven hace 20 días o más. Escríbeles para que agenden de nuevo.
          </p>
        </div>

        {!loading && list.length > 0 && (
          <div className="flex flex-none gap-1 border-b border-gray-100 bg-gray-50 p-2">
            <TabButton id="pending" label="Por escribir" count={pending.length} />
            <TabButton id="done" label="Escritos" count={done.length} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-gray-400">
              Buscando clientes…
            </p>
          ) : list.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-gray-600">
                No hay clientes por reactivar 🎉
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Nadie lleva 20 días o más sin volver.
              </p>
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-xs text-gray-400">
              {tab === 'pending'
                ? 'Ya les escribiste a todos. 🙌'
                : 'Aún no has escrito a nadie esta semana.'}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map((c) => {
                const contacted = isContacted(c);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {c.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <ClockIcon className="h-3.5 w-3.5" />
                        Hace {c.days} días · {c.visits}{' '}
                        {c.visits === 1 ? 'visita' : 'visitas'}
                      </p>
                      {contacted && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-green-600">
                          <CheckBadgeIcon className="h-3.5 w-3.5" />
                          {contactedLabel(contactedAtOf(c))}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => write(c)}
                      className={`inline-flex flex-none items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        contacted
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <WaIcon className="h-4 w-4" />
                      {contacted ? 'Reenviar' : 'Escribir'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
