'use client';

import { formatDateTime } from '@/lib/api/utils/formatDateTime';

export default function CommentsHistory({ formData }) {
  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  const getColor = (index) => {
    const colors = [
      'bg-orange-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="mt-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Historial de comentarios
      </label>

      <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {formData?.comments?.length > 0 ? (
          formData.comments.map((c, index) => {
            const userName = c.createdBy?.name || 'Usuario desconocido';
            const dateFormatted = formatDateTime(c.createdAt);

            return (
              <div
                key={c.id || index}
                className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getColor(
                    index
                  )}`}
                >
                  {getInitial(userName)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">
                      {userName}
                    </p>
                    <span className="text-xs text-gray-400">
                      {dateFormatted}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                    {c.description}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 italic">
            No hay comentarios registrados.
          </p>
        )}
      </div>
    </div>
  );
}
