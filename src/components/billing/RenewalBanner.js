'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/authContext';

// Número de WhatsApp de Pegazo para renovar/cotizar (mismo del sitio público).
const WHATSAPP = '573186356609';

// Solo el dueño/administrador de la empresa gestiona el pago. Los demás roles
// (cajero, barbero, mesero…) no ven el aviso de renovación.
const OWNER_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

// Días de anticipación con los que empezamos a avisar que el plan va a vencer.
const WARN_DAYS = 7;

// Diferencia en días (redondeada hacia arriba) entre hoy y una fecha.
function daysUntil(dateStr) {
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  // Comparamos por día calendario (ignorando la hora).
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatCOP(value) {
  if (value == null || value === '') return null;
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `$${value}`;
  }
}

export default function RenewalBanner() {
  const { usuario } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const company = usuario?.company;
  const paidUntil = company?.paidUntil;
  const role = usuario?.role;

  // Clave de descarte por fecha de vencimiento: si el dueño cierra el aviso, no
  // se vuelve a mostrar por ESA misma fecha (al renovar cambia y reaparece).
  const dismissKey = paidUntil ? `pegazo_renewal_dismissed_${paidUntil}` : '';

  useEffect(() => {
    if (!dismissKey) return;
    try {
      setDismissed(localStorage.getItem(dismissKey) === '1');
    } catch {
      setDismissed(false);
    }
  }, [dismissKey]);

  if (!company || !paidUntil) return null;
  if (!OWNER_ROLES.has(role)) return null;

  const days = daysUntil(paidUntil);
  if (days == null) return null;

  const isExpired = days < 0;
  const isSoon = days >= 0 && days <= WARN_DAYS;

  // Fuera de la ventana de aviso: no molestamos.
  if (!isExpired && !isSoon) return null;
  // El "por vencer" se puede descartar; el "vencido" siempre se muestra.
  if (isSoon && dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      if (dismissKey) localStorage.setItem(dismissKey, '1');
    } catch {
      /* almacenamiento no disponible: se ignora */
    }
  };

  // Precio a comunicar en el mensaje (con o sin descuento vigente).
  const price = formatCOP(company.monthlyPrice);

  const nombre = company.name || 'mi negocio';
  const waText = isExpired
    ? `Hola, soy de "${nombre}" y quiero renovar mi plan de Pegazo (venció el ${formatDate(paidUntil)}).`
    : `Hola, soy de "${nombre}" y quiero renovar mi plan de Pegazo antes de que venza (${formatDate(paidUntil)}).`;
  const waUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(waText)}`;

  // Paleta según urgencia.
  const styles = isExpired
    ? {
        wrap: 'border-red-300 bg-red-50 text-red-900',
        icon: 'text-red-600',
        btn: 'bg-red-600 hover:bg-red-700',
      }
    : {
        wrap: 'border-amber-300 bg-amber-50 text-amber-900',
        icon: 'text-amber-600',
        btn: 'bg-amber-500 hover:bg-amber-600',
      };

  const titulo = isExpired
    ? 'Tu plan venció'
    : days === 0
      ? 'Tu plan vence hoy'
      : `Tu plan vence en ${days} ${days === 1 ? 'día' : 'días'}`;

  const detalle = isExpired
    ? `Se venció el ${formatDate(paidUntil)}. Renueva para no perder el acceso a tu negocio.`
    : `Vence el ${formatDate(paidUntil)}. Renueva a tiempo para no interrumpir tu operación${price ? ` (${price}/mes)` : ''}.`;

  return (
    <div
      className={`mb-5 flex flex-col gap-3 rounded-2xl border px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between ${styles.wrap}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <svg
          className={`mt-0.5 h-6 w-6 flex-none ${styles.icon}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m0 3.75h.008M10.34 3.94l-8.02 13.9A1.5 1.5 0 003.62 20.1h16.76a1.5 1.5 0 001.3-2.26l-8.02-13.9a1.5 1.5 0 00-2.62 0z"
          />
        </svg>
        <div>
          <p className="text-sm font-bold">{titulo}</p>
          <p className="text-sm opacity-90">{detalle}</p>
        </div>
      </div>

      <div className="flex flex-none items-center gap-2 self-end sm:self-auto">
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${styles.btn}`}
        >
          <svg
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.767.967-.94 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          Renovar por WhatsApp
        </a>
        {isSoon && (
          <button
            type="button"
            onClick={dismiss}
            className="cursor-pointer rounded-lg p-2 text-current/60 transition hover:bg-black/5"
            aria-label="Ocultar aviso"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
