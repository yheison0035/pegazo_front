'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  MegaphoneIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import RoleGuard from '@/auth/roleGuard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Button from '@/components/ui/Button';
import TableActionButton from '@/components/ui/TableActionButton';
import { BUSINESS_TYPES } from '@/config/businessTypes';
import { PLAN_OPTIONS } from '@/lib/plans';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/lib/api/routes/announcements';

const TYPE_KEYS = Object.keys(BUSINESS_TYPES);

const LEVELS = [
  { id: 'INFO', name: 'Información', chip: 'bg-blue-50 text-blue-600' },
  { id: 'SUCCESS', name: 'Novedad', chip: 'bg-emerald-50 text-emerald-600' },
  { id: 'WARNING', name: 'Aviso', chip: 'bg-amber-50 text-amber-600' },
  { id: 'CRITICAL', name: 'Urgente', chip: 'bg-red-50 text-red-600' },
];
const levelChip = (id) => LEVELS.find((l) => l.id === id)?.chip || LEVELS[0].chip;
const levelName = (id) => LEVELS.find((l) => l.id === id)?.name || id;

const AUDIENCES = [
  { id: 'ALL', name: 'Todos los negocios' },
  { id: 'TYPE', name: 'Por tipo de negocio' },
  { id: 'PLAN', name: 'Por plan' },
];

const EMPTY = {
  title: '',
  body: '',
  level: 'INFO',
  audience: 'ALL',
  types: [],
  plans: [],
  ctaLabel: '',
  ctaUrl: '',
  active: true,
  startsAt: '',
  endsAt: '',
};

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

