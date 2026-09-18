'use client';

import { useEffect, useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import {
  getPlatformAiStatus,
  generateProductContent,
} from '@/lib/api/routes/platformAi';

/**
 * Botón "Generar con IA": con el NOMBRE del producto arma descripción,
 * características y especificaciones y las carga en el formulario. Solo aparece
 * si el SUPER_PLATFORM_ADMIN activó y configuró la IA en la plataforma.
 * Diseño con gradiente animado (estilo IA).
 */
export default function AiGenerateButton({ formData, setFormData, onNotify }) {
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
    const name = (formData?.name || '').trim();
    if (!name) {
      onNotify?.({
        type: 'warning',
        message: 'Escribe primero el nombre del producto.',
      });
      return;
    }

    setLoading(true);
    try {
      const { data } = await generateProductContent({ name });

      const features = (data?.features || []).map((f) => ({
        title: f.title || '',
        visible: true,
      }));
      const specifications = (data?.specifications || []).map((s) => ({
        key: s.key || '',
        value: s.value || '',
        visible: true,
      }));

      setFormData((prev) => ({
        ...prev,
        description: data?.description || prev.description,
        features: features.length ? features : prev.features,
        specifications: specifications.length
          ? specifications
          : prev.specifications,
      }));

      onNotify?.({
        type: 'success',
        message: 'Contenido generado con IA. Revísalo y ajústalo si quieres.',
      });
    } catch (e) {
      onNotify?.({
        type: 'error',
        message: e?.message || 'No se pudo generar con IA.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={loading}
      className="ai-gen-btn inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60 cursor-pointer"
    >
      <SparklesIcon
        className={`h-5 w-5 ${loading ? 'animate-spin' : 'ai-spark'}`}
      />
      {loading ? 'Generando…' : 'Generar con IA'}

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
