// Metadatos de los estados de una cita: etiqueta legible, color del chip y del
// punto. Se usa en la agenda, los recordatorios y (opcionalmente) las tablas
// para que el color de cada estado sea consistente en todo el sitio.
export const APPOINTMENT_STATUS = {
  PENDIENTE: {
    label: 'Pendiente',
    chip: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-500',
  },
  CONFIRMADA: {
    label: 'Confirmada',
    chip: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  EN_PROCESO: {
    label: 'En proceso',
    chip: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-500',
  },
  COMPLETADA: {
    label: 'Completada',
    chip: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
  },
  CANCELADA: {
    label: 'Cancelada',
    chip: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
  NO_ASISTIO: {
    label: 'No asistió',
    chip: 'bg-gray-100 text-gray-700',
    dot: 'bg-gray-400',
  },
};

export function statusMeta(status) {
  return (
    APPOINTMENT_STATUS[status] || {
      label: status || '—',
      chip: 'bg-slate-100 text-slate-700',
      dot: 'bg-slate-400',
    }
  );
}
