'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';

export default function BtnClean({ handleReset }) {
  return (
    <button
      type="button"
      onClick={handleReset}
      className="inline-flex items-center gap-2 px-4 py-2 mr-2 border border-transparent bg-gray-600 text-white font-medium rounded-lg hover:bg-white hover:text-orange-600 hover:border-orange-600 transition-colors duration-200 cursor-pointer"
    >
      <XMarkIcon className="w-5 h-5" />
      Limpiar
    </button>
  );
}
