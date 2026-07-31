'use client';

import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function BtnSave({ module = 'save', disabled = false }) {
  return (
    <button
      type="submit"
      className={`inline-flex items-center gap-2 px-4 py-2 mr-2 border border-transparent ${
        module === 'sales'
          ? 'bg-green-600 hover:text-green-900 hover:border-green-900'
          : 'bg-orange-600 hover:text-orange-600 hover:border-orange-600'
      } text-white 
      hover:bg-white
        font-medium rounded-lg transition-colors 
        duration-200 cursor-pointer`}
      disabled={disabled}
    >
      <CheckCircleIcon className="w-5 h-5" />
      {module === 'sales' ? 'Vender' : 'Guardar'}
    </button>
  );
}
