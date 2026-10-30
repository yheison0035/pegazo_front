'use client';

import { useEffect, useRef, useState } from 'react';
import { TrashIcon, CameraIcon } from '@heroicons/react/24/outline';
import { formatImageFile } from '@/lib/imaging/formatImage';
import { uploadImage as defaultUpload } from '@/lib/api/routes/media';

// Subidor de FOTO reutilizable con vista previa inmediata y optimización
// (redimensiona + WebP) antes de subir. Sirve para la foto de usuario y
// cualquier avatar. `value` es la URL guardada; `onChange(url|'')` la publica.
// `upload` permite inyectar otra subida (por defecto, imagen genérica).
export default function AvatarUploader({
  value,
  onChange,
  label = 'Foto',
  hint = 'JPG, PNG o WEBP. Se optimiza sola.',
  preset = 'avatar',
  shape = 'circle',
  upload = defaultUpload,
  size = 'h-24 w-24',
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(value || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const localUrl = useRef('');

  // Sincroniza la vista previa con el valor externo (salvo mientras subimos una
  // local). Libera el objectURL anterior para no fugar memoria.
  useEffect(() => {
    if (!busy) setPreview(value || '');
  }, [value, busy]);

  useEffect(() => () => {
    if (localUrl.current) URL.revokeObjectURL(localUrl.current);
  }, []);

  const rounded = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    setError('');
    if (!file.type?.startsWith('image/')) {
      setError('El archivo debe ser una imagen.');
      return;
    }
    // Vista previa inmediata para que sepa cuál cargó.
    if (localUrl.current) URL.revokeObjectURL(localUrl.current);
    localUrl.current = URL.createObjectURL(file);
    setPreview(localUrl.current);
    setBusy(true);
    try {
      const optimized = await formatImageFile(file, preset);
      const res = await upload(optimized);
      const url = res?.data?.url || res?.url;
      if (!url) throw new Error('No se recibió la URL de la imagen.');
      onChange(url);
      setPreview(url);
    } catch (err) {
      setError(err?.message || 'No se pudo subir la imagen.');
      setPreview(value || '');
    } finally {
      setBusy(false);
      if (localUrl.current) {
        URL.revokeObjectURL(localUrl.current);
        localUrl.current = '';
      }
    }
  };

  const remove = () => {
    setError('');
    setPreview('');
    onChange('');
  };

  return (
    <div className="flex flex-col">
      {label && <span className="mb-1 text-sm font-medium text-gray-700">{label}</span>}
      <div className="flex items-center gap-4">
        <div className={`relative ${size} flex-none`}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`group block h-full w-full overflow-hidden border border-dashed border-gray-300 bg-gray-50 ${rounded}`}
            aria-label={preview ? 'Cambiar foto' : 'Subir foto'}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Foto" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full flex-col items-center justify-center text-gray-400">
                <CameraIcon className="h-6 w-6" />
                <span className="mt-1 text-[10px]">Foto</span>
              </span>
            )}
            <span className={`absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 ${rounded}`}>
              {busy ? 'Subiendo…' : 'Cambiar'}
            </span>
          </button>
          {preview && !busy && (
            <button
              type="button"
              onClick={remove}
              aria-label="Quitar foto"
              className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-red-500 shadow hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-gray-400">{hint}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={pick}
        className="hidden"
      />
      {error && <p className="mt-1 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
