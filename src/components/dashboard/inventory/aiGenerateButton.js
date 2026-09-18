'use client';

import { useEffect, useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import {
  getPlatformAiStatus,
  generateProductContent,
} from '@/lib/api/routes/platformAi';

/**
 * Botón "Generar con IA": con el NOMBRE del producto arma descripción,
 * características y especificaciones y las carga en el formulario. Solo aparece
 * si el SUPER_PLATFORM_ADMIN activó y configuró la IA en la plataforma.
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
    <Button
      variant="primary"
      icon={SparklesIcon}
      type="button"
      onClick={run}
      loading={loading}
      disabled={loading}
    >
      {loading ? 'Generando…' : 'Generar con IA'}
    </Button>
  );
}
