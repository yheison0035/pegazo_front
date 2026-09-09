'use client';

import { useCallback, useEffect, useState } from 'react';
import RoleGuard from '@/auth/roleGuard';
import { useToast } from '@/context/toastContext';
import {
  getStockRequests,
  approveStockRequest,
  rejectStockRequest,
} from '@/lib/api/routes/stock-requests';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const STATUS_META = {
  PENDING: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Aprobada', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Rechazada', cls: 'bg-red-100 text-red-700' },
};

function fmtDate(d) {
  try {
    return new Date(d).toLocaleString('es-CO');
  } catch {
    return '';
  }
}

function StockRequestsInner() {
  const toast = useToast();
  const [tab, setTab] = useState('PENDING');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  // Modal de rechazo (reemplaza el prompt nativo). Motivo opcional.
  const [rejectModal, setRejectModal] = useState({
    open: false,
    item: null,
    note: '',
    submitting: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getStockRequests(tab);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.show({ type: 'error', message: err.message || 'Error al cargar' });
    } finally {
      setLoading(false);
    }
  }, [tab, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (item) => {
    setBusyId(item.id);
    try {
      await approveStockRequest(item.id);
      toast.show({ type: 'success', message: 'Disminución aprobada.' });
      await load();
      window.dispatchEvent(new Event('stock-requests-changed'));
    } catch (err) {
      toast.show({ type: 'error', message: err.message || 'No se pudo procesar' });
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = async () => {
    const item = rejectModal.item;
    if (!item) return;
    setRejectModal((s) => ({ ...s, submitting: true }));
    try {
      await rejectStockRequest(item.id, rejectModal.note.trim() || undefined);
      toast.show({ type: 'success', message: 'Solicitud rechazada.' });
      setRejectModal({ open: false, item: null, note: '', submitting: false });
      await load();
      window.dispatchEvent(new Event('stock-requests-changed'));
    } catch (err) {
      setRejectModal((s) => ({ ...s, submitting: false }));
      toast.show({ type: 'error', message: err.message || 'No se pudo procesar' });
    }
  };

  return (
    <div className="mx-auto mt-6 max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Solicitudes de disminución de stock
          </h1>
          <p className="text-sm text-gray-500">
            Aprueba o rechaza las bajas de inventario que piden tus empleados.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <ArrowPathIcon className="h-4 w-4" /> Actualizar
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === s
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {STATUS_META[s].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
          No hay solicitudes {STATUS_META[tab].label.toLowerCase()}.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const lines = Array.isArray(item.lines) ? item.lines : [];
            const meta = STATUS_META[item.status] || STATUS_META.PENDING;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {item.inventory?.name || 'Producto'}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.cls}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Solicitado por{' '}
                      <span className="font-medium text-gray-700">
                        {item.requestedBy?.name || '—'}
                      </span>{' '}
                      · {fmtDate(item.createdAt)}
                    </p>
                  </div>
                  {item.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        disabled={busyId === item.id}
                        onClick={() => approve(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-4 w-4" /> Aprobar
                      </button>
                      <button
                        disabled={busyId === item.id}
                        onClick={() =>
                          setRejectModal({
                            open: true,
                            item,
                            note: '',
                            submitting: false,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        <XCircleIcon className="h-4 w-4" /> Rechazar
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm">
                  {lines.map((l, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-gray-600"
                    >
                      <span>{l.label}</span>
                      <span className="font-medium">
                        {l.currentStock} → {l.requestedStock}{' '}
                        <span className="text-red-500">({l.delta})</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-start gap-2 text-sm">
                  <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <p className="text-gray-700">
                    <span className="font-medium">Motivo:</span> {item.reason}
                  </p>
                </div>

                {item.status !== 'PENDING' && (
                  <p className="mt-2 text-xs text-gray-500">
                    {meta.label} por{' '}
                    <span className="font-medium">
                      {item.decidedBy?.name || '—'}
                    </span>{' '}
                    · {fmtDate(item.decidedAt)}
                    {item.decisionNote ? ` · ${item.decisionNote}` : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="rounded-t-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <h3 className="text-lg font-bold text-white">
                Rechazar solicitud
              </h3>
              <p className="text-sm text-white/90">
                {rejectModal.item?.inventory?.name || 'Producto'} · solicitado
                por {rejectModal.item?.requestedBy?.name || '—'}
              </p>
            </div>
            <div className="space-y-3 px-6 py-5">
              <p className="text-sm text-gray-600">
                El stock no se modificará. Si quieres, deja una nota para que el
                solicitante sepa por qué.
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Motivo del rechazo{' '}
                  <span className="text-gray-400">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectModal.note}
                  onChange={(e) =>
                    setRejectModal((s) => ({ ...s, note: e.target.value }))
                  }
                  placeholder="Ej: la cantidad no coincide con el conteo físico…"
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 rounded-b-2xl border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  setRejectModal({
                    open: false,
                    item: null,
                    note: '',
                    submitting: false,
                  })
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={rejectModal.submitting}
                onClick={confirmReject}
                className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircleIcon className="h-4 w-4" />
                {rejectModal.submitting ? 'Rechazando…' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StockRequestsPage() {
  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
      <StockRequestsInner />
    </RoleGuard>
  );
}
