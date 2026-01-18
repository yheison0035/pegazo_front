'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
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

  useEffect(() => {
    const fetchLocals = async () => {
      try {
        const res = await getLocals();
        setLocals(res?.data || []);
      } catch (err) {
        console.error('Error cargando locales', err);
      }
    };

    fetchLocals();
  }, [getLocals]);

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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition cursor-pointer z-10"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-6 py-5">
          <h2 className="text-2xl font-bold">Reporte de Ventas Diarias</h2>
          <p className="text-sm opacity-80">
            Resumen por método de pago y asesor
          </p>
        </div>

        <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Local
              </label>
              <select
                value={localId}
                onChange={(e) => setLocalId(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Seleccione un local</option>
                {locals.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            disabled={!date || !localId || loading}
            onClick={handleFetch}
            className="mt-4 w-full bg-orange-600 text-white py-2.5 rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? 'Consultando...' : 'Ver Resultados'}
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-6 space-y-6">
          {!result && (
            <div className="text-center text-gray-400 py-12">
              Selecciona una fecha y un local para ver el reporte.
            </div>
          )}

          {result && (
            <>
              {Object.entries(result.methods).map(([method, data]) => (
                <div
                  key={method}
                  className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {method}
                    </h3>
                    <span className="text-sm font-bold text-orange-600">
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

              <div className="border-t border-gray-300 pt-5">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Total General
                </h3>

                <div className="space-y-2">
                  {Object.entries(result.total.users).map(([user, total]) => (
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

                <div className="flex justify-between text-xl font-bold mt-4 text-gray-900">
                  <span>TOTAL</span>
                  <span>{formatCOP(result?.total?.total) || '$ 0'}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
