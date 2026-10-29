// Convierte una cita de la agenda en el estado inicial del POS (cobrar cita):
// el servicio con su precio en la sede de la cita, el cliente y quien atendió.
// Lógica pura (sin React) para poder probarla.

// Precio del servicio en la sede de la cita; si no hay precio para esa sede,
// usa el primero configurado; si no hay ninguno, 0 (el cajero lo corrige).
export function servicePriceForLocal(service, localId) {
  const list = Array.isArray(service?.serviceLocals) ? service.serviceLocals : [];
  const exact = list.find((sl) => Number(sl.localId) === Number(localId));
  const pick = exact || list[0];
  return Number(pick?.price) || 0;
}

export function prefillFromAppointment(appt) {
  if (!appt?.id || !appt?.service?.id) return null;
  const service = appt.service;
  return {
    appointmentId: appt.id,
    localId: appt.localId,
    sellerId: appt.barberId ?? '',
    customer: appt.customer || null,
    cart: [
      {
        key: `s${service.id}`,
        type: 'service',
        refId: service.id,
        name: service.name,
        price: servicePriceForLocal(service, appt.localId),
        taxRate: service.taxRate != null ? Number(service.taxRate) : undefined,
        unit: 'UNIDAD',
        quantity: 1,
        discount: 0,
      },
    ],
  };
}

// ¿Se puede cobrar esta cita? (no cancelada / no asistida y sin venta previa).
export function canChargeAppointment(appt) {
  if (!appt) return false;
  if (['CANCELADA', 'NO_ASISTIO'].includes(appt.status)) return false;
  if (Array.isArray(appt.sales) && appt.sales.length) return false;
  return true;
}
