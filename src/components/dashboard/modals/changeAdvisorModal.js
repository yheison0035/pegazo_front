'use client';

import { useState } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ChangeAdvisorModal({
  isOpen,
  onClose,
  onSave,
  currentAdvisor,
  advisors: initialAdvisors = [],
  loading: initialLoading = false,
}) {
  const [newAdvisor, setNewAdvisor] = useState('');
  const [loading, setLoading] = useState(initialLoading);

  const handleSave = async () => {
    if (!newAdvisor) return;
    setLoading(true);
    await onSave(newAdvisor);
    setLoading(false);
    setNewAdvisor('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 animate-fadeIn z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            Cambiar Asesor
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Asesor anterior
            </label>
            <div className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg border border-gray-300">
              {currentAdvisor}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Nuevo asesor
            </label>
            <select
              value={newAdvisor}
              onChange={(e) => setNewAdvisor(e.target.value)}
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">Seleccione un asesor</option>
              {initialAdvisors.map((advisor) => (
                <option key={advisor.id} value={advisor.id}>
                  {advisor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-6 gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
          >
            Volver
          </button>
          <button
            onClick={handleSave}
            disabled={!newAdvisor || loading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 cursor-pointer"
          >
            {loading ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <CheckCircleIcon className="w-5 h-5" />
            )}
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
