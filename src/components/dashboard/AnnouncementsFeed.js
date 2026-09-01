'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import { getMyAnnouncements } from '@/lib/api/routes/announcements';

const STORE_KEY = 'dismissed_announcements';

const STYLES = {
  INFO: 'border-blue-200 bg-blue-50 text-blue-900',
  SUCCESS: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  WARNING: 'border-amber-200 bg-amber-50 text-amber-900',
  CRITICAL: 'border-red-200 bg-red-50 text-red-900',
};

function readDismissed() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
  } catch {
    return [];
  }
}

// Comunicados de la plataforma para este negocio. Se descartan por-usuario
// (localStorage); no vuelven a aparecer salvo que se limpie el navegador.
export default function AnnouncementsFeed() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    getMyAnnouncements()
      .then((res) => {
        if (!alive) return;
        const dismissed = readDismissed();
        setItems((res?.data || []).filter((a) => !dismissed.includes(a.id)));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const dismiss = (id) => {
    try {
      const next = [...readDismissed(), id];
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
    setItems((l) => l.filter((a) => a.id !== id));
  };

  if (items.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-2">
      {items.map((a) => (
        <div
          key={a.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
            STYLES[a.level] || STYLES.INFO
          }`}
        >
          <MegaphoneIcon className="mt-0.5 h-5 w-5 flex-none opacity-70" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{a.title}</p>
            <p className="mt-0.5 whitespace-pre-line text-sm opacity-90">
              {a.body}
            </p>
            {a.ctaLabel && a.ctaUrl && (
              <a
                href={a.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block rounded-lg bg-black/80 px-3 py-1 text-xs font-semibold text-white hover:bg-black"
              >
                {a.ctaLabel}
              </a>
            )}
          </div>
          <button
            onClick={() => dismiss(a.id)}
            className="flex-none rounded-lg p-1 opacity-60 hover:bg-black/5 hover:opacity-100"
            aria-label="Descartar"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
