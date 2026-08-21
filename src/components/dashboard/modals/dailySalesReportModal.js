'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  XMarkIcon,
  CalendarDaysIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import useLocals from '@/lib/api/hooks/useLocals';
import useDeliveredSales from '@/lib/api/hooks/useDeliveredSales';
import { formatCOP, toggleCase } from '@/lib/api/utils/utils';

export default function DailySalesReportModal({ onClose }) {
  const [locals, setLocals] = useState([]);
  const [localId, setLocalId] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { getLocals } = useLocals();
  const { getDailySalesReport } = useDeliveredSales();

  const fetchInitialData = useCallback(async () => {
    try {
      const res = await getLocals();
      setLocals(res?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [getLocals]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const { data } = await getDailySalesReport(date, localId);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="relative bg-gradient-to-r from-[#111827] to-[#374151] px-8 py-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-300 hover:text-white transition cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-8 h-8 text-orange-400" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Reporte de Ventas Diarias
              </h2>
              <p className="text-sm text-gray-300">
                Resumen por método de pago y asesor
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-600">
                <CalendarDaysIcon className="w-4 h-4" />
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2 w-full cursor-pointer rounded-xl border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-600">
                <BuildingStorefrontIcon className="w-4 h-4" />
                Local
              </label>
              <select
                value={localId}
                onChange={(e) => setLocalId(e.target.value)}
                className="mt-2 w-full rounded-xl cursor-pointer border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Seleccione</option>
                {locals.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="mt-6"
            disabled={!date || !localId}
            loading={loading}
            onClick={handleFetch}
          >
            Generar reporte
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-gray-100">
          {!result && (
            <div className="text-center text-gray-400 py-20">
              Selecciona una fecha y un local para visualizar el reporte
            </div>
          )}

          {result && (
            <>
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Resumen General
                </h3>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-600">
                    Ventas del día{' '}
                    <span className="font-bold text-gray-900">
                      {result.date}
                    </span>
                  </span>
                  <span className="text-2xl font-bold text-orange-600">
                    {formatCOP(result.total.total)}
                  </span>
                </div>

                <div className="border-t pt-3 space-y-2">
                  {result.total.users.map((user, index) => (
                    <div
                      key={user.name}
                      className={`flex justify-between items-center text-sm px-3 py-2 rounded-lg
                        ${index === 0 ? 'bg-yellow-50 border border-yellow-300' : 'text-gray-700'}
                      `}
                    >
                      <span className="font-bold flex items-center gap-2">
                        {index === 0 && (
                          <TrophyIcon className="h-5 w-5 flex-none text-amber-500" />
                        )}

                        {toggleCase(user.name, 'uppercase')}
                      </span>

                      <span className="font-bold">{formatCOP(user.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(result.methods).map(([method, data]) => (
                  <div
                    key={method}
                    className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5"
                  >
                    <div className="flex justify-between items-center border-b pb-3 mb-3">
                      <h4 className="font-semibold text-gray-800">{method}</h4>
                      <span className="font-bold text-orange-600">
                        {formatCOP(data.total) || '$ 0'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(data.users).map(([user, total]) => (
                        <div
                          key={user}
                          className="flex justify-between text-sm text-gray-700"
                        >
                          <span>{toggleCase(user, 'uppercase')}</span>
                          <span className="font-medium">
                            {formatCOP(total) || '$ 0'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
