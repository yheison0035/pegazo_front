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

  const decide = async (item, action) => {
    let note;
    if (action === 'reject') {
      note = window.prompt('Motivo del rechazo (opcional):') || undefined;
    }
    setBusyId(item.id);
    try {
      if (action === 'approve') {
        await approveStockRequest(item.id, note);
        toast.show({ type: 'success', message: 'Disminución aprobada.' });
      } else {
        await rejectStockRequest(item.id, note);
        toast.show({ type: 'success', message: 'Solicitud rechazada.' });
      }
      await load();
      window.dispatchEvent(new Event('stock-requests-changed'));
    } catch (err) {
      toast.show({ type: 'error', message: err.message || 'No se pudo procesar' });
    } finally {
      setBusyId(null);
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
                        onClick={() => decide(item, 'approve')}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-4 w-4" /> Aprobar
                      </button>
                      <button
                        disabled={busyId === item.id}
                        onClick={() => decide(item, 'reject')}
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
