'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';
import useDeliveredSales from '@/lib/api/hooks/useDeliveredSales';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';

export default function VerifyCodeSaleClient() {
  const { getVerifyCodeSale, loading, error } = useDeliveredSales();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [sale, setSale] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;

    const fetchSale = async () => {
      try {
        const res = await getVerifyCodeSale(code);
        setSale(res?.data || res);
        setNotFound(false);
      } catch (err) {
        setNotFound(true);
      }
    };

    fetchSale();
  }, [code, getVerifyCodeSale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <DocumentTextIcon className="w-12 h-12 text-orange-600 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-600 text-sm">Verificando factura...</p>
        </div>
      </div>
    );
  }

  if (notFound || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
          <XCircleIcon className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Factura no válida
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            El código ingresado no corresponde a una venta registrada en nuestro
            sistema.
          </p>
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
            Código: <span className="font-semibold">{code || '---'}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
          <DocumentTextIcon className="w-14 h-14 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Verificación de Factura
          </h2>
          <p className="text-gray-500 text-sm">
            No se ha proporcionado un código de factura para validar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-orange-600 to-gray-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-2xl font-bold">Verificación de Factura</h1>
            </div>
          </div>

          <CheckCircleIcon className="w-10 h-10 text-green-400" />
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm">
            <p className="flex items-center gap-1.5 font-semibold">
              <CheckBadgeIcon className="h-5 w-5 flex-none text-green-600" />
              Factura válida
            </p>
            <p>
              Esta venta se encuentra registrada en nuestro sistema y es
              auténtica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Info label="Factura" value={sale?.code} />
            <Info
              label="Fecha de venta"
              value={formatDateTime(sale?.createdAt) || '---'}
            />
            <Info
              label="Cliente"
              value={sale?.customer || 'CONSUMIDOR FINAL'}
            />
            <Info label="Documento" value={sale?.document || ''} />
            <Info label="Vendedor" value={sale?.user || '---'} />
            <Info label="Local" value={sale?.local || '---'} />
            <Info label="Método de pago" value={sale?.paymentMethod} />
            <Info label="Estado" value={sale?.paymentStatus} />
            <Info label="Observación" value={sale?.notes} />
          </div>

          {Array.isArray(sale?.items) && sale?.items.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Productos comprados
              </h3>

              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="min-w-full text-sm text-gray-700">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Producto</th>
                      <th className="px-4 py-2 text-center">Cant.</th>
                      <th className="px-4 py-2 text-right">Precio</th>
                      <th className="px-4 py-2 text-right">Descuento</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-none">
                        <td className="px-4 py-2">
                          {item.product} - {item.color}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCOP(item.price)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {formatCOP(item.discount)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {formatCOP(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <div className="bg-gray-900 text-white px-6 py-3 rounded-xl text-lg font-bold">
              TOTAL: {formatCOP(sale?.totalAmount)}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 text-center py-4 text-xs text-gray-500">
          Esta verificación fue generada automáticamente.
          <br />
          Para soporte o garantías, conserve este comprobante.
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value || '---'}</p>
    </div>
  );
}
