'use client';

import { useEffect, useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import {
  getPlatformAiStatus,
  generateProductContent,
} from '@/lib/api/routes/platformAi';

/**
 * Botón "IA" reutilizable con gradiente animado. Genera contenido a partir del
 * NOMBRE del producto. Se usa por campo:
 *  - field="description" → una descripción
 *  - field="feature"      → UNA característica (pasar `existing` para no repetir)
 *  - field="specification"→ UNA especificación (idem)
 *  - field="all"          → todo
 * Devuelve el resultado por `onResult({ data, error })`. Solo aparece si el
 * SUPER_PLATFORM_ADMIN activó/configuró la IA en la plataforma.
 */
export default function AiGenerateButton({
  name,
  field = 'all',
  existing,
  onResult,
  label = 'Generar con IA',
  small = false,
}) {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    getPlatformAiStatus()
      .then((res) => alive && setAvailable(!!res?.data?.available))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!available) return null;

  const run = async () => {
    const n = (name || '').trim();
    if (!n) {
      onResult?.({ error: 'Escribe primero el nombre del producto.' });
      return;
    }
    setLoading(true);
    try {
      const { data } = await generateProductContent({ name: n, field, existing });
      onResult?.({ data });
    } catch (e) {
      onResult?.({ error: e?.message || 'No se pudo generar con IA.' });
    } finally {
      setLoading(false);
    }
  };

  const sizeCls = small ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const iconCls = small ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <button
      type="button"
      onClick={run}
      disabled={loading}
      className={`ai-gen-btn inline-flex items-center gap-2 rounded-lg font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60 cursor-pointer ${sizeCls}`}
    >
      <SparklesIcon
        className={`${iconCls} ${loading ? 'animate-spin' : 'ai-spark'}`}
      />
      {loading ? 'Generando…' : label}

      <style>{`
        @keyframes aiGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .ai-gen-btn {
          background-image: linear-gradient(90deg,#6366f1,#8b5cf6,#d946ef,#ec4899,#8b5cf6,#6366f1);
          background-size: 300% 100%;
          animation: aiGradient 4s ease infinite;
        }
        @keyframes aiSpark {
          0%,100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.18); opacity: .8; }
        }
        .ai-spark { animation: aiSpark 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ai-gen-btn { animation: none; }
          .ai-spark { animation: none; }
        }
      `}</style>
    </button>
  );
}
