'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import ImageLightbox from '@/components/ui/ImageLightbox';
import {
  getSupportThread,
  sendSupportMessage,
  getSupportUnread,
  uploadSupportImage,
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

// Chat de soporte del NEGOCIO con la plataforma. Burbuja flotante; sondea en
// tiempo real. No aplica a SUPER_PLATFORM_ADMIN (ese usa la bandeja de soporte).
export default function SupportWidget() {
  const { usuario } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [zoomSrc, setZoomSrc] = useState(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  const pickFile = (f) => {
    if (!f) return;
    if (!f.type?.startsWith('image/')) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };
  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const enabled =
    !!usuario?.id &&
    usuario?.role !== 'SUPER_PLATFORM_ADMIN' &&
    !!usuario?.company?.id;

  const pollUnread = useCallback(async () => {
    if (!enabled) return;
    try {
      const { data } = await getSupportUnread();
      setUnread(Number(data?.count) || 0);
    } catch {
      /* silencioso */
    }
  }, [enabled]);

  const loadThread = useCallback(async () => {
    if (!enabled) return;
    try {
      const { data } = await getSupportThread();
      setItems(Array.isArray(data) ? data : []);
      setUnread(0); // abrir el hilo marca leído en el backend
    } catch {
      /* silencioso */
    }
  }, [enabled]);

  // Contador cuando está cerrado.
  useEffect(() => {
    if (!enabled) return;
    pollUnread();
    const t = setInterval(pollUnread, 8000);
    return () => clearInterval(t);
  }, [enabled, pollUnread]);

  // Mensajes cuando está abierto (tiempo real).
  useEffect(() => {
    if (!open) return;
    loadThread();
    const t = setInterval(loadThread, 5000);
    return () => clearInterval(t);
  }, [open, loadThread]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items, open]);

  const send = async () => {
    const body = text.trim();
    if ((!body && !file) || sending) return;
    setSending(true);
    const localPreview = preview;
    // Optimista.
    setItems((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        fromPlatform: false,
        body,
        imageUrl: localPreview,
        senderName: usuario?.name,
        createdAt: new Date().toISOString(),
      },
    ]);
    setText('');
    clearFile();
    try {
      let imageUrl;
      if (file) {
        const { data } = await uploadSupportImage(file);
        imageUrl = data?.url;
      }
      await sendSupportMessage(body, imageUrl);
      await loadThread();
    } catch {
      /* deja el optimista */
    } finally {
      setSending(false);
    }
  };

  if (!enabled) return null;

  return (
    <>
      {/* Fondo oscurecido al abrir el chat */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[75] bg-black/40 backdrop-blur-[1px] transition-opacity"
        />
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-4 z-[80] flex h-[70vh] max-h-[560px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
            <div className="flex items-center gap-2 text-white">
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <div>
                <p className="text-sm font-bold leading-tight">Soporte Pegazo</p>
                <p className="text-[11px] text-white/85">
                  Escríbenos, te respondemos aquí mismo.
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 px-3 py-3">
            {items.length === 0 ? (
              <p className="mt-6 text-center text-sm text-gray-400">
                ¿Necesitas ayuda? Escríbenos tu mensaje y te respondemos.
              </p>
            ) : (
              items.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.fromPlatform ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.fromPlatform
                        ? 'rounded-bl-sm bg-white text-gray-800 shadow-sm'
                        : 'rounded-br-sm bg-orange-500 text-white'
                    }`}
                  >
                    {m.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setZoomSrc(m.imageUrl)}
                        className="mb-1 block w-full"
                      >
                        <img
                          src={m.imageUrl}
                          alt="adjunto"
                          className="max-h-48 w-full cursor-zoom-in rounded-lg object-cover"
                        />
                      </button>
                    )}
                    {m.body && (
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    )}
                    <p
                      className={`mt-1 text-[10px] ${
                        m.fromPlatform ? 'text-gray-400' : 'text-white/70'
                      }`}
                    >
                      {m.fromPlatform ? 'Soporte' : 'Tú'} · {hhmm(m.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-gray-100 p-2">
            {preview && (
              <div className="relative mb-2 inline-block">
                <img
                  src={preview}
                  alt="adjunto"
                  className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                />
                <button
                  onClick={clearFile}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              <button
                onClick={() => fileRef.current?.click()}
                title="Adjuntar imagen"
                className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-orange-500"
              >
                <PhotoIcon className="h-5 w-5" />
              </button>
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
                placeholder="Escribe tu mensaje…"
                className="max-h-28 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
              <button
                onClick={send}
                disabled={sending || (!text.trim() && !file)}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Burbuja */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Soporte"
        className="fixed bottom-5 right-4 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-xl transition hover:scale-105"
      >
        {open ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        )}
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {zoomSrc && (
        <ImageLightbox src={zoomSrc} onClose={() => setZoomSrc(null)} />
      )}
    </>
  );
}
