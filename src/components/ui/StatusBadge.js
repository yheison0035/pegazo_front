'use client';

// Pill de estado unificado para todo el CRM.
// Mapea el valor crudo del backend (ACTIVO, PAGADA, COMPLETADA…) a un color
// semántico + una etiqueta legible. Reemplaza los ~6 mapas de estilos duplicados
// que había repartidos por los módulos (orders, purchases, quotes, appointments…).
//
// Uso: <StatusBadge status={info.status} />
//      <StatusBadge status={sale.paymentStatus} />

const MAP = {
  // Estado de entidades
  ACTIVO: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  ACTIVE: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  INACTIVO: { cls: 'bg-gray-100 text-gray-600 ring-gray-500/20', dot: 'bg-gray-400' },
  INACTIVE: { cls: 'bg-gray-100 text-gray-600 ring-gray-500/20', dot: 'bg-gray-400' },
  ELIMINADO: { cls: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-500' },

  // Estado de pago
  PAGADA: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  PAGADO: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  PENDIENTE: { cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  ABONADA: { cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
  PARCIAL: { cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
  ANULADA: { cls: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-500' },

  // Estado de citas
  COMPLETADA: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  CONFIRMADA: { cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
  EN_PROCESO: { cls: 'bg-purple-50 text-purple-700 ring-purple-600/20', dot: 'bg-purple-500' },
  CANCELADA: { cls: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-500' },
  NO_ASISTIO: { cls: 'bg-gray-100 text-gray-600 ring-gray-500/20', dot: 'bg-gray-400' },

  // Estado de compras
  RECIBIDA: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },

  // Estado de cotizaciones
  ACEPTADA: { cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
  RECHAZADA: { cls: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-500' },
  CONVERTIDA: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  VENCIDA: { cls: 'bg-gray-100 text-gray-600 ring-gray-500/20', dot: 'bg-gray-400' },

  // Estado de documentos electrónicos DIAN (facturación electrónica)
  BORRADOR: { cls: 'bg-gray-100 text-gray-600 ring-gray-500/20', dot: 'bg-gray-400' },
  FIRMADO: { cls: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20', dot: 'bg-indigo-500' },
  ENVIADO: { cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500 animate-pulse' },
  ACEPTADO: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  RECHAZADO: { cls: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-500' },
  CONTINGENCIA: { cls: 'bg-orange-50 text-orange-700 ring-orange-600/20', dot: 'bg-orange-500' },
  ERROR: { cls: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-500' },
  // Estado de habilitación de la empresa ante la DIAN
  HABILITADO: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  REGISTRADO: { cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  EN_PRUEBAS: { cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
};

const DEFAULT = { cls: 'bg-slate-100 text-slate-700 ring-slate-500/20', dot: 'bg-slate-400' };

// Etiquetas más legibles para las que llevan guion bajo.
const LABELS = {
  EN_PROCESO: 'En proceso',
  NO_ASISTIO: 'No asistió',
  EN_PRUEBAS: 'En pruebas',
  CONTINGENCIA: 'Contingencia',
};

function prettyLabel(status) {
  const key = String(status).toUpperCase();
  if (LABELS[key]) return LABELS[key];
  // ACTIVO -> Activo, PAGADA -> Pagada
  return key.charAt(0) + key.slice(1).toLowerCase();
}

export default function StatusBadge({ status, dot = true, className = '' }) {
  if (!status) return <span className="text-gray-400">---</span>;
  const key = String(status).toUpperCase();
  const s = MAP[key] || DEFAULT;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.cls} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 flex-none rounded-full ${s.dot}`} />}
      {prettyLabel(status)}
    </span>
  );
}
