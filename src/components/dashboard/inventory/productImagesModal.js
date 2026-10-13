'use client';

import { useState } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import ImageUploader from './imageUploader';
import Button from '@/components/ui/Button';
import useProducts from '@/lib/api/hooks/useProducts';

// Modal para gestionar las imágenes de un producto DIRECTO desde la lista de
// inventario (sin entrar a "Editar producto"). Reutiliza la MISMA lógica del
// cargue (subir, cámara/estudio, arrastrar para ordenar, eliminar) y guarda al
// instante con uploadProductImages (PUT /inventory/:id/images).
export default function ProductImagesModal({ product, onClose, onSaved }) {
  const { uploadProductImages } = useProducts();
  const [images, setImages] = useState(product?.images || []);
  const [showImages, setShowImages] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!product) return null;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await uploadProductImages(product.id, images);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setError(e?.message || 'No se pudieron guardar las imágenes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-3 pt-[6vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-orange-600 to-[#111827] px-6 py-4 text-white">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">
              <PhotoIcon className="h-4 w-4" /> Imágenes del producto
            </p>
            <h2 className="truncate text-lg font-bold">{product.name}</h2>
          </div>
          <button onClick={onClose} className="flex-none">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <ImageUploader
            images={images}
            setImages={setImages}
            showImages={showImages}
            setShowImages={setShowImages}
          />
          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={save} loading={saving}>
            Guardar imágenes
          </Button>
        </div>
      </div>
    </div>
  );
}
