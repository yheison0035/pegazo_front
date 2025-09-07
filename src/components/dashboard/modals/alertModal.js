'use client';

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function AlertModal({ type = 'info', message, onClose, url }) {
  if (!message) return null;

  const icons = {
    success: <CheckCircleIcon className="w-12 h-12 text-green-500" />,
    error: <XCircleIcon className="w-12 h-12 text-red-500" />,
    warning: <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500" />,
    info: <InformationCircleIcon className="w-12 h-12 text-blue-500" />,
  };

  const titles = {
    success: 'Éxito',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-6 relative text-center animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="flex justify-center mb-4">{icons[type]}</div>

        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {titles[type]}
        </h3>

        <p className="text-gray-600">{message}</p>

        <div className="mt-6">
          <Link
            href={url}
            className="px-6 py-2 bg-orange-500 text-white font-medium rounded-lg shadow hover:bg-orange-600 transition cursor-pointer"
          >
            <span>Aceptar</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
