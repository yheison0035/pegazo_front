'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReceiptPercentIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { getTaxReport } from '@/lib/api/routes/statistics';
import { formatCOP } from '@/lib/api/utils/utils';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

// Primer día del mes actual y hoy (YYYY-MM-DD).
function defaultRange() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  const end = local.toISOString().slice(0, 10);
  const start = `${end.slice(0, 7)}-01`;
  return { start, end };
}

export default function ImpuestosPage() {
  const init = defaultRange();
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState(init.start);
  const [end, setEnd] = useState(init.end);
  const [data, setData] = useState(null);

  const load = useCallback(async (s, e) => {
    setLoading(true);
    try {
      const res = await getTaxReport({ startDate: s, endDate: e });
      setData(res?.data || null);
    } catch (_) {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(init.start, init.end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iva = data?.iva;
  const ventas = data?.ventas;
  const compras = data?.compras;
  const neto = iva?.neto ?? 0;

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
      <div className="w-full p-4">
        {loading && <LoadingOverlay />}

        <div className="mb-5">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
            <ReceiptPercentIcon className="h-7 w-7 text-orange-500" />
            Reporte de IVA
          </h1>
          <p className="text-sm text-gray-500">
            IVA generado en tus ventas vs. IVA descontable de tus compras. Esta
            es la base para tu declaración de IVA.
          </p>
        </div>

        {/* Rango de fechas */}
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Desde</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-0.5 block rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Hasta</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-0.5 block rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <Button variant="primary" onClick={() => load(start, end)}>
            Consultar
          </Button>
        </div>

        {/* Resultado neto */}
        <div
          className={`mb-5 rounded-2xl border p-5 shadow-sm ${
            neto > 0
              ? 'border-red-100 bg-red-50/60'
              : neto < 0
                ? 'border-emerald-100 bg-emerald-50/60'
                : 'border-gray-200 bg-white'
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {neto > 0
              ? 'IVA a pagar en el periodo'
              : neto < 0
                ? 'Saldo de IVA a favor'
                : 'IVA neto del periodo'}
          </p>
          <p
            className={`mt-1 text-3xl font-bold ${
              neto > 0
                ? 'text-red-600'
                : neto < 0
                  ? 'text-emerald-600'
                  : 'text-gray-900'
            }`}
          >
            {formatCOP(Math.abs(neto))}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            IVA generado {formatCOP(iva?.generado || 0)} − IVA descontable{' '}
            {formatCOP(iva?.descontable || 0)}
          </p>
        </div>

        {/* Detalle ventas vs compras */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TaxBlock
            title="IVA generado (ventas)"
            accent="text-orange-600"
            base={ventas?.base}
            iva={ventas?.iva}
            total={ventas?.total}
            count={ventas?.count}
            countLabel="ventas"
          />
          <TaxBlock
            title="IVA descontable (compras)"
            accent="text-emerald-600"
            base={compras?.base}
            iva={compras?.iva}
            total={compras?.total}
            count={compras?.count}
            countLabel="compras"
          />
        </div>

        <p className="mt-4 text-xs text-gray-400">
          Solo cuenta con IVA si tu empresa es responsable de IVA (Configuración →
          Impuestos). Periodo: {data?.range?.startDate} a {data?.range?.endDate}.
        </p>
      </div>
    </RoleGuard>
  );
}

function TaxBlock({ title, accent, base, iva, total, count, countLabel }) {
  const Row = ({ label, value, strong }) => (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm ${strong ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}
      >
        {value}
      </span>
    </div>
  );
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-2 font-semibold text-gray-800">{title}</h3>
      <div className="divide-y divide-gray-100">
        <Row label="Base gravable" value={formatCOP(base || 0)} />
        <Row
          label={<span className={accent}>IVA</span>}
          value={<span className={accent}>{formatCOP(iva || 0)}</span>}
        />
        <Row label="Total" value={formatCOP(total || 0)} strong />
      </div>
      <p className="mt-2 text-xs text-gray-400">
        {count || 0} {countLabel} en el periodo
      </p>
    </div>
  );
}
