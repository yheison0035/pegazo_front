'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import Button from '@/components/ui/Button';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import {
  getFactusConfig,
  saveFactusConfig,
  testFactusConnection,
  getFactusNumberingRanges,
} from '@/lib/api/routes/electronicInvoicing';

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

const input =
  'rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

export default function FacturacionElectronica() {
  const [cfg, setCfg] = useState(null);
  const [form, setForm] = useState({});
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFactusConfig();
      const d = res?.data || {};
      setCfg(d);
      setForm({
        enabled: d.enabled || false,
        environment: d.environment || 'SANDBOX',
        clientId: '',
        clientSecret: '',
        username: d.username || '',
        password: '',
        numberingRangeId: d.numberingRangeId || '',
        paymentMethodCode: d.paymentMethodCode || '10',
        legalOrganizationId: d.legalOrganizationId || '2',
        tributeId: d.tributeId || '21',
        municipalityId: d.municipalityId || '',
        unitMeasureId: d.unitMeasureId || '70',
      });
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo cargar.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      // Solo enviamos secretos si el usuario escribió algo nuevo.
      const dto = { ...form };
      if (!dto.clientId) delete dto.clientId;
      if (!dto.clientSecret) delete dto.clientSecret;
      if (!dto.password) delete dto.password;
      const res = await saveFactusConfig(dto);
      setCfg(res?.data || null);
      setForm((f) => ({ ...f, clientId: '', clientSecret: '', password: '' }));
      setAlert({ type: 'success', message: 'Configuración guardada.' });
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    try {
      await saveFactusConfig({
        ...(form.clientId ? { clientId: form.clientId } : {}),
        ...(form.clientSecret ? { clientSecret: form.clientSecret } : {}),
        ...(form.password ? { password: form.password } : {}),
        username: form.username,
        environment: form.environment,
      });
      const res = await testFactusConnection();
      setAlert({ type: 'success', message: res?.message || 'Conexión exitosa.' });
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'Falló la conexión.' });
    } finally {
      setBusy(false);
    }
  };

  const loadRanges = async () => {
    setBusy(true);
    try {
      const res = await getFactusNumberingRanges();
      setRanges(res?.data || []);
      if (!res?.data?.length) {
        setAlert({
          type: 'info',
          message: 'No se encontraron rangos de numeración en tu cuenta Factus.',
        });
      }
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudieron cargar.' });
    } finally {
      setBusy(false);
    }
  };

  const configured =
    cfg?.hasClientId && cfg?.hasClientSecret && cfg?.hasUsername && cfg?.hasPassword;

  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN]}>
      <div className="relative mx-auto w-full max-w-3xl p-4">
        <LoadingOverlay show={loading} text="Cargando..." />

        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">
            Facturación electrónica DIAN
          </h1>
          <p className="text-sm text-gray-500">
            Conecta tu cuenta de <b>Factus</b> (proveedor autorizado por la DIAN)
            para emitir facturas electrónicas válidas.
          </p>
        </div>

        {/* Estado */}
        <div
          className={`mb-5 flex items-center gap-2 rounded-2xl border p-3.5 text-sm ${
            configured && cfg?.enabled
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {configured && cfg?.enabled ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5" />
          )}
          {configured && cfg?.enabled
            ? `Activa · ambiente ${cfg?.environment === 'PRODUCTION' ? 'Producción' : 'Pruebas (Sandbox)'}${cfg?.testedAt ? ' · conexión verificada' : ''}`
            : 'Aún no está activa. Ingresa tus credenciales de Factus y prueba la conexión.'}
        </div>

        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {/* Activar + ambiente */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.enabled || false}
                onChange={(e) => set('enabled', e.target.checked)}
                className="h-4 w-4 accent-orange-500"
              />
              <span className="text-sm font-semibold text-gray-700">
                Activar facturación electrónica
              </span>
            </label>
            <Field label="Ambiente">
              <select
                value={form.environment || 'SANDBOX'}
                onChange={(e) => set('environment', e.target.value)}
                className={input}
              >
                <option value="SANDBOX">Pruebas (Sandbox)</option>
                <option value="PRODUCTION">Producción</option>
              </select>
            </Field>
          </div>

          {/* Credenciales */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Client ID"
              hint={cfg?.hasClientId ? 'Ya guardado — escribe para cambiarlo' : 'Del panel de Factus'}
            >
              <input
                className={input}
                value={form.clientId}
                onChange={(e) => set('clientId', e.target.value)}
                placeholder={cfg?.hasClientId ? '•••••••• (guardado)' : ''}
              />
            </Field>
            <Field
              label="Client Secret"
              hint={cfg?.hasClientSecret ? 'Ya guardado — escribe para cambiarlo' : 'Del panel de Factus'}
            >
              <input
                type="password"
                className={input}
                value={form.clientSecret}
                onChange={(e) => set('clientSecret', e.target.value)}
                placeholder={cfg?.hasClientSecret ? '•••••••• (guardado)' : ''}
              />
            </Field>
            <Field label="Usuario / Email">
              <input
                className={input}
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                placeholder="correo@empresa.com"
              />
            </Field>
            <Field
              label="Contraseña"
              hint={cfg?.hasPassword ? 'Ya guardada — escribe para cambiarla' : 'De tu cuenta Factus'}
            >
              <input
                type="password"
                className={input}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder={cfg?.hasPassword ? '•••••••• (guardada)' : ''}
              />
            </Field>
          </div>

          {/* Probar + rangos */}
          <div className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
            <Button variant="secondary" icon={BoltIcon} onClick={test} loading={busy}>
              Probar conexión
            </Button>
            <Button variant="secondary" onClick={loadRanges} loading={busy}>
              Cargar rangos de numeración
            </Button>
          </div>

          <Field
            label="Rango de numeración (Resolución DIAN)"
            hint="Elige el prefijo/rango autorizado que usará esta empresa."
          >
            <select
              value={form.numberingRangeId || ''}
              onChange={(e) => set('numberingRangeId', e.target.value)}
              className={input}
            >
              <option value="">— Selecciona —</option>
              {ranges.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.prefix ? `${r.prefix} · ` : ''}
                  {r.document || r.name || `Rango ${r.id}`}
                  {r.from && r.to ? ` (${r.from}-${r.to})` : ''}
                </option>
              ))}
              {/* Si ya había uno guardado y no se cargó la lista, lo mostramos */}
              {form.numberingRangeId &&
                !ranges.find((r) => String(r.id) === String(form.numberingRangeId)) && (
                  <option value={form.numberingRangeId}>
                    Rango {form.numberingRangeId} (guardado)
                  </option>
                )}
            </select>
          </Field>

          {/* Avanzado */}
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="text-sm font-semibold text-orange-600 hover:underline"
          >
            {showAdvanced ? 'Ocultar' : 'Mostrar'} opciones avanzadas
          </button>
          {showAdvanced && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Método de pago (código)" hint="10 = Contado, 30 = Crédito">
                <input className={input} value={form.paymentMethodCode} onChange={(e) => set('paymentMethodCode', e.target.value)} />
              </Field>
              <Field label="Organización jurídica" hint="1 = Persona jurídica, 2 = Natural">
                <select className={input} value={form.legalOrganizationId} onChange={(e) => set('legalOrganizationId', e.target.value)}>
                  <option value="2">Persona natural</option>
                  <option value="1">Persona jurídica</option>
                </select>
              </Field>
              <Field label="Tributo cliente (código)" hint="21 = No responsable de IVA, 18 = IVA">
                <input className={input} value={form.tributeId} onChange={(e) => set('tributeId', e.target.value)} />
              </Field>
              <Field label="Municipio (código Factus)" hint="Opcional. Código del municipio de tu empresa">
                <input className={input} value={form.municipalityId} onChange={(e) => set('municipalityId', e.target.value)} />
              </Field>
              <Field label="Unidad de medida (código)" hint="70 = Unidad">
                <input className={input} value={form.unitMeasureId} onChange={(e) => set('unitMeasureId', e.target.value)} />
              </Field>
            </div>
          )}

          <div className="flex justify-end border-t border-gray-100 pt-4">
            <Button variant="primary" onClick={save} loading={busy}>
              Guardar configuración
            </Button>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          Tus credenciales se guardan de forma privada por empresa y nunca se
          muestran a otros usuarios. Te recomendamos probar primero en{' '}
          <b>Sandbox</b> antes de pasar a Producción.
        </p>

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({})}
        />
      </div>
    </RoleGuard>
  );
}
