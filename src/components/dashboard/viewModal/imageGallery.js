'use client';
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ImageGallery({ images = [] }) {
  const [activeImage, setActiveImage] = useState(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="border-t p-6 border-gray-200 mt-2">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Imágenes del Producto
        </h3>

        <div className="flex gap-3 overflow-x-auto">
          {images
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map((img) => (
              <div
                key={img.id}
                className="min-w-[90px] h-[100px] rounded-lg overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition"
                onClick={() => setActiveImage(img.url)}
              >
                <img
                  src={img.url}
                  alt="Imagen producto"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
        </div>
      </div>

      {activeImage && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full p-4">
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <div className="flex justify-center">
              <img
                src={activeImage}
                alt="Vista ampliada"
                className="max-h-[80vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
