'use client';

import { useEffect, useState } from 'react';
import { getLocals } from '@/lib/api/routes/locals';
import { formatCOP } from '@/lib/api/utils/utils';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function ServiceLocalsField({ value = [], onChange }) {
  const [localsOptions, setLocalsOptions] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const res = await getLocals({ all: true });
      setLocalsOptions(res.data || []);
    };
    fetch();
  }, []);

  const handleChange = (index, key, val) => {
    const updated = [...value];
    updated[index][key] = val;
    onChange(updated);
  };

  const addRow = () => {
    onChange([...value, { localId: '', price: '' }]);
  };

  const removeRow = (index) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="col-span-full mt-6">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-gray-800">
          Precios por Local
        </label>

        <Button
          type="button"
          variant="add"
          size="sm"
          icon={PlusIcon}
          onClick={addRow}
        >
          Agregar
        </Button>
      </div>

      {value.length === 0 && (
        <p className="text-sm text-gray-400 text-center">
          No hay locales asignados
        </p>
      )}

      {value.map((row, index) => (
        <div
          key={index}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center bg-white border border-gray-100 rounded-xl p-3 shadow-sm"
        >
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Local</label>
            <select
              value={row.localId}
              onChange={(e) =>
                handleChange(index, 'localId', Number(e.target.value))
              }
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Seleccione un local</option>
              {localsOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Precio</label>

            <div className="flex gap-2">
              <input
                type="text"
                value={formatCOP(row.price || '')}
                onChange={(e) => handleChange(index, 'price', e.target.value)}
                placeholder="$ 0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />

              <button
                type="button"
                onClick={() => removeRow(index)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
