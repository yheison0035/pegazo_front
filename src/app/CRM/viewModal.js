'use client';

import CommentsHistory from '@/components/dashboard/comments/history';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ViewModal({ data, type, onClose }) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div
        className={`bg-white rounded-xl shadow-lg p-6 relative ${
          type === 'customer' ? 'w-full max-w-4xl' : ''
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Detalles del {type === 'advisor' ? 'Asesor' : 'Cliente'}
          </h2>
          <p className="text-sm text-gray-500">Información completa</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 text-gray-700">
            <div>
              <p className="font-semibold">Nombre:</p>
              <p>{data.name}</p>
            </div>
            <div>
              <p className="font-semibold">Correo:</p>
              <p>{data.email}</p>
            </div>
            <div>
              <p className="font-semibold">Teléfono:</p>
              <p>{data.phone}</p>
            </div>
            <div>
              <p className="font-semibold">Dirección:</p>
              <p>{data.address || 'No disponible'}</p>
            </div>
            <div>
              <p className="font-semibold">Ciudad:</p>
              <p>{data.city || 'No disponible'}</p>
            </div>
            <div>
              <p className="font-semibold">Documento:</p>
              <p>{data.document || 'No disponible'}</p>
            </div>
            <div>
              <p className="font-semibold">Estado</p>
              <p>{data.state || 'No disponible'}</p>
            </div>
          </div>
          {type === 'customer' && (
            <div className="h-full">
              <CommentsHistory customer={data} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
