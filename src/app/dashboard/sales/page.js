'use client';

import useSales from '@/lib/api/hooks/useSales';
import PosSale from '@/components/pos/PosSale';

export default function AddSales() {
  const { createSale } = useSales();

  return (
    <PosSale
      mode="new"
      title="Realizar Factura"
      onSubmit={(payload) => createSale(payload)}
      successMessage="Factura registrada correctamente."
      successUrl="/dashboard/delivered_sales"
    />
  );
}
