'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Squares2X2Icon,
  PencilSquareIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import RoleGuard from '@/auth/roleGuard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Button from '@/components/ui/Button';
import TableActionButton from '@/components/ui/TableActionButton';
import { MODULE_GROUPS } from '@/config/modules';
import {
  getBusinessTypes,
  updateBusinessType,
  createBusinessType,
} from '@/lib/api/routes/businessTypes';

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

function Editor({ item, onClose, onSaved }) {
  const isNew = !!item.__new;
  const [label, setLabel] = useState(item.label || '');
  const [typeKey, setTypeKey] = useState(item.type || '');
  const [active, setActive] = useState(item.active ?? true);
  const [mods, setMods] = useState(new Set(item.modules || []));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const toggle = (key) =>
    setMods((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const save = async () => {
    if (!label.trim()) {
      setErr('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      if (isNew) {
        await createBusinessType({
          label: label.trim(),
          type: typeKey.trim() || undefined,
          modules: [...mods],
        });
      } else {
        await updateBusinessType(item.type, {
          label: label.trim() || item.type,
          modules: [...mods],
          active,
        });
      }
      onSaved();
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-800">
          {isNew ? 'Nuevo tipo de negocio' : `Tipo de negocio: ${item.type}`}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {isNew
            ? 'Crea un tipo de negocio nuevo y marca los módulos que traerá por defecto.'
            : 'Ajusta el nombre visible y qué módulos ve por defecto este tipo de negocio. (El override por empresa sigue mandando sobre esto.)'}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Nombre visible
            </label>
            <input
              className={inputCls}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej: Ferretería"
            />
          </div>
          {isNew ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Clave (opcional)
              </label>
              <input
                className={inputCls}
                value={typeKey}
                onChange={(e) => setTypeKey(e.target.value)}
                placeholder="Se genera del nombre (FERRETERIA)"
              />
            </div>
          ) : (
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-orange-500"
              />
              Activo (usa esta configuración)
            </label>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {Object.entries(MODULE_GROUPS).map(([group, list]) => (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {group}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((m) => (
                  <label
                    key={m.key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={mods.has(m.key)}
                      onChange={() => toggle(m.key)}
                      className="h-4 w-4 cursor-pointer accent-orange-500"
                    />
                    <span className="text-gray-700">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={save}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PlatformBusinessTypes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBusinessTypes();
      setItems(res?.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <div className="relative w-full p-4">
        <LoadingOverlay show={loading} text="Cargando tipos de negocio..." />

        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="mb-1 flex items-center gap-2 text-2xl font-semibold">
              <Squares2X2Icon className="h-6 w-6 text-orange-500" />
              Tipos de negocio
            </h1>
            <p className="text-sm text-gray-500">
              Configura el nombre y los módulos que trae cada tipo de negocio, o
              crea uno nuevo. Los cambios aplican a todos los negocios de ese tipo
              (salvo que tengan módulos manuales por empresa).
            </p>
          </div>
          <Button variant="primary" onClick={() => setEditing({ __new: true })}>
            <PlusIcon className="mr-1 h-4 w-4" /> Nuevo tipo
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.type}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{it.label}</h3>
                  <p className="text-xs text-gray-400">{it.type}</p>
                </div>
                <TableActionButton
                  icon={PencilSquareIcon}
                  label="Editar"
                  variant="edit"
                  onClick={() => setEditing(it)}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    it.active
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {it.active ? 'Activo' : 'Inactivo'}
                </span>
                <span className="text-xs text-gray-500">
                  {it.modules?.length || 0} módulos
                </span>
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <Editor
            item={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              fetchData();
            }}
          />
        )}
      </div>
    </RoleGuard>
  );
}
