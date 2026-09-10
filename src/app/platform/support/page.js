'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import RoleGuard from '@/auth/roleGuard';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import {
  getSupportThreads,
  getPlatformSupportThread,
  sendPlatformSupport,
} from '@/lib/api/routes/support';

function hhmm(d) {
  try {
    return new Date(d).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
function timeAgo(d) {
  if (!d) return '';
  const s = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return 'ahora';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function SupportInbox() {
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null); // companyId
  const [company, setCompany] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const loadThreads = useCallback(async () => {
    try {
      const { data } = await getSupportThreads();
      setThreads(Array.isArray(data) ? data : []);
    } catch {
      /* noop */
    }
  }, []);

  const loadThread = useCallback(async (companyId) => {
    if (!companyId) return;
    try {
      const { data } = await getPlatformSupportThread(companyId);
      setCompany(data?.company || null);
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    loadThreads();
    const t = setInterval(loadThreads, 8000);
    return () => clearInterval(t);
  }, [loadThreads]);

  useEffect(() => {
    if (!active) return;
    loadThread(active);
    const t = setInterval(() => loadThread(active), 5000);
    return () => clearInterval(t);
  }, [active, loadThread]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openThread = (companyId) => {
    setActive(companyId);
    // Al abrir, el backend marca leído → limpiamos el badge localmente.
    setThreads((prev) =>
      prev.map((t) => (t.companyId === companyId ? { ...t, unread: 0 } : t)),
    );
  };

  const send = async () => {
    const body = text.trim();
    if (!body || !active || sending) return;
    setSending(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        fromPlatform: true,
        body,
        createdAt: new Date().toISOString(),
      },
    ]);
    setText('');
    try {
      await sendPlatformSupport(active, body);
      await loadThread(active);
      loadThreads();
    } catch {
      /* noop */
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto mt-6 max-w-6xl">
      <div className="mb-4 flex items-center gap-2">
        <ChatBubbleLeftRightIcon className="h-7 w-7 text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-800">Soporte</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        {/* Lista de hilos */}
        <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          {threads.length === 0 ? (
            <p className="py-14 text-center text-sm text-gray-400">
              Aún no hay conversaciones.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {threads.map((t) => (
                <li key={t.companyId}>
                  <button
                    onClick={() => openThread(t.companyId)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
                      active === t.companyId ? 'bg-orange-50' : ''
                    }`}
                  >
                    <img
                      src={t.logo || '/images/no-image.png'}
                      alt=""
                      className="h-9 w-9 flex-none rounded-lg border border-gray-100 object-contain"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-gray-800">
                          {t.companyName}
                        </span>
                        <span className="flex-none text-[11px] text-gray-400">
                          {timeAgo(t.lastAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className="truncate text-xs text-gray-500">
                          {t.lastFromPlatform ? 'Tú: ' : ''}
                          {t.lastMessage}
                        </span>
                        {t.unread > 0 && (
                          <span className="flex-none rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                            {t.unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chat */}
        <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
              Elige una conversación para responder.
            </div>
          ) : (
            <>
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-bold text-gray-800">
                  {company?.name || 'Negocio'}
                </p>
                <p className="text-[11px] text-gray-400">
                  {company?.type || ''}
                </p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 px-4 py-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.fromPlatform ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                        m.fromPlatform
                          ? 'rounded-br-sm bg-orange-500 text-white'
                          : 'rounded-bl-sm bg-white text-gray-800 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          m.fromPlatform ? 'text-white/70' : 'text-gray-400'
                        }`}
                      >
                        {m.fromPlatform ? 'Soporte' : m.senderName || 'Cliente'} ·{' '}
                        {hhmm(m.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="flex items-end gap-2 border-t border-gray-100 p-2">
                <textarea
                  rows={1}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Responder…"
                  className="max-h-28 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <button
                  onClick={send}
                  disabled={sending || !text.trim()}
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlatformSupportPage() {
  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <SupportInbox />
    </RoleGuard>
  );
}
