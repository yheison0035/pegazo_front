'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CodeBracketIcon,
  PlusIcon,
  KeyIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { formatCOP } from '@/lib/api/utils/utils';
import {
  getFiscalConsumers,
  createFiscalConsumer,
  toggleFiscalConsumer,
  updateFiscalConsumerPlan,
  getFiscalConsumerKeys,
  createFiscalConsumerKey,
  revokeFiscalConsumerKey,
} from '@/lib/api/routes/fiscalConsumers';

const API_BASE =
  (process.env.NEXT_PUBLIC_FISCAL_API_URL ||
    'https://pegazo-fiscal-api-production.up.railway.app') + '/v1';

// Texto listo para enviar al cliente. `apiKey` es la key completa (solo al
// crearla) o un marcador como "<TU_API_KEY>" cuando ya existe (no se re-muestra).
function buildHandover(name, apiKey) {
  return `Pegazo · API de Facturación y Nómina Electrónica DIAN
Credenciales de acceso — ${name}

API Key: ${apiKey}
Base URL: ${API_BASE}

Autenticación: enviar en CADA petición el header
  Authorization: Bearer ${apiKey}

Endpoints principales:
- POST ${API_BASE}/invoices       → emitir factura electrónica
- POST ${API_BASE}/credit-notes   → nota crédito
- POST ${API_BASE}/debit-notes    → nota débito
- POST ${API_BASE}/payroll        → nómina electrónica
- GET  ${API_BASE}/documents      → consultar documentos emitidos

Importante: guarda esta API key en un lugar seguro, no se vuelve a mostrar.
Cada empresa (NIT) debe estar habilitada ante la DIAN con su certificado para que los documentos tengan validez fiscal.`;
}

function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1600);
        } catch {
          /* noop */
        }
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
    >
      {ok ? (
        <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <ClipboardDocumentIcon className="h-3.5 w-3.5" />
      )}
      {ok ? 'Copiado' : 'Copiar'}
    </button>
  );
}

const PERIODS = [
  { id: 'MENSUAL', label: 'Mensual' },
  { id: 'ANUAL', label: 'Anual' },
  { id: 'BOLSA', label: 'Bolsa (prepago)' },
];

// Sugerencias de PAQUETE + referencia de competencia POR MODALIDAD (para el pitch).
const SUGGEST = {
  MENSUAL: {
    docs: '100',
    price: '$ 9.000',
    note: 'paquete de 100 docs/mes ≈ $9.000. Competencia: GridPOS ~$9.900/mes (100 docs).',
  },
  ANUAL: {
    docs: '500',
    price: '$ 120.000',
    note: 'paquete de 500 docs/año ≈ $120.000. Competencia: MATIAS 500/año $196.000 · Facturo anual desde $125.000.',
  },
  BOLSA: {
    docs: '500',
    price: '$ 120.000',
    note: 'paquete prepago de 500 docs ≈ $120.000 (recarga al agotarse). Competencia: Facturo 50 folios $219.990.',
  },
};

const onlyDigits = (v) => Number(String(v ?? '').replace(/[^\d]/g, '')) || 0;

// Paquetes predefinidos (un clic). Editables antes de guardar.
const PACKAGES = [
  { label: 'Emprende', planName: 'Emprende (300/año)', period: 'ANUAL', docs: 300, price: 120000 },
  { label: 'Pro', planName: 'Pro (600/año)', period: 'ANUAL', docs: 600, price: 180000 },
  { label: 'Prepago 500', planName: 'Prepago 500', period: 'BOLSA', docs: 500, price: 150000 },
  { label: 'Volumen', planName: 'Volumen (1.000/mes)', period: 'MENSUAL', docs: 1000, price: 60000 },
];

