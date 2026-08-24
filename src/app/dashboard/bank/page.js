'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BanknotesIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import Button from '@/components/ui/Button';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useAuth } from '@/context/authContext';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';
import {
  getBankStatus,
  enableBank,
  disableBank,
  regenerateBankToken,
  getBankDeposits,
} from '@/lib/api/routes/bank';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function BankPage() {
  const { usuario } = useAuth();
  const isOwner = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);

  const [status, setStatus] = useState(null); // {enabled, token}
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});

  const webhook = status?.token ? `${API}/bank/sms/${status.token}` : '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dep, st] = await Promise.all([
        getBankDeposits({ limit: 100 }),
        isOwner ? getBankStatus() : Promise.resolve(null),
      ]);
      setDeposits(dep?.data || []);
      if (st) setStatus(st.data);
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'Error al cargar' });
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000); // refresca el historial
    return () => clearInterval(t);
  }, [load]);

  const toggle = async () => {
    setBusy(true);
    try {
      const res = status?.enabled ? await disableBank() : await enableBank();
      setStatus((s) => ({ ...(s || {}), ...res.data }));
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo cambiar' });
    } finally {
      setBusy(false);
    }
  };

  const regen = async () => {
    if (!confirm('¿Generar un enlace nuevo? El anterior dejará de funcionar.'))
      return;
    setBusy(true);
    try {
      const res = await regenerateBankToken();
      setStatus((s) => ({ ...(s || {}), ...res.data }));
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const copy = () => {
    navigator.clipboard?.writeText(webhook);
    setAlert({ type: 'success', message: 'Enlace copiado.' });
  };

  // Envía una consignación de PRUEBA al webhook (como lo haría el celular), para
  // comprobar la voz y la notificación.
  const test = async () => {
    if (!webhook) return;
    setBusy(true);
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Bancolombia le informa Recepcion de transferencia por $50.000 de JUAN DE PRUEBA en su cuenta *1234',
        }),
      });
      setAlert({
        type: 'success',
        message: 'Consignación de prueba enviada. En unos segundos deberías oír la voz y ver la notificación.',
      });
    } catch (e) {
      setAlert({ type: 'error', message: 'No se pudo enviar la prueba.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4 max-w-4xl mx-auto">
        <div className="mb-1 flex items-center gap-2">
          <BanknotesIcon className="h-7 w-7 text-orange-500" />
          <h1 className="text-2xl font-semibold text-gray-800">
            Consignaciones (banco)
          </h1>
        </div>
        <p className="mb-5 text-sm text-gray-500">
          Cuando entra una transferencia a tu cuenta, Pegazo lo anuncia con voz y
          notificación en tiempo real, con el valor y el nombre de quien consignó.
        </p>

        {/* Configuración (solo dueño/admin) */}
        {isOwner && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-800">
                  Aviso de consignaciones
                </h2>
                <p className="text-sm text-gray-500">
                  {status?.enabled
                    ? 'Activo: las consignaciones se anuncian solas.'
                    : 'Desactivado. Actívalo para recibir los avisos.'}
                </p>
              </div>
              <Button
                variant={status?.enabled ? 'danger-soft' : 'primary'}
                onClick={toggle}
                loading={busy}
              >
                {status?.enabled ? 'Desactivar' : 'Activar'}
              </Button>
            </div>

            {status?.enabled && webhook && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                    Enlace para el reenviador de SMS
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      readOnly
                      value={webhook}
                      className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700"
                    />
                    <button
                      onClick={copy}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" /> Copiar
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900/80 space-y-1.5">
                  <p className="font-semibold text-blue-900">
                    Cómo conectarlo (una sola vez):
                  </p>
                  <p>
                    1. En un celular Android (puede ser uno dedicado) instala una
                    app gratis de automatización, ej. <b>MacroDroid</b>.
                  </p>
                  <p>
                    2. Crea una macro: <b>Disparador</b> = SMS recibido de
                    “Bancolombia”. <b>Acción</b> = Petición HTTP <b>POST</b> a la
                    URL de arriba, con cuerpo JSON{' '}
                    <code>{'{ "text": "[sms_message]" }'}</code>.
                  </p>
                  <p>
                    3. Listo: cada SMS de consignación llegará a Pegazo y sonará
                    la voz aquí.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    icon={SpeakerWaveIcon}
                    onClick={test}
                    loading={busy}
                  >
                    Enviar consignación de prueba
                  </Button>
                  <Button
                    variant="secondary"
                    icon={ArrowPathIcon}
                    onClick={regen}
                    disabled={busy}
                  >
                    Generar enlace nuevo
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Historial */}
        <div className="relative rounded-2xl border border-gray-100 bg-white shadow-sm">
          <LoadingOverlay show={loading} text="Cargando..." />
          <div className="border-b border-gray-50 px-5 py-3">
            <h2 className="font-semibold text-gray-800">Últimas consignaciones</h2>
          </div>
          {deposits.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">
              Aún no hay consignaciones registradas.
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {deposits.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">
                      {formatCOP(d.amount)}
                      {d.senderName && (
                        <span className="font-normal text-gray-500">
                          {' '}
                          · {d.senderName}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[11px] text-gray-400">
                      {formatDateTime(d.createdAt)}
                      {d.reference ? ` · ${d.reference}` : ''}
                    </p>
                  </div>
                  {d.seen && (
                    <CheckCircleIcon className="h-5 w-5 flex-none text-emerald-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({})}
        />
      </div>
    </RoleGuard>
  );
}
