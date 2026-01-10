'use client';

import { useRef } from 'react';
import { XMarkIcon, PlusIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function ImageUploader({
  images,
  setImages,
  showImages,
  setShowImages,
}) {
  const inputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setShowImages(!showImages)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
      >
        <PhotoIcon className="w-5 h-5" />
        ¿Deseas agregar imágenes?
      </button>

      {(showImages || images.length > 0) && (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-4 bg-gray-50">
          <p className="text-sm text-gray-500 mb-3">
            Puedes subir una o varias imágenes del producto. La primera será la
            imagen principal.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            {images.map((img, index) => (
              <div
                key={index}
                className="relative group w-[70px] h-[80px] rounded-lg overflow-hidden border-2 bg-white border-gray-300 shadow-sm"
              >
                <img
                  src={img.url}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  <XMarkIcon className="w-5 h-5 text-white" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-[70px] h-[80px] flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="text-[10px] mt-1">Agregar</span>
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
}
