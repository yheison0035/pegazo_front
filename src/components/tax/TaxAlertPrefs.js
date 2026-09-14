'use client';

import { useCallback, useEffect, useState } from 'react';
import { BellAlertIcon } from '@heroicons/react/24/outline';

// Interruptores de avisos de vencimientos tributarios (campana / correo).
// Reutilizable (empresa y contador) pasando load/save por props.
//   load()          -> { data: { taxAlertsEnabled, taxAlertEmail } }
//   save(patch)     -> guarda { taxAlertsEnabled?, taxAlertEmail? }

function Toggle({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition ${
        checked ? 'bg-orange-500' : 'bg-gray-300'
      } disabled:opacity-50`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function TaxAlertPrefs({ load, save, className = '' }) {
  const [prefs, setPrefs] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await load();
      setPrefs(res?.data || { taxAlertsEnabled: true, taxAlertEmail: false });
    } catch {
      setPrefs({ taxAlertsEnabled: true, taxAlertEmail: false });
    }
  }, [load]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const update = async (patch) => {
    setSaving(true);
    const prev = prefs;
    setPrefs({ ...prefs, ...patch }); // optimista
    try {
      const res = await save(patch);
      if (res?.data) setPrefs(res.data);
    } catch {
      setPrefs(prev); // revierte si falla
    } finally {
      setSaving(false);
    }
  };

  if (!prefs) return null;

  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <BellAlertIcon className="h-5 w-5 text-orange-500" />
        <h2 className="text-sm font-semibold text-gray-800">Avisos de vencimientos</h2>
      </div>
      <div className="space-y-3">
        <label className="flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-sm font-medium text-gray-700">
              Avisar en la campana
            </span>
            <span className="block text-xs text-gray-400">
              Te recordamos las obligaciones próximas o vencidas dentro del sistema.
            </span>
          </span>
          <Toggle
            checked={!!prefs.taxAlertsEnabled}
            disabled={saving}
            onChange={(v) => update({ taxAlertsEnabled: v })}
          />
        </label>
        <div className="h-px bg-gray-100" />
        <label className="flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-sm font-medium text-gray-700">
              También por correo
            </span>
            <span className="block text-xs text-gray-400">
              Envía el aviso al dueño y al contador. Apagado por defecto.
            </span>
          </span>
          <Toggle
            checked={!!prefs.taxAlertEmail}
            disabled={saving || !prefs.taxAlertsEnabled}
            onChange={(v) => update({ taxAlertEmail: v })}
          />
        </label>
      </div>
    </div>
  );
}
