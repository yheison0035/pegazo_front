'use client';

import { formatCOP, formatPrice, formatText } from '@/lib/api/utils/utils';

export default function SaleItemsTable({ items = [], sale = null }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const itemsSum = items.reduce((acc, item) => acc + (item.subtotal || 0), 0);
  // Si la venta trae desglose fiscal, se usan sus valores reales (base + IVA);
  // si no, el total es la simple suma de líneas.
  const taxTotal = Number(sale?.taxTotal) || 0;
  const showTax = taxTotal > 0;
  const base = Number(sale?.subtotal) || itemsSum;
  const total = sale?.totalAmount != null ? Number(sale.totalAmount) : itemsSum;

  return (
    <div className="border-t p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Productos de la venta
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">
          <thead className="bg-gray-100 text-sm text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Producto</th>
              <th className="px-4 py-2 text-left">Color</th>
              <th className="px-4 py-2 text-center">Cantidad</th>
              <th className="px-4 py-2 text-right">Precio</th>
              <th className="px-4 py-2 text-right">Descuento</th>
              <th className="px-4 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm text-gray-700">
            {items.map((item) => {
              const name =
                item?.variant?.inventory?.name || item?.service?.name;
              const color = item?.variant?.color || '-';

              return (
                <tr key={item.id}>
                  <td className="px-4 py-2 font-medium">{name}</td>
                  <td className="px-4 py-2">{color}</td>
                  <td className="px-4 py-2 text-center">{item.quantity}</td>
                  <td className="px-4 py-2 text-right">
                    {formatPrice(item.price)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatCOP(item.discount || 0)}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">
                    {formatPrice(item.subtotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 text-sm">
            {showTax && (
              <>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-gray-500">
                    Base gravable
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {formatCOP(base)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-gray-500">
                    IVA
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {formatCOP(taxTotal)}
                  </td>
                </tr>
              </>
            )}
            <tr>
              <td colSpan={5} className="px-4 py-3 text-right font-semibold">
                Total
              </td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">
                {formatPrice(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
