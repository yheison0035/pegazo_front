'use client';

import { useCallback, useEffect, useState } from 'react';
import RoleGuard from '@/auth/roleGuard';
import { useToast } from '@/context/toastContext';
import { SparklesIcon } from '@heroicons/react/24/outline';
import {
  getPlatformAiSettings,
  updatePlatformAiSettings,
  generateProductContent,
} from '@/lib/api/routes/platformAi';

const DEFAULT_MODELS = {
  gemini: 'gemini-2.0-flash',
  openai: 'llama-3.3-70b-versatile',
};

function PlatformAiInner() {
  const toast = useToast();
  const [form, setForm] = useState({
    enabled: false,
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    baseUrl: '',
    apiKey: '', // solo se envía si el admin escribe una nueva
  });
  const [keyPreview, setKeyPreview] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // {ok, sample|message}

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getPlatformAiSettings();
      setForm((f) => ({
        ...f,
        enabled: !!data?.enabled,
        provider: data?.provider || 'gemini',
        model: data?.model || 'gemini-2.0-flash',
        baseUrl: data?.baseUrl || '',
        apiKey: '',
      }));
      setKeyPreview(data?.keyPreview || '');
      setHasKey(!!data?.hasKey);
    } catch (e) {
      toast.show({ type: 'error', message: e.message || 'Error al cargar' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onProvider = (e) => {
    const provider = e.target.value;
    setForm((f) => ({
      ...f,
      provider,
      model: DEFAULT_MODELS[provider] || f.model,
    }));
  };

  // Guarda lo que esté en pantalla (sin toast). Devuelve la config actualizada.
  const persist = async () => {
    const dto = {
      enabled: form.enabled,
      provider: form.provider,
      model: form.model,
      baseUrl: form.baseUrl,
    };
    // La key solo se manda si escribió una nueva (no pisar la guardada).
    if (form.apiKey && form.apiKey.trim()) dto.apiKey = form.apiKey.trim();

    const { data } = await updatePlatformAiSettings(dto);
    setKeyPreview(data?.keyPreview || '');
    setHasKey(!!data?.hasKey);
    setForm((f) => ({ ...f, apiKey: '' }));
    return data;
  };

  const save = async () => {
    setSaving(true);
    try {
      await persist();
      setTestResult(null);
      toast.show({ type: 'success', message: 'Configuración de IA guardada.' });
    } catch (e) {
      toast.show({ type: 'error', message: e.message || 'No se pudo guardar' });
    } finally {
      setSaving(false);
    }
  };

  // Prueba real: guarda lo de pantalla y pide a la IA generar un ejemplo.
  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await persist(); // asegura que la key/modelo/activar estén guardados
      const { data } = await generateProductContent({
        name: 'Audífonos Bluetooth de prueba',
      });
      const ok = !!(data?.description || (data?.features || []).length);
      setTestResult(
        ok
          ? { ok: true, sample: (data.description || '').replace(/<[^>]+>/g, '') }
          : { ok: false, message: 'La IA respondió vacío. Revisa el modelo.' },
      );
      if (ok) toast.show({ type: 'success', message: '¡IA conectada y funcionando!' });
    } catch (e) {
      setTestResult({ ok: false, message: e?.message || 'No se pudo conectar' });
      toast.show({ type: 'error', message: e?.message || 'No se pudo conectar' });
    } finally {
      setTesting(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400';
  const labelCls = 'mb-1 block text-xs font-semibold text-gray-600';
  const isOpenAi = form.provider === 'openai';

  return (
    <div className="mx-auto mt-6 max-w-2xl">
      <div className="mb-1 flex items-center gap-2">
        <SparklesIcon className="h-7 w-7 text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-800">
          Inteligencia Artificial
        </h1>
      </div>
      <p className="mb-6 text-sm text-gray-500">
        Configura el proveedor de IA que usa el botón “IA” del inventario para
        generar descripción, características y especificaciones a partir del
        nombre del producto. Puedes empezar <strong>gratis</strong> con Google
        Gemini (crea tu key en aistudio.google.com).
      </p>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Cargando…</div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* Estado de conexión */}
          {form.enabled && hasKey ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="font-semibold">IA conectada</span>
              <span className="text-green-600">
                · {form.provider === 'openai' ? 'OpenAI-compat' : 'Gemini'} ·{' '}
                {form.model} · key {keyPreview}
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="font-semibold">Aún sin conectar</span>
              <span className="text-amber-600">
                · activa la IA, pega la API key y guarda
              </span>
            </div>
          )}

          {/* Activar */}
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <span>
              <span className="block text-sm font-semibold text-gray-800">
                Activar generación con IA
              </span>
              <span className="block text-xs text-gray-500">
                Si está apagado, el botón “IA” no aparece en el inventario.
              </span>
            </span>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) =>
                setForm((f) => ({ ...f, enabled: e.target.checked }))
              }
              className="h-5 w-5 accent-orange-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Proveedor</label>
              <select value={form.provider} onChange={onProvider} className={inputCls}>
                <option value="gemini">Google Gemini (gratis)</option>
                <option value="openai">OpenAI-compatible (Groq / OpenRouter)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Modelo</label>
              <input
                value={form.model}
                onChange={set('model')}
                placeholder={DEFAULT_MODELS[form.provider]}
                className={inputCls}
              />
            </div>
          </div>

          {isOpenAi && (
            <div>
              <label className={labelCls}>
                Base URL (Groq: https://api.groq.com/openai/v1 · OpenRouter:
                https://openrouter.ai/api/v1)
              </label>
              <input
                value={form.baseUrl}
                onChange={set('baseUrl')}
                placeholder="https://api.groq.com/openai/v1"
                className={inputCls}
              />
            </div>
          )}

          <div>
            <label className={labelCls}>
              API Key {hasKey && (
                <span className="font-normal text-gray-400">
                  (guardada: {keyPreview} — déjala vacía para no cambiarla)
                </span>
              )}
            </label>
            <input
              type="password"
              value={form.apiKey}
              onChange={set('apiKey')}
              placeholder={hasKey ? '•••••••••• (sin cambios)' : 'Pega aquí tu API key'}
              autoComplete="off"
              className={inputCls}
            />
          </div>

          {testResult && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                testResult.ok
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {testResult.ok ? (
                <>
                  ✓ Conexión exitosa. Ejemplo generado:{' '}
                  <span className="text-green-800">
                    “{(testResult.sample || '').slice(0, 120)}…”
                  </span>
                </>
              ) : (
                <>✗ {testResult.message}</>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={testConnection}
              disabled={testing || (!hasKey && !form.apiKey.trim())}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              title={
                !hasKey && !form.apiKey.trim() ? 'Pega primero la API key' : ''
              }
            >
              {testing ? 'Probando…' : 'Probar conexión'}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlatformAiPage() {
  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <PlatformAiInner />
    </RoleGuard>
  );
}
