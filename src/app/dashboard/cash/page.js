'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BanknotesIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  LockClosedIcon,
  InformationCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import Button from '@/components/ui/Button';
import { Roles } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import useCash from '@/lib/api/hooks/useCash';
import useLocals from '@/lib/api/hooks/useLocals';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';

// Formato de dinero en vivo para los inputs: guarda solo dígitos y muestra
// el valor con separador de miles ($ 100.000).
const fmtMoney = (v) =>
  v === '' || v === null || v === undefined ? '' : formatCOP(v);
const parseMoney = (s) => (s || '').toString().replace(/[^\d]/g, '');
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

export default function CashPage() {
  const { usuario } = useAuth();
  const {
    getCurrentCash,
    getCashHistory,
    openCash,
    addCashMovement,
    closeCash,
    reopenCash,
    loading,
  } = useCash();
  const { getLocals } = useLocals();

  // Solo el dueño/admin puede reabrir una caja (por si se cerró por error).
  const canReopen = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);

  const [locals, setLocals] = useState([]);
  const [localId, setLocalId] = useState(usuario?.localId || '');
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // formularios
  const [openingAmount, setOpeningAmount] = useState('');
  const [mov, setMov] = useState({ type: 'INGRESO', amount: '', concept: '' });
  const [counted, setCounted] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getLocals({ all: true });
        const list = res?.data || [];
        setLocals(list);
        if (!localId && list.length) setLocalId(String(list[0].id));
      } catch (_) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async () => {
    if (!localId) return;
    try {
      const cur = await getCurrentCash(localId);
      setCurrent(cur.data);
      const hist = await getCashHistory({ localId, status: 'CERRADA', limit: 8 });
      setHistory(hist.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error al cargar la caja' });
    }
  }, [localId, getCurrentCash, getCashHistory]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleOpen = async () => {
    try {
      await openCash({
        localId: Number(localId),
        openingAmount: Number(openingAmount) || 0,
      });
      setOpeningAmount('');
      setAlert({ type: 'success', message: 'Caja abierta.' });
      refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo abrir la caja' });
    }
  };

  const handleMovement = async () => {
    if (!mov.amount) return;
    try {
      await addCashMovement(current.id, {
        type: mov.type,
        amount: Number(mov.amount),
        concept: mov.concept,
      });
      setMov({ type: 'INGRESO', amount: '', concept: '' });
      refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo registrar' });
    }
  };

  const handleReopen = async (id) => {
    try {
      await reopenCash(id);
      setAlert({ type: 'success', message: 'Caja reabierta.' });
      refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo reabrir' });
    }
  };

  const handleClose = async () => {
    try {
      const res = await closeCash(current.id, { countedAmount: Number(counted) || 0 });
      const diff = res.data?.difference ?? 0;
      setCounted('');
      setAlert({
        type: diff === 0 ? 'success' : 'warning',
        message:
          diff === 0
            ? 'Caja cerrada. El arqueo cuadra exactamente.'
            : `Caja cerrada. Diferencia: ${formatCOP(diff)} (${
                diff > 0 ? 'sobrante' : 'faltante'
              }).`,
      });
      refresh();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo cerrar la caja' });
    }
  };

  const t = current?.totals;

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Caja</h1>
            <p className="text-sm text-gray-500">
              Apertura, movimientos y arqueo (cierre) de caja.
            </p>
          </div>
          {locals.length > 1 && (
            <select
              value={localId}
              onChange={(e) => setLocalId(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {locals.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Instructivo: cómo funciona la caja */}
        <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/60 overflow-hidden">
          <button
            onClick={() => setShowHelp((v) => !v)}
            className="w-full flex items-center gap-2 px-4 py-3 text-left"
          >
            <InformationCircleIcon className="w-5 h-5 flex-none text-blue-500" />
            <span className="text-sm font-semibold text-blue-800 flex-1">
              ¿Cómo funciona la caja? (instructivo)
            </span>
            <ChevronDownIcon
              className={`w-5 h-5 text-blue-500 transition ${
                showHelp ? 'rotate-180' : ''
              }`}
            />
          </button>
          {showHelp && (
            <div className="px-4 pb-4 text-sm text-blue-900/80 space-y-2">
              <p>
                <b>1. Abrir caja:</b> al iniciar el turno, ingresa el{' '}
                <b>fondo inicial (base)</b> — el efectivo con el que arrancas.
                Solo puede haber una caja abierta por sede a la vez.
              </p>
              <p>
                <b>2. Automático (no lo registras a mano):</b> las{' '}
                <b>ventas en efectivo</b> entran solas como ingreso y los{' '}
                <b>gastos en efectivo</b> salen solos como egreso. Solo registra
                un movimiento manual cuando <b>no</b> sea una venta ni un gasto:
                un <b>retiro</b> (sacar plata para el banco), meter{' '}
                <b>base/cambio</b> extra o un <b>ajuste</b>.
              </p>
              <p>
                <b>3. Esperado en caja:</b> es lo que debería haber físicamente ={' '}
                <i>base + ingresos − egresos</i>. Se calcula solo.
              </p>
              <p>
                <b>4. Cerrar caja (arqueo):</b> al terminar el turno,{' '}
                <b>cuenta el efectivo real</b> y escríbelo. El sistema lo compara
                con lo esperado y guarda la <b>diferencia</b> (sobrante o
                faltante). Tras cerrar, la caja queda en el historial.
              </p>
              <p className="text-blue-700">
                Consejo: cierra la caja al final de cada turno para detectar
                descuadres a tiempo.
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          <LoadingOverlay show={loading} text="Procesando..." />

          {/* Sin caja abierta: abrir */}
          {!current && (
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BanknotesIcon className="w-6 h-6 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Abrir caja
                </h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                No hay una caja abierta en esta sede. Ingresa el fondo inicial
                (base) con el que arrancas el turno.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  value={fmtMoney(openingAmount)}
                  onChange={(e) => setOpeningAmount(parseMoney(e.target.value))}
                  placeholder="Base inicial (ej: $ 100.000)"
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <Button
                  variant="primary"
                  onClick={handleOpen}
                  disabled={loading}
                >
                  Abrir caja
                </Button>
              </div>
            </div>
          )}

          {/* Caja abierta */}
          {current && (
            <div className="space-y-5">
              {/* Resumen */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Base inicial" value={formatCOP(current.openingAmount)} />
                <Stat label="Ingresos" value={formatCOP(t?.ingresos)} tone="green" />
                <Stat label="Egresos" value={formatCOP(t?.egresos)} tone="red" />
                <Stat
                  label="Esperado en caja"
                  value={formatCOP(t?.expected)}
                  tone="orange"
                />
              </div>
              <p className="text-xs text-gray-400">
                Caja abierta {formatDateTime(current.openedAt)} por{' '}
                {current.openedBy?.name || '—'}. Las ventas en efectivo se suman
                automáticamente.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Movimientos */}
                <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-800">
                    Otro movimiento de efectivo
                  </h3>
                  <p className="mb-3 text-xs text-gray-400">
                    Solo para retiros, base/cambio o ajustes. Las ventas y los
                    gastos en efectivo ya entran y salen solos.
                  </p>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setMov((m) => ({ ...m, type: 'INGRESO' }))}
                      className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium border ${
                        mov.type === 'INGRESO'
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      <ArrowDownCircleIcon className="w-4 h-4" /> Ingreso
                    </button>
                    <button
                      onClick={() => setMov((m) => ({ ...m, type: 'EGRESO' }))}
                      className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium border ${
                        mov.type === 'EGRESO'
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      <ArrowUpCircleIcon className="w-4 h-4" /> Egreso
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fmtMoney(mov.amount)}
                    onChange={(e) =>
                      setMov((m) => ({ ...m, amount: parseMoney(e.target.value) }))
                    }
                    placeholder="Monto"
                    className="w-full mb-2 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    value={mov.concept}
                    onChange={(e) => setMov((m) => ({ ...m, concept: e.target.value }))}
                    placeholder="Concepto (ej: retiro, pago proveedor…)"
                    className="w-full mb-3 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={handleMovement}
                    disabled={loading || !mov.amount}
                    className="w-full rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50"
                  >
                    Registrar
                  </button>

                  <div className="mt-4 max-h-52 overflow-y-auto divide-y divide-gray-50">
                    {current.movements?.length === 0 && (
                      <p className="text-sm text-gray-400 py-3">Sin movimientos.</p>
                    )}
                    {current.movements?.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-gray-600">
                          {m.concept || (m.type === 'INGRESO' ? 'Ingreso' : 'Egreso')}
                        </span>
                        <span
                          className={
                            m.type === 'INGRESO'
                              ? 'text-green-600 font-medium'
                              : 'text-red-600 font-medium'
                          }
                        >
                          {m.type === 'INGRESO' ? '+' : '−'}
                          {formatCOP(m.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cierre / arqueo */}
                <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                    <LockClosedIcon className="w-5 h-5 text-orange-500" /> Cerrar caja (arqueo)
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Cuenta el efectivo físico en la caja y regístralo. Se compara
                    con lo esperado y se guarda la diferencia.
                  </p>
                  <div className="rounded-xl bg-orange-50/60 p-4 mb-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Esperado en caja</span>
                      <span className="font-semibold">{formatCOP(t?.expected)}</span>
                    </div>
                    {counted !== '' && (
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-600">Diferencia</span>
                        <span
                          className={
                            Number(counted) - (t?.expected || 0) === 0
                              ? 'font-semibold text-green-600'
                              : 'font-semibold text-red-600'
                          }
                        >
                          {formatCOP(Number(counted) - (t?.expected || 0))}
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fmtMoney(counted)}
                    onChange={(e) => setCounted(parseMoney(e.target.value))}
                    placeholder="Efectivo contado"
                    className="w-full mb-3 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <Button
                    variant="primary"
                    onClick={handleClose}
                    disabled={loading || counted === ''}
                    fullWidth
                  >
                    Cerrar caja
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Historial */}
          {history.length > 0 && (
            <div className="mt-6 bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Cierres recientes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="px-5 py-2 font-medium">Apertura</th>
                      <th className="px-5 py-2 font-medium">Cierre</th>
                      <th className="px-5 py-2 font-medium text-right">Base</th>
                      <th className="px-5 py-2 font-medium text-right">Esperado</th>
                      <th className="px-5 py-2 font-medium text-right">Contado</th>
                      <th className="px-5 py-2 font-medium text-right">Diferencia</th>
                      {canReopen && <th className="px-5 py-2 font-medium text-center">Acción</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((c) => (
                      <tr key={c.id} className="border-b border-gray-50">
                        <td className="px-5 py-2 text-gray-500">
                          {formatDateTime(c.openedAt)}
                        </td>
                        <td className="px-5 py-2 text-gray-500">
                          {formatDateTime(c.closedAt)}
                        </td>
                        <td className="px-5 py-2 text-right">{formatCOP(c.openingAmount)}</td>
                        <td className="px-5 py-2 text-right">{formatCOP(c.expectedAmount)}</td>
                        <td className="px-5 py-2 text-right">{formatCOP(c.countedAmount)}</td>
                        <td
                          className={`px-5 py-2 text-right font-medium ${
                            (c.difference || 0) === 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatCOP(c.difference)}
                        </td>
                        {canReopen && (
                          <td className="px-5 py-2 text-center">
                            <button
                              onClick={() => handleReopen(c.id)}
                              disabled={loading || !!current}
                              title={
                                current
                                  ? 'Cierra la caja abierta antes de reabrir otra'
                                  : 'Reabrir esta caja'
                              }
                              className="rounded-lg border border-orange-200 px-2.5 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-40"
                            >
                              Reabrir
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      </div>
    </RoleGuard>
  );
}

function Stat({ label, value, tone }) {
  const tones = {
    green: 'text-green-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
  };
  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
      <p className="text-xs uppercase text-gray-400">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tones[tone] || 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  );
}
