'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSales from '@/lib/api/hooks/useSales';
import PosSale from '@/components/pos/PosSale';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { getAppointmentById } from '@/lib/api/routes/appointments';
import { prefillFromAppointment } from '@/lib/pos/appointmentPrefill';

export default function AddSales() {
  const { createSale } = useSales();
  const searchParams = useSearchParams();
  // Pre-búsqueda desde el buscador global (acción "Vender"): /dashboard/sales?q=...
  const initialQuery = searchParams.get('q') || '';
  // Cobrar una cita desde la agenda: /dashboard/sales?appointment=<id>
  // Trae la cita y pre-llena servicio (precio de la sede), cliente y atendedor;
  // la venta queda enlazada a la cita y la cita pasa a COMPLETADA al cobrar.
  const appointmentParam = searchParams.get('appointment');
  const [prefill, setPrefill] = useState(null);
  const [loading, setLoading] = useState(!!appointmentParam);

  useEffect(() => {
    if (!appointmentParam) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getAppointmentById(Number(appointmentParam));
        const appt = res?.data || res;
        if (!cancelled) setPrefill(prefillFromAppointment(appt));
      } catch {
        if (!cancelled) setPrefill(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appointmentParam]);

  if (loading) return <LoadingOverlay show text="Cargando la cita…" />;

  return (
    <PosSale
      key={prefill?.appointmentId || 'new'}
      mode="new"
      title={prefill ? 'Cobrar cita' : 'Realizar Factura'}
      initial={prefill}
      appointmentId={prefill?.appointmentId || null}
      onSubmit={(payload) => createSale(payload)}
      successMessage={prefill ? 'Cita cobrada y marcada como completada.' : 'Factura registrada correctamente.'}
      successUrl={prefill ? '/dashboard/appointments' : '/dashboard/delivered_sales'}
      initialQuery={initialQuery}
    />
  );
}
