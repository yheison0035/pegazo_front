'use client';

import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useState, useEffect } from 'react';

export default function InventorySpecsModal({
  open,
  onClose,
  formData,
  setFormData,
}) {
  const [features, setFeatures] = useState([]);
  const [specs, setSpecs] = useState([]);

  useEffect(() => {
    if (open) {
      setFeatures(formData.features || []);
      setSpecs(formData.specifications || []);
    }
  }, [open]);

  if (!open) return null;

  const saveData = () => {
    setFormData({
      ...formData,
      features,
      specifications: specs,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 cursor-pointer"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="bg-gradient-to-r from-orange-600 to-[#111827] text-white px-6 py-5 rounded-t-2xl">
          <h2 className="text-2xl font-bold">
            Características y especificaciones
          </h2>
          <p className="text-sm opacity-80">
            Información visible en la página del producto
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">Características</h3>

            {features.map((f, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <textarea
                  type="text"
                  placeholder="Ej: Material impermeable"
                  value={f.title}
                  onChange={(e) => {
                    const copy = [...features];
                    copy[idx].title = e.target.value;
                    setFeatures(copy);
                  }}
                  className="flex-1 border rounded-lg px-3 py-2"
                />

                <button
                  onClick={() =>
                    setFeatures(features.filter((_, i) => i !== idx))
                  }
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}

            <Button
              variant="add"
              icon={PlusIcon}
              className="mt-2"
              onClick={() => setFeatures([...features, { title: '' }])}
            >
              Agregar característica
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Especificaciones</h3>

            {specs.map((s, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Clave (Ej: Peso)"
                  value={s.key}
                  onChange={(e) => {
                    const copy = [...specs];
                    copy[idx].key = e.target.value;
                    setSpecs(copy);
                  }}
                  className="w-1/3 border rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Valor (Ej: 1.2 kg)"
                  value={s.value}
                  onChange={(e) => {
                    const copy = [...specs];
                    copy[idx].value = e.target.value;
                    setSpecs(copy);
                  }}
                  className="flex-1 border rounded-lg px-3 py-2"
                />

                <button
                  onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}

            <Button
              variant="add"
              icon={PlusIcon}
              className="mt-2"
              onClick={() => setSpecs([...specs, { key: '', value: '' }])}
            >
              Agregar especificación
            </Button>
          </div>
        </div>

        <div className="border-t p-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" icon={CheckCircleIcon} onClick={saveData}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