function Chip({ label, on, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        on
          ? 'border-orange-300 bg-orange-50 text-orange-700'
          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

function Editor({ initial, onCancel, onSaved }) {
  const [f, setF] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleIn = (k, val) =>
    setF((p) => ({
      ...p,
      [k]: p[k].includes(val)
        ? p[k].filter((x) => x !== val)
        : [...p[k], val],
    }));

  const save = async () => {
    if (!f.title.trim() || !f.body.trim()) {
      setErr('El título y el mensaje son obligatorios.');
      return;
    }
    setSaving(true);
    setErr('');
    const payload = {
      title: f.title.trim(),
      body: f.body.trim(),
      level: f.level,
      audience: f.audience,
      types: f.audience === 'TYPE' ? f.types : [],
      plans: f.audience === 'PLAN' ? f.plans : [],
      ctaLabel: f.ctaLabel.trim() || undefined,
      ctaUrl: f.ctaUrl.trim() || undefined,
      active: f.active,
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : undefined,
      endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : undefined,
    };
    try {
      if (initial?.id) await updateAnnouncement(initial.id, payload);
      else await createAnnouncement(payload);
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
          {initial?.id ? 'Editar comunicado' : 'Nuevo comunicado'}
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Título
            </label>
            <input
              className={inputCls}
              value={f.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ej: Nueva función disponible"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Mensaje
            </label>
            <textarea
              className={inputCls}
              rows={3}
              value={f.body}
              onChange={(e) => set('body', e.target.value)}
              placeholder="Escribe el comunicado que verán los negocios…"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Nivel
              </label>
              <select
                className={inputCls}
                value={f.level}
                onChange={(e) => set('level', e.target.value)}
              >
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Dirigido a
              </label>
              <select
                className={inputCls}
                value={f.audience}
                onChange={(e) => set('audience', e.target.value)}
              >
                {AUDIENCES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {f.audience === 'TYPE' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Tipos de negocio
              </label>
              <div className="flex flex-wrap gap-2">
                {TYPE_KEYS.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    on={f.types.includes(t)}
                    onClick={() => toggleIn('types', t)}
                  />
                ))}
              </div>
            </div>
          )}

          {f.audience === 'PLAN' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Planes
              </label>
              <div className="flex flex-wrap gap-2">
                {PLAN_OPTIONS.map((p) => (
                  <Chip
                    key={p.id}
                    label={p.name}
                    on={f.plans.includes(p.id)}
                    onClick={() => toggleIn('plans', p.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Texto del botón (opcional)
              </label>
              <input
                className={inputCls}
                value={f.ctaLabel}
                onChange={(e) => set('ctaLabel', e.target.value)}
                placeholder="Ej: Ver más"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Enlace del botón (opcional)
              </label>
              <input
                className={inputCls}
                value={f.ctaUrl}
                onChange={(e) => set('ctaUrl', e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Desde (opcional)
              </label>
              <input
                type="date"
                className={inputCls}
                value={f.startsAt}
                onChange={(e) => set('startsAt', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Hasta (opcional)
              </label>
              <input
                type="date"
                className={inputCls}
                value={f.endsAt}
                onChange={(e) => set('endsAt', e.target.value)}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={f.active}
              onChange={(e) => set('active', e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-orange-500"
            />
            Activo (visible para los negocios)
          </label>
        </div>

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={save}>
            {initial?.id ? 'Guardar cambios' : 'Publicar comunicado'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PlatformAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // objeto o {} para nuevo

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAnnouncements();
      setItems(res?.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const remove = async (a) => {
    if (!confirm(`¿Eliminar el comunicado "${a.title}"?`)) return;
    await deleteAnnouncement(a.id);
    setItems((l) => l.filter((x) => x.id !== a.id));
  };

  const audienceLabel = (a) => {
    if (a.audience === 'TYPE') return `Tipos: ${a.types.join(', ') || '—'}`;
    if (a.audience === 'PLAN') return `Planes: ${a.plans.join(', ') || '—'}`;
    return 'Todos los negocios';
  };

  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <div className="relative w-full p-4">
        <LoadingOverlay show={loading} text="Cargando comunicados..." />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <MegaphoneIcon className="h-6 w-6 text-orange-500" />
              Comunicados
            </h1>
            <p className="text-sm text-gray-500">
              Mensajes de la plataforma hacia los negocios. Segmenta por tipo o
              plan para que cada quien vea solo lo suyo.
            </p>
          </div>
          <Button variant="primary" onClick={() => setEditing({})}>
            <PlusIcon className="mr-1 h-4 w-4" />
            Nuevo comunicado
          </Button>
        </div>

        {items.length === 0 && !loading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center text-gray-400">
            Aún no hay comunicados. Crea el primero.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {items.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${levelChip(
                          a.level,
                        )}`}
                      >
                        {levelName(a.level)}
                      </span>
                      {!a.active && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800">{a.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <TableActionButton
                      icon={PencilSquareIcon}
                      label="Editar"
                      variant="edit"
                      onClick={() => setEditing(a)}
                    />
                    <TableActionButton
                      icon={TrashIcon}
                      label="Eliminar"
                      variant="delete"
                      onClick={() => remove(a)}
                    />
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-gray-600">
                  {a.body}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                  <span>{audienceLabel(a)}</span>
                  {a.ctaLabel && a.ctaUrl && (
                    <span>
                      Botón: {a.ctaLabel} → {a.ctaUrl}
                    </span>
                  )}
                  {(a.startsAt || a.endsAt) && (
                    <span>
                      Vigencia:{' '}
                      {a.startsAt
                        ? new Date(a.startsAt).toLocaleDateString('es-CO')
                        : '…'}{' '}
                      –{' '}
                      {a.endsAt
                        ? new Date(a.endsAt).toLocaleDateString('es-CO')
                        : '…'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <Editor
            initial={
              editing.id
                ? {
                    ...editing,
                    startsAt: editing.startsAt
                      ? String(editing.startsAt).slice(0, 10)
                      : '',
                    endsAt: editing.endsAt
                      ? String(editing.endsAt).slice(0, 10)
                      : '',
                    ctaLabel: editing.ctaLabel || '',
                    ctaUrl: editing.ctaUrl || '',
                  }
                : {}
            }
            onCancel={() => setEditing(null)}
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
