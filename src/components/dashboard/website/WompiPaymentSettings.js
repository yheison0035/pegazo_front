'use client';

import { useEffect, useState } from 'react';
import {
  CreditCardIcon,
  CheckBadgeIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { getWompiConfig, updateWompiConfig } from '@/lib/api/routes/company';

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

// Campo de secreto con "ojito" para ver lo que se pega (y validar que quedó bien).
function SecretField({ label, value, onChange, placeholder, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-600">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={`${inputCls} pr-10`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          title={show ? 'Ocultar' : 'Ver'}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
        >
          {show ? (
            <EyeSlashIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

// Cada negocio conecta SU cuenta Wompi: el dinero de sus ventas online cae en
// su propio banco. Los secretos se guardan enmascarados y solo se reenvían si
// el dueño escribe uno nuevo.
export default function WompiPaymentSettings() {
  const [cfg, setCfg] = useState(null);
  const [publicKey, setPublicKey] = useState('');
  const [integrity, setIntegrity] = useState('');
  const [events, setEvents] = useState('');
  const [priv, setPriv] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    try {
      const res = await getWompiConfig();
      const d = res?.data || {};
      setCfg(d);
      setPublicKey(d.wompiPublicKey || '');
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
      const dto = { wompiPublicKey: publicKey };
      // Solo se envían los secretos que el dueño escribió (los vacíos se
      // conservan tal cual estaban). La conexión se activa automáticamente en el
      // backend cuando la cuenta Wompi queda completa.
      if (integrity.trim()) dto.wompiIntegritySecret = integrity.trim();
      if (events.trim()) dto.wompiEventsSecret = events.trim();
      if (priv.trim()) dto.wompiPrivateKey = priv.trim();

      const res = await updateWompiConfig(dto);
      setCfg(res?.data || null);
      setIntegrity('');
      setEvents('');
      setPriv('');
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
          <SecretField
            label="Secreto de integridad"
            value={integrity}
            onChange={(e) => setIntegrity(e.target.value)}
            placeholder={secretPh(cfg.hasIntegrity)}
            hint="Empieza con test_integrity_ (pruebas) o prod_integrity_ (real)."
          />
          <SecretField
            label="Secreto de eventos (webhook)"
            value={events}
            onChange={(e) => setEvents(e.target.value)}
            placeholder={secretPh(cfg.hasEvents)}
            hint="Empieza con test_events_ o prod_events_. ¡No lo confundas con integridad!"
          />
        </div>

        <SecretField
          label="Llave privada (opcional, para conciliar pagos)"
          value={priv}
          onChange={(e) => setPriv(e.target.value)}
          placeholder={secretPh(cfg.hasPrivate)}
          hint="Empieza con prv_test_ o prv_prod_."
        />

        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Tu tienda queda <b>conectada automáticamente</b> a pagos en línea en
          cuanto guardes la llave pública, el secreto de integridad y el secreto
          de eventos. Para mostrar u ocultar el método en el checkout usa
          <b> “Métodos de pago de la tienda”</b> arriba.
        </p>

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