// Editor del plan de cobro de un consumidor (como Factus/Siigo): documentos
// incluidos + precio EDITABLE + cobro por documento adicional. Muestra el
// consumo real y cuánto cobrar.
function PlanEditor({ platform, onSaved, setAlert }) {
  const [f, setF] = useState({
    planName: platform.planName || '',
    period: platform.period || 'MENSUAL',
    includedDocs: platform.includedDocs || '',
    price: platform.price || '',
    contactEmail: platform.contactEmail || '',
    contactPhone: platform.contactPhone || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await updateFiscalConsumerPlan(platform.id, {
        planName: f.planName,
        period: f.period,
        includedDocs: onlyDigits(f.includedDocs),
        price: onlyDigits(f.price),
        contactEmail: f.contactEmail.trim(),
        contactPhone: f.contactPhone.trim(),
      });
      await onSaved();
      setAlert({ type: 'success', message: 'Plan guardado.' });
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const inp =
    'w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-orange-400 focus:outline-none';
  const lbl = 'mb-1 block text-[11px] font-medium text-gray-500';
  const per = platform.period;
  const suf = per === 'BOLSA' ? '' : per === 'ANUAL' ? '/año' : '/mes';
  const sug = SUGGEST[f.period] || SUGGEST.MENSUAL; // sugerencia según modalidad elegida

  return (
    <div className="mb-4 rounded-xl border border-orange-100 bg-orange-50/40 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-gray-700">Paquete de facturación</p>
        <span className="text-xs text-gray-500">
          Consumo: <b className="text-gray-800">{platform.used ?? 0}</b>
          {' / '}
          {platform.includedDocs || 0} docs
          {' · precio '}
          <b className="text-emerald-600">{formatCOP(platform.cost || 0)}</b>
          {suf}
        </span>
      </div>

      {/* Paquetes predefinidos (un clic) */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-gray-400">Paquetes:</span>
        {PACKAGES.map((pk) => (
          <button
            key={pk.label}
            type="button"
            onClick={() =>
              setF((prev) => ({
                ...prev,
                planName: pk.planName,
                period: pk.period,
                includedDocs: pk.docs,
                price: pk.price,
              }))
            }
            className="rounded-full border border-gray-200 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 transition hover:border-orange-300 hover:bg-orange-50"
          >
            {pk.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={lbl}>Nombre del paquete</label>
          <input
            value={f.planName}
            onChange={(e) => set('planName', e.target.value)}
            placeholder="Paquete 500 / Plan mensual"
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>Modalidad</label>
          <select
            value={f.period}
            onChange={(e) => set('period', e.target.value)}
            className={inp}
          >
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>Documentos del paquete</label>
          <input
            type="number"
            min={0}
            value={f.includedDocs}
            onChange={(e) => set('includedDocs', e.target.value)}
            placeholder={sug.docs}
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>Precio del paquete (COP)</label>
          <MoneyInput
            value={f.price}
            onChange={(v) => set('price', v)}
            placeholder={sug.price}
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>Correo del cliente (avisos)</label>
          <input
            type="email"
            value={f.contactEmail}
            onChange={(e) => set('contactEmail', e.target.value)}
            placeholder="cliente@empresa.com"
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>WhatsApp del cliente (opcional)</label>
          <input
            value={f.contactPhone}
            onChange={(e) => set('contactPhone', e.target.value)}
            placeholder="573001112233"
            className={inp}
          />
        </div>
      </div>

      {/* Sugerencia de precio para tu pitch de ventas */}
      <p className="mt-2 rounded-lg bg-white/70 px-2.5 py-2 text-[11px] leading-relaxed text-gray-500">
        💡 <b>Sugerido ({PERIODS.find((x) => x.id === f.period)?.label}):</b>{' '}
        {sug.note} Ajusta el precio y ve siempre por debajo de la competencia.
      </p>

      <div className="mt-2 flex justify-end">
        <Button variant="primary" size="sm" loading={saving} onClick={save}>
          Guardar plan
        </Button>
      </div>
    </div>
  );
}

function Inner() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({});
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState(null); // { name, apiKey }
  const [open, setOpen] = useState(null); // platformId expandido
  const [keys, setKeys] = useState({}); // platformId -> keys[]
  const [keyLabel, setKeyLabel] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await getFiscalConsumers();
      setList(res?.data || []);
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo cargar.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await createFiscalConsumer(newName.trim());
      setNewKey({ name: res?.data?.name, apiKey: res?.data?.apiKey });
      setNewName('');
      await load();
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo crear.' });
    } finally {
      setCreating(false);
    }
  };

  const loadKeys = async (id) => {
    try {
      const res = await getFiscalConsumerKeys(id);
      setKeys((k) => ({ ...k, [id]: res?.data || [] }));
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudieron cargar las keys.' });
    }
  };

  const expand = (id) => {
    if (open === id) {
      setOpen(null);
      return;
    }
    setOpen(id);
    setKeyLabel('');
    if (!keys[id]) loadKeys(id);
  };

  const issueKey = async (id) => {
    try {
      const res = await createFiscalConsumerKey(id, keyLabel.trim() || 'default');
      setNewKey({ name: 'Nueva API key', apiKey: res?.data?.apiKey });
      setKeyLabel('');
      await loadKeys(id);
      await load();
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo emitir la key.' });
    }
  };

  const revoke = async (id, keyId) => {
    if (!confirm('¿Revocar esta API key? El consumidor dejará de poder usarla.'))
      return;
    try {
      await revokeFiscalConsumerKey(keyId);
      await loadKeys(id);
      await load();
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo revocar.' });
    }
  };

  const toggle = async (id, active) => {
    try {
      await toggleFiscalConsumer(id, active);
      await load();
    } catch (e) {
      setAlert({ type: 'error', message: e?.message || 'No se pudo cambiar.' });
    }
  };

  return (
    <div className="w-full max-w-4xl p-4">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-800 sm:text-2xl">
        <CodeBracketIcon className="h-6 w-6 text-orange-500" />
        API de Facturación DIAN
      </h1>
      <p className="mb-5 mt-1 text-sm text-gray-500">
        Facturación y nómina electrónica <b>como servicio</b>: cada plataforma o
        software externo que quiera consumir nuestro generador obtiene su propia
        API key.
      </p>

      {/* Cómo consumir */}
      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-gray-800">Cómo se consume</p>
        <div className="mt-3 space-y-2 text-sm text-gray-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Base URL
            </span>
            <code className="rounded-lg bg-gray-50 px-2 py-1 text-xs text-gray-800">
              {API_BASE}
            </code>
            <CopyBtn text={API_BASE} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Auth
            </span>
            <code className="rounded-lg bg-gray-50 px-2 py-1 text-xs text-gray-800">
              Authorization: Bearer &lt;API_KEY&gt;
            </code>
          </div>
          <p className="text-xs text-gray-500">
            Endpoints principales: <code>POST /invoices</code> (factura),{' '}
            <code>POST /credit-notes</code> · <code>/debit-notes</code>,{' '}
            <code>POST /payroll</code> (nómina), <code>GET /documents</code>.
            Cada consumidor registra sus empresas (NIT) y emite sus documentos.
          </p>
        </div>
      </div>

      {/* Crear consumidor */}
      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="mb-2 text-sm font-bold text-gray-800">
          Nuevo consumidor (plataforma)
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del consumidor (ej. ERP de Cliente X)"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
          <Button
            variant="primary"
            icon={PlusIcon}
            loading={creating}
            onClick={create}
          >
            Crear y generar API key
          </Button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Cargando…</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm text-gray-400">
          Aún no hay consumidores. Crea el primero arriba.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 p-4">
                <button
                  type="button"
                  onClick={() => expand(p.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  {open === p.id ? (
                    <ChevronDownIcon className="h-4 w-4 flex-none text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 flex-none text-gray-400" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-800">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {p.planName ? `${p.planName} · ` : ''}
                      {p.used ?? 0} doc{(p.used ?? 0) === 1 ? '' : 's'} ·{' '}
                      <span className="font-semibold text-emerald-600">
                        {formatCOP(p.cost || 0)}
                        {p.period === 'ANUAL'
                          ? '/año'
                          : p.period === 'BOLSA'
                            ? ''
                            : '/mes'}
                      </span>{' '}
                      · {p.apiKeys} key{p.apiKeys === 1 ? '' : 's'}
                    </p>
                  </div>
                </button>
                <label className="flex flex-none items-center gap-2 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={p.active}
                    onChange={(e) => toggle(p.id, e.target.checked)}
                    className="h-4 w-4 accent-orange-500"
                  />
                  {p.active ? 'Activo' : 'Inactivo'}
                </label>
              </div>

              {open === p.id && (
                <div className="border-t border-gray-100 p-4">
                  {/* Plan de cobro (documentos + precio editable) */}
                  <PlanEditor
                    platform={p}
                    onSaved={load}
                    setAlert={setAlert}
                  />

                  {/* Datos de conexión listos para enviar al cliente */}
                  <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-gray-700">
                        Datos de conexión (para el cliente)
                      </p>
                      <CopyBtn text={buildHandover(p.name, '<TU_API_KEY>')} />
                    </div>
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-gray-600">
{buildHandover(p.name, '<TU_API_KEY>')}
                    </pre>
                    <p className="mt-1 text-[11px] text-gray-400">
                      La API key completa solo se muestra al crearla. Si el
                      cliente la perdió, emite una nueva abajo.
                    </p>
                  </div>

                  <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={keyLabel}
                      onChange={(e) => setKeyLabel(e.target.value)}
                      placeholder="Etiqueta de la key (ej. producción)"
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                    />
                    <Button
                      variant="secondary"
                      icon={KeyIcon}
                      onClick={() => issueKey(p.id)}
                    >
                      Emitir API key
                    </Button>
                  </div>
                  {(keys[p.id] || []).length === 0 ? (
                    <p className="py-2 text-center text-xs text-gray-400">
                      Sin keys.
                    </p>
                  ) : (
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                        <tr className="border-b border-gray-100">
                          <th className="py-2 pr-3">Etiqueta</th>
                          <th className="py-2 pr-3">Prefijo</th>
                          <th className="py-2 pr-3">Último uso</th>
                          <th className="py-2 pr-3">Estado</th>
                          <th className="py-2 pr-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {keys[p.id].map((k) => (
                          <tr key={k.id} className="text-gray-700">
                            <td className="py-2 pr-3 font-medium">{k.label}</td>
                            <td className="py-2 pr-3">
                              <div className="flex items-center gap-1.5">
                                <code className="text-xs text-gray-500">
                                  {k.prefix}…
                                </code>
                                <CopyBtn text={k.prefix} />
                              </div>
                            </td>
                            <td className="py-2 pr-3 text-xs text-gray-400">
                              {k.lastUsedAt
                                ? new Date(k.lastUsedAt).toLocaleDateString(
                                    'es-CO',
                                  )
                                : 'Nunca'}
                            </td>
                            <td className="py-2 pr-3">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  k.active
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {k.active ? 'Activa' : 'Revocada'}
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-right">
                              {k.active && (
                                <button
                                  onClick={() => revoke(p.id, k.id)}
                                  title="Revocar"
                                  className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:text-red-600"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: API key recién creada (se muestra una sola vez) */}
      {newKey &&
        (() => {
          const handover = buildHandover(newKey.name, newKey.apiKey);
          return (
            <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 p-4">
              <div className="my-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-800">
                  API key de {newKey.name}
                </h2>
                <p className="mt-1 text-sm text-amber-600">
                  Cópiala ahora: <b>no se vuelve a mostrar</b>.
                </p>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-900 p-3">
                  <code className="flex-1 break-all text-xs text-emerald-300">
                    {newKey.apiKey}
                  </code>
                  <CopyBtn text={newKey.apiKey} />
                </div>

                {/* Listo para enviar al cliente */}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800">
                      Para enviar al cliente
                    </p>
                    <CopyBtn text={handover} />
                  </div>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 p-3 text-[11px] leading-relaxed text-gray-700">
{handover}
                  </pre>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Toca <b>Copiar</b> y pégalo directo en el correo/WhatsApp del
                    cliente.
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="primary" onClick={() => setNewKey(null)}>
                    Listo, ya la copié
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({})}
      />
    </div>
  );
}

export default function FiscalApiPage() {
  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <Inner />
    </RoleGuard>
  );
}
