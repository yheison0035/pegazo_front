'use client';

import { useSearchParams } from 'next/navigation';
import useSales from '@/lib/api/hooks/useSales';
import PosSale from '@/components/pos/PosSale';

export default function AddSales() {
  const { createSale } = useSales();
  const searchParams = useSearchParams();
  // Pre-búsqueda desde el buscador global (acción "Vender"): /dashboard/sales?q=...
  const initialQuery = searchParams.get('q') || '';

  return (
    <PosSale
      mode="new"
      title="Realizar Factura"
      onSubmit={(payload) => createSale(payload)}
      successMessage="Factura registrada correctamente."
      successUrl="/dashboard/delivered_sales"
      initialQuery={initialQuery}
    />
  );
}
