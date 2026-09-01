'use client';

import { useEffect, useState } from 'react';
import { CreditCardIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { getWompiConfig, updateWompiConfig } from '@/lib/api/routes/company';

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

// Cada negocio conecta SU cuenta Wompi: el dinero de sus ventas online cae en
// su propio banco. Los secretos se guardan enmascarados y solo se reenvían si
// el dueño escribe uno nuevo.
export default function WompiPaymentSettings() {
  const [cfg, setCfg] = useState(null);
  const [publicKey, setPublicKey] = useState('');
  const [integrity, setIntegrity] = useState('');
  const [events, setEvents] = useState('');
  const [priv, setPriv] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    try {
      const res = await getWompiConfig();
      const d = res?.data || {};
      setCfg(d);
      setPublicKey(d.wompiPublicKey || '');
      setEnabled(!!d.wompiEnabled);
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const dto = { wompiEnabled: enabled, wompiPublicKey: publicKey };
      // Solo se envían los secretos que el dueño escribió (los vacíos se
      // conservan tal cual estaban).
      if (integrity.trim()) dto.wompiIntegritySecret = integrity.trim();
      if (events.trim()) dto.wompiEventsSecret = events.trim();
      if (priv.trim()) dto.wompiPrivateKey = priv.trim();

      const res = await updateWompiConfig(dto);
      setCfg(res?.data || null);
      setIntegrity('');
      setEvents('');
      setPriv('');
      if (res?.data) setEnabled(!!res.data.wompiEnabled);
      flash('success', 'Pagos en línea guardados.');
    } catch (e) {
      flash('error', e?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (!cfg) return null;

  const secretPh = (has) => (has ? '•••••••• (guardado)' : 'pega el secreto');

  return (
    <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <CreditCardIcon className="h-5 w-5 text-orange-500" />
            Pagos en línea (Wompi)
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Conecta tu propia cuenta de Wompi. El dinero de tus ventas online cae
            directo a tu banco; Pegazo no lo toca.
          </p>
        </div>
        {cfg.wompiEnabled && (
          <span className="inline-flex flex-none items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            <CheckBadgeIcon className="h-4 w-4" />
            Conectada
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Llave pública (pub_...)
          </label>
          <input
            className={inputCls}
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder="pub_prod_xxx"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Secreto de integridad
            </label>
            <input
              type="password"
              className={inputCls}
              value={integrity}
              onChange={(e) => setIntegrity(e.target.value)}
              placeholder={secretPh(cfg.hasIntegrity)}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Secreto de eventos (webhook)
            </label>
            <input
              type="password"
              className={inputCls}
              value={events}
              onChange={(e) => setEvents(e.target.value)}
              placeholder={secretPh(cfg.hasEvents)}
              autoComplete="off"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Llave privada (opcional, para conciliar pagos)
          </label>
          <input
            type="password"
            className={inputCls}
            value={priv}
            onChange={(e) => setPriv(e.target.value)}
            placeholder={secretPh(cfg.hasPrivate)}
            autoComplete="off"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-orange-500"
          />
          Activar pagos en línea en mi tienda
        </label>

        <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
          El <b>webhook de eventos</b> en tu panel de Wompi debe apuntar a la URL
          que te da Pegazo (termina en <code>/wompi/webhook</code>). Consíguela
          con soporte si no la tienes.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button variant="primary" onClick={save} loading={saving}>
          Guardar pagos
        </Button>
        {msg && (
          <span
            className={`text-sm ${
              msg.type === 'error' ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
