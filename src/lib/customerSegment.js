// Segmento comercial del cliente (calculado en el backend según recencia y
// frecuencia). Etiqueta + color del chip para la ficha y los listados.
export const CUSTOMER_SEGMENT = {
  NUEVO: { label: 'Nuevo', chip: 'bg-blue-100 text-blue-700' },
  FRECUENTE: { label: 'Frecuente', chip: 'bg-emerald-100 text-emerald-700' },
  VIP: { label: 'VIP', chip: 'bg-amber-100 text-amber-700' },
  EN_RIESGO: { label: 'En riesgo', chip: 'bg-orange-100 text-orange-700' },
  PERDIDO: { label: 'Perdido', chip: 'bg-red-100 text-red-700' },
};

export function segmentMeta(segment) {
  return (
    CUSTOMER_SEGMENT[segment] || {
      label: segment || '—',
      chip: 'bg-slate-100 text-slate-700',
    }
  );
}
