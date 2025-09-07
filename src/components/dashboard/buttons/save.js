'use client';

import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function BtnSave() {
  return (
    <button
      type="submit"
      className="inline-flex items-center gap-2 px-4 py-2 mr-2 border border-transparent bg-blue-600 text-white font-medium rounded-lg hover:bg-white hover:text-orange-600 hover:border-orange-600 transition-colors duration-200 cursor-pointer"
    >
      <CheckCircleIcon className="w-5 h-5" />
      Guardar
    </button>
  );
}
