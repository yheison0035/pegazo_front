'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import CommentsHistory from '@/components/dashboard/comments/CommentsHistory';

export default function ViewModal({ data, type, onClose }) {
  if (!data) return null;

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString('es-CO') : 'No disponible';

  const isDelivered = type === 'delivered';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full relative overflow-hidden ${
          type === 'variants' ? 'max-w-xl' : 'max-w-5xl'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-200 transition cursor-pointer"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        {type === 'variants' ? (
          <>
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="bg-gradient-to-r from-blue-900 to-gray-900 px-6 py-5 text-white">
                <h2 className="text-2xl font-bold">
                  {data.name || 'Detalles de Variantes'}
                </h2>
                <p className="text-sm opacity-80">
                  Información completa de las variantes
                </p>
              </div>

              <div className="p-6 space-y-3">
                {data.variants?.length > 0 ? (
                  data.variants.map((variant, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-3 items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 transition hover:bg-white hover:shadow-sm"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">
                          SKU
                        </p>
                        <p className="font-medium text-gray-800">
                          {variant.sku || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">
                          Color
                        </p>
                        <p className="font-medium text-gray-800">
                          {variant.color || '—'}
                        </p>
                      </div>
                      <div className="flex justify-end">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold
                $${
                  variant?.stock <= 3
                    ? 'bg-red-100 text-red-700'
                    : variant?.stock <= 6
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-green-100 text-green-700'
                }`}
                        >
                          Stock: {variant.stock ?? 0}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-gray-500">
                    No hay variantes disponibles.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="bg-gradient-to-r from-blue-900 to-gray-900 text-white px-6 py-5 rounded-t-2xl">
                <h2 className="text-2xl font-bold">
                  {isDelivered
                    ? 'Detalles de Cliente Entregado'
                    : `Detalles del ${type === 'user' ? 'Usuario' : 'Cliente'}`}
                </h2>
                <p className="text-sm opacity-80">
                  {isDelivered
                    ? 'Información final de la entrega'
                    : 'Información completa y estado'}
                </p>
              </div>

              <div
                className={`p-6 grid grid-cols-1 gap-8 ${
                  type === 'user' ? 'md:grid-cols-2' : 'md:grid-cols-3'
                }`}
              >
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-700">Nombre</p>
                    <p className="text-gray-500">{data.name}</p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-700">Correo</p>
                    <p className="text-gray-500">
                      {data.email || 'No disponible'}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-700">Teléfono</p>
                    <p className="text-gray-500">
                      {data.phone || 'No disponible'}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-700">Dirección</p>
                    <p className="text-gray-500">
                      {data.address || 'No disponible'}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-700">
                      Fecha de Nacimiento
                    </p>
                    <p className="text-gray-500">
                      {formatDate(data.birthdate) || 'No disponible'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-700">Ciudad</p>
                    <p className="text-gray-500">
                      {data.city || 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Departamento</p>
                    <p className="text-gray-500">
                      {data.department || 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Documento</p>
                    <p className="text-gray-500">
                      {data.document || 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Estado</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        data.state?.name === 'Sin Contactar' ||
                        data.status === 'INACTIVE'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {data?.state?.name || data?.status}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">
                      Fecha de Registro
                    </p>
                    <p className="text-gray-500">
                      {formatDate(data.createdAt) || 'No disponible'}
                    </p>
                  </div>
                </div>
                {type !== 'user' && (
                  <div className="space-y-3">
                    {isDelivered && (
                      <>
                        <div>
                          <p className="font-semibold text-gray-700">
                            Fecha de Entrega
                          </p>
                          <p className="text-gray-500">
                            {formatDate(data.deliveryDate)}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Placa</p>
                          <p className="text-gray-500">
                            {data.plateNumber || 'No aplica'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {type !== 'user' && (
                <div className="border-t p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Historial de comentarios
                  </h3>
                  <CommentsHistory formData={data} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
