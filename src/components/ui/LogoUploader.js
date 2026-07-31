'use client';

import { useRef, useState } from 'react';
import { uploadCompanyLogo } from '@/lib/api/routes/companies';

// Subidor de logo reutilizable (panel de empresa y registro). Sube a Cloudinary
// (companies/logos) vía el backend y devuelve la URL a través de onChange.
export default function LogoUploader({ value, onChange, label = 'Logo' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('La imagen no puede superar los 3 MB.');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadCompanyLogo(file);
      const url = res?.data?.url;
      if (!url) throw new Error('No se recibió la URL del logo.');
      onChange(url);
    } catch (err) {
      setError(err.message || 'No se pudo subir el logo.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col">
      <span className="mb-1 text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-[#0B0F19]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="logo"
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="px-1 text-center text-[10px] text-gray-400">
              Sin logo
            </span>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 disabled:opacity-50"
          >
            {uploading ? 'Subiendo...' : value ? 'Cambiar logo' : 'Subir logo'}
          </button>

          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="ml-2 text-sm text-gray-400 transition hover:text-red-600"
            >
              Quitar
            </button>
          )}

          <p className="mt-1 text-[11px] text-gray-400">
            PNG, JPG o WEBP. Máx. 3 MB.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {error && <p className="mt-1 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
