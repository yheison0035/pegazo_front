'use client';

import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import RichTextEditor from '@/components/dashboard/form/RichTextEditor';

// Botón para mostrar/ocultar el ítem en la tienda (píldora clara).
function VisibilityToggle({ visible, onToggle }) {
  const hidden = visible === false;
  return (
    <button
      type="button"
      onClick={onToggle}
      title={hidden ? 'Oculto en la tienda' : 'Visible en la tienda'}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
        hidden
          ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
      }`}
    >
      {hidden ? (
        <EyeSlashIcon className="h-4 w-4" />
      ) : (
        <EyeIcon className="h-4 w-4" />
      )}
      {hidden ? 'Oculto' : 'Visible'}
    </button>
  );
}

function ItemCard({ index, label, hidden, onToggle, onDelete, children }) {
  return (
    <div
      className={`rounded-xl border p-3 transition ${
        hidden
          ? 'border-gray-200 bg-gray-50 opacity-70'
          : 'border-gray-200 bg-white shadow-sm'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-[11px] font-bold text-orange-600">
            {index + 1}
          </span>
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <VisibilityToggle visible={hidden ? false : true} onToggle={onToggle} />
          <button
            type="button"
            onClick={onDelete}
            title="Eliminar"
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ color, title, subtitle, count }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className={`h-6 w-1.5 rounded-full ${color}`} />
      <div className="flex-1">
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
        {count}
      </span>
    </div>
  );
}

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

  // Bloquea el scroll del fondo mientras el modal está abierto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const saveData = () => {
    setFormData({ ...formData, features, specifications: specs });
    onClose();
  };

  const toggleFeature = (idx) => {
    const copy = [...features];
    copy[idx].visible = copy[idx].visible === false;
    setFeatures(copy);
  };
  const toggleSpec = (idx) => {
    const copy = [...specs];
    copy[idx].visible = copy[idx].visible === false;
    setSpecs(copy);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Cabecera */}
          <div className="relative shrink-0 bg-gradient-to-r from-orange-600 to-[#111827] px-6 py-5 text-white">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold sm:text-2xl">
              Características y especificaciones
            </h2>
            <p className="text-sm opacity-80">
              Se muestran en la página del producto. Puedes dar formato (negrita,
              listas, enlaces) y ocultar las que no quieras publicar.
            </p>
          </div>

          {/* Cuerpo con scroll */}
          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto bg-gray-50/60 p-6">
            {/* Características */}
            <section>
              <SectionHeader
                color="bg-orange-500"
                title="Características"
                subtitle="Puntos destacados del producto"
                count={features.length}
              />

              <div className="space-y-3">
                {features.length === 0 && (
                  <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-400">
                    Aún no hay características. Agrega la primera abajo.
                  </p>
                )}

                {features.map((f, idx) => (
                  <ItemCard
                    key={idx}
                    index={idx}
                    label="Característica"
                    hidden={f.visible === false}
                    onToggle={() => toggleFeature(idx)}
                    onDelete={() =>
                      setFeatures(features.filter((_, i) => i !== idx))
                    }
                  >
                    <RichTextEditor
                      value={f.title}
                      onChange={(html) => {
                        const copy = [...features];
                        copy[idx].title = html;
                        setFeatures(copy);
                      }}
                      placeholder="Ej: Material impermeable de alta resistencia"
                      minHeight={70}
                    />
                  </ItemCard>
                ))}
              </div>

              <Button
                variant="add"
                icon={PlusIcon}
                className="mt-3"
                onClick={() =>
                  setFeatures([...features, { title: '', visible: true }])
                }
              >
                Agregar característica
              </Button>
            </section>

            {/* Especificaciones */}
            <section>
              <SectionHeader
                color="bg-gray-800"
                title="Especificaciones técnicas"
                subtitle="Datos en formato clave / valor"
                count={specs.length}
              />

              <div className="space-y-3">
                {specs.length === 0 && (
                  <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-400">
                    Aún no hay especificaciones. Agrega la primera abajo.
                  </p>
                )}

                {specs.map((s, idx) => (
                  <ItemCard
                    key={idx}
                    index={idx}
                    label="Especificación"
                    hidden={s.visible === false}
                    onToggle={() => toggleSpec(idx)}
                    onDelete={() => setSpecs(specs.filter((_, i) => i !== idx))}
                  >
                    <div className="space-y-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                          Clave
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Peso"
                          value={s.key}
                          onChange={(e) => {
                            const copy = [...specs];
                            copy[idx].key = e.target.value;
                            setSpecs(copy);
                          }}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                          Valor
                        </label>
                        <RichTextEditor
                          value={s.value}
                          onChange={(html) => {
                            const copy = [...specs];
                            copy[idx].value = html;
                            setSpecs(copy);
                          }}
                          placeholder="Ej: 1.2 kg"
                          minHeight={60}
                        />
                      </div>
                    </div>
                  </ItemCard>
                ))}
              </div>

              <Button
                variant="add"
                icon={PlusIcon}
                className="mt-3"
                onClick={() =>
                  setSpecs([...specs, { key: '', value: '', visible: true }])
                }
              >
                Agregar especificación
              </Button>
            </section>
          </div>

          {/* Pie */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-white p-4">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" icon={CheckCircleIcon} onClick={saveData}>
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
