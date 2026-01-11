'use client';

import { useRef, useState } from 'react';
import { XMarkIcon, PlusIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function ImageUploader({
  images,
  setImages,
  showImages,
  setShowImages,
}) {
  const inputRef = useRef(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

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

  // 🔄 Reordenar imágenes
  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    const items = [...images];
    const draggedItemContent = items[dragItem.current];
    items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, draggedItemContent);

    dragItem.current = null;
    dragOverItem.current = null;

    setImages(items);
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
            Arrastra las imágenes para cambiar el orden. La primera será la
            imagen principal.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            {images.map((img, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => (dragItem.current = index)}
                onDragEnter={() => (dragOverItem.current = index)}
                onDragEnd={handleSort}
                onDragOver={(e) => e.preventDefault()}
                className="relative group w-[70px] h-[80px] rounded-lg overflow-hidden border-2 bg-white border-gray-300 shadow-sm cursor-move"
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

                {index === 0 && (
                  <span className="absolute top-1 left-1 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                    Principal
                  </span>
                )}
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
