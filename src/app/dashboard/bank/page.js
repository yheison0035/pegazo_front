'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BanknotesIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  TrashIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import Button from '@/components/ui/Button';
import AlertModal from '@/components/dashboard/modals/alertModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import BankSetupModal from '@/components/bank/BankSetupModal';
import { useAuth } from '@/context/authContext';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';
import { announceDeposit } from '@/lib/bankSound';
import {
  getBankStatus,
  enableBank,
  disableBank,
  regenerateBankToken,
  setBankConfig,
  getBankDeposits,
  deleteBankDeposit,
  clearBankDeposits,
} from '@/lib/api/routes/bank';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function BankPage() {
  const { usuario, setUsuario } = useAuth();
  const isOwner = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);

  // Refleja al instante el activar/desactivar en la sesión (y en localStorage),
  // así el aviso de voz empieza a funcionar sin tener que cerrar sesión.
  const syncSession = (enabled) => {
    if (!usuario || !setUsuario) return;
    const merged = {
      ...usuario,
      company: { ...(usuario.company || {}), bankNotifyEnabled: enabled },
    };
    setUsuario(merged);
    try {
      localStorage.setItem('usuario', JSON.stringify(merged));
    } catch {
      /* ignora */
    }
  };

  const [status, setStatus] = useState(null); // {enabled, token}
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});
  const [toDelete, setToDelete] = useState(null); // id de registro a borrar
  const [clearing, setClearing] = useState(false); // confirmación de borrar todo
  const [ident, setIdent] = useState(''); // identificador en el banco
  const [email, setEmail] = useState(''); // correo donde llegan las confirmaciones
  const [shareToken, setShareToken] = useState(''); // enlace compartido a usar
  const [showSetup, setShowSetup] = useState(false); // modal guía paso a paso

  const webhook = status?.token ? `${API}/bank/sms/${status.token}` : '';

  // Refresca SOLO el historial (esto sí corre en intervalo, no toca la config
  // que el dueño esté escribiendo).
  const loadDeposits = useCallback(async () => {
    try {
      const dep = await getBankDeposits({ limit: 100 });
      setDeposits(dep?.data || []);
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'Error al cargar' });
    }
  }, []);

  // Carga la configuración UNA sola vez (al entrar). No se re-consulta en
  // intervalo para no pisar lo que el dueño esté escribiendo.
  const loadStatus = useCallback(async () => {
    if (!isOwner) return;
    try {
      const st = await getBankStatus();
      if (st) {
        setStatus(st.data);
        setIdent(st.data?.identifier || '');
        setEmail(st.data?.email || '');
      }
    } catch {
      /* ignora: la config se puede reintentar recargando la página */
    }
  }, [isOwner]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadDeposits(), loadStatus()]);
      setLoading(false);
    })();
    const t = setInterval(loadDeposits, 15000); // solo el historial
    return () => clearInterval(t);
  }, [loadDeposits, loadStatus]);

  const toggle = async () => {
    setBusy(true);
    try {
      const res = status?.enabled ? await disableBank() : await enableBank();
      setStatus((s) => ({ ...(s || {}), ...res.data }));
      syncSession(!!res.data?.enabled);
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

  const saveConfig = async () => {
    setBusy(true);
    try {
      await setBankConfig({ identifier: ident, email });
      setAlert({ type: 'success', message: 'Configuración guardada.' });
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar' });
    } finally {
      setBusy(false);
    }
  };

  // Usar un enlace de otra empresa (compartir el mismo buzón).
  const useShared = async () => {
    const tk = shareToken.trim().replace(/.*\/bank\/sms\//, ''); // acepta URL o token
    if (!tk) return;
    setBusy(true);
    try {
      const res = await enableBank({ token: tk, identifier: ident });
      setStatus((s) => ({ ...(s || {}), ...res.data }));
      syncSession(true);
      setShareToken('');
      setAlert({ type: 'success', message: 'Enlace compartido aplicado.' });
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo aplicar' });
    } finally {
      setBusy(false);
    }
  };

  // Prueba SOLO la voz y la notificación (no crea ningún registro en el
  // historial). Suena desde el clic, así el navegador no bloquea el audio.
  const test = () => {
    announceDeposit(50000, 'Juan de Prueba');
    setAlert({
      type: 'success',
      message:
        'Así se verá y sonará cuando entre una consignación real. (Esto es solo una prueba, no queda en el historial.)',
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteBankDeposit(toDelete);
      setDeposits((d) => d.filter((x) => x.id !== toDelete));
      setToDelete(null);
    } catch (e) {
      setToDelete(null);
      setAlert({ type: 'error', message: e.message || 'No se pudo eliminar' });
    }
  };

  const confirmClear = async () => {
    try {
      await clearBankDeposits();
      setDeposits([]);
      setClearing(false);
    } catch (e) {
      setClearing(false);
      setAlert({ type: 'error', message: e.message || 'No se pudo borrar' });
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
                    Tu enlace (webhook) para el reenviador
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

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Correo donde recibes las confirmaciones del banco
                    </label>
                    <p className="mb-1 text-[11px] text-gray-400">
                      Es el correo al que tu banco te envía el aviso de cada pago
                      (Bancolombia, Nequi, Daviplata, etc.). Ahí conectarás el
                      reenviador para que las consignaciones lleguen a Pegazo.
                    </p>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tucorreo@gmail.com"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Identificador de esta empresa en el banco
                    </label>
                    <p className="mb-1 text-[11px] text-gray-400">
                      Cómo aparece tu negocio en la notificación (nombre y/o
                      llave del QR). Solo hace falta si <b>varias empresas</b>{' '}
                      reciben en el mismo correo: separa cada consignación hacia
                      la correcta. Ej:{' '}
                      <code>{status?.companyName || 'MI EMPRESA'}, @millave</code>
                    </p>
                    <input
                      value={ident}
                      onChange={(e) => setIdent(e.target.value)}
                      placeholder="Nombre en el banco y/o @llave (separados por coma)"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button variant="primary" onClick={saveConfig} loading={busy}>
                      Guardar configuración
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <label className="text-xs font-semibold text-gray-500">
                    ¿Otra empresa usa el mismo buzón/cuenta?
                  </label>
                  <p className="mb-1 text-[11px] text-gray-400">
                    Pega aquí el enlace (o token) de la otra empresa para
                    compartir el mismo buzón. Así ambas reciben del mismo correo
                    y se separan por el identificador de arriba.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      value={shareToken}
                      onChange={(e) => setShareToken(e.target.value)}
                      placeholder="Pega el enlace de la otra empresa"
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs"
                    />
                    <Button
                      variant="secondary"
                      onClick={useShared}
                      disabled={busy || !shareToken.trim()}
                    >
                      Usar
                    </Button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSetup(true)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-left transition hover:bg-blue-100"
                >
                  <span className="flex items-center gap-3">
                    <BookOpenIcon className="h-6 w-6 flex-none text-blue-600" />
                    <span>
                      <span className="block text-sm font-semibold text-blue-900">
                        ¿Cómo conectarlo? Guía paso a paso
                      </span>
                      <span className="block text-xs text-blue-800/70">
                        Te llevamos de la mano, con tu enlace ya listo. Se hace
                        una sola vez.
                      </span>
                    </span>
                  </span>
                  <span className="flex-none rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
                    Abrir guía
                  </span>
                </button>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    icon={SpeakerWaveIcon}
                    onClick={test}
                  >
                    Probar voz y aviso
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
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3">
            <h2 className="font-semibold text-gray-800">Últimas consignaciones</h2>
            {isOwner && deposits.length > 0 && (
              <button
                onClick={() => setClearing(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" /> Borrar historial
              </button>
            )}
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
                  <div className="flex flex-none items-center gap-2">
                    {d.seen && (
                      <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                    )}
                    {isOwner && (
                      <button
                        onClick={() => setToDelete(d.id)}
                        className="rounded-lg p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                        title="Eliminar registro"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showSetup && (
          <BankSetupModal
            webhook={webhook}
            correo={email}
            onClose={() => setShowSetup(false)}
          />
        )}

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({})}
        />

        <ConfirmModal
          open={!!toDelete}
          title="¿Eliminar este registro?"
          message="Se quitará esta consignación del historial de Pegazo (no afecta tu cuenta del banco)."
          confirmText="Eliminar"
          tone="danger"
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />

        <ConfirmModal
          open={clearing}
          title="¿Borrar todo el historial?"
          message="Se eliminarán todas las consignaciones registradas en Pegazo. Esto no afecta tu cuenta del banco."
          confirmText="Borrar todo"
          tone="danger"
          onConfirm={confirmClear}
          onCancel={() => setClearing(false)}
        />
      </div>
    </RoleGuard>
  );
}
