'use client';

// Muro de BIENVENIDA / adaptación. Mientras solo ORBITA esté disponible, toda
// empresa con un plan distinto (o sin plan) ve ÚNICAMENTE esta pantalla al
// entrar: ningún módulo. El mensaje deja claro que nuestro objetivo es que
// Pegazo se adapte al negocio (no al revés) y ofrece unos días gratis de prueba
// —que la plataforma concede con el botón "Días gratis" (fija paidUntil a
// futuro)— para que el negocio funcione con normalidad mientras lo adaptamos.
// Se quita solo cuando la empresa pasa a ORBITA o tiene días gratis vigentes.
// El backend refuerza el bloqueo (SubscriptionInterceptor → PLAN_LOCKED).

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/authContext';
import { getPlatformPaymentSettings } from '@/lib/api/routes/platformPayment';
import {
  SparklesIcon,
  GiftIcon,
  ChatBubbleLeftRightIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

// Único plan disponible hoy. Debe coincidir con el backend (ACTIVE_PLAN) y con
// lib/plans.js (el único sin `comingSoon`).
const ACTIVE_PLAN = 'ORBITA';

// WhatsApp de respaldo si la plataforma aún no configuró su número.
const FALLBACK_WA = '573186356609';

// Día(s) de gracia (calendario) — IGUAL que el backend y PaymentWall. Mientras
// haya días gratis vigentes (paidUntil + gracia >= hoy), el negocio trabaja
// normal y este muro NO aparece.
const GRACE_DAYS = 1;
function hasActiveFreeWindow(paidUntil) {
  if (!paidUntil) return false;
  const base = new Date(paidUntil);
  if (Number.isNaN(base.getTime())) return false;
  base.setUTCDate(base.getUTCDate() + GRACE_DAYS);
  const deadlineYmd = base.toISOString().slice(0, 10);
  let todayYmd;
  try {
    todayYmd = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Bogota',
    });
  } catch {
    todayYmd = new Date().toISOString().slice(0, 10);
  }
  return todayYmd <= deadlineYmd;
}

export default function PlanWall() {
  const { usuario, logout } = useAuth();
  const [settings, setSettings] = useState(null);

  const company = usuario?.company;
  const isPlatform = usuario?.role === 'SUPER_PLATFORM_ADMIN';
  // IMPORTANTE: el modo soporte (impersonación) NO se exime: debe ver EXACTAMENTE
  // lo mismo que el dueño. Para configurar una empresa bloqueada, primero se le
  // dan días gratis desde la plataforma y luego se entra en soporte (ya sin muro).
  // Solo evaluamos con el perfil completo (/auth/me trae la clave `plan`); el
  // shape del login no la incluye y no debe disparar el muro por un instante.
  const hasProfile = !!company && 'plan' in company;
  const blocked =
    !isPlatform &&
    hasProfile &&
    company.plan !== ACTIVE_PLAN &&
    !hasActiveFreeWindow(company.paidUntil);

  useEffect(() => {
    if (!blocked) return;
    getPlatformPaymentSettings()
      .then((r) => setSettings(r?.data || null))
      .catch(() => {});
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [blocked]);

  if (!blocked) return null;

  const wa = (settings?.whatsappNumber || '').replace(/\D/g, '') || FALLBACK_WA;
  const waMsg = `Hola, soy de "${company?.name || ''}" y quiero que adapten Pegazo a mi negocio. Me gustaría unos días gratis para probarlo.`;
  const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent(waMsg)}`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-slate-900/90 p-4 backdrop-blur-sm">
      <div className="my-6 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Cabecera — tono de bienvenida, no de error */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <SparklesIcon className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold">
            Pegazo se adapta a tu negocio
          </h2>
          <p className="mt-1 text-sm text-white/85">
            {company?.name
              ? `Hola, ${company.name}.`
              : 'Hola.'}{' '}
            Estamos preparando tu cuenta.
          </p>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-sm leading-relaxed text-gray-700">
            Nuestro mayor objetivo es que{' '}
            <b>Pegazo se adapte a tu negocio, no tu negocio a Pegazo</b>. Por eso,
            antes de activarte, queremos conocerte y dejar el CRM listo a tu
            medida.
          </p>

          {/* Oferta de días gratis */}
          <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <GiftIcon className="mt-0.5 h-6 w-6 flex-none text-indigo-600" />
            <div className="text-sm text-indigo-900">
              <p className="font-semibold">¿Quieres probarlo ya?</p>
              <p className="mt-0.5">
                Te <b>obsequiamos unos días gratis</b> para que tu negocio
                funcione con normalidad en el CRM mientras lo adaptamos a lo que
                necesitas.
              </p>
            </div>
          </div>

          {/* Qué gana al escribir */}
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
            <WrenchScrewdriverIcon className="mt-0.5 h-6 w-6 flex-none text-gray-500" />
            <p className="text-sm text-gray-600">
              Al escribirnos recibes una <b>mejor asesoría</b> y nuestro equipo{' '}
              <b>adapta el CRM a tu negocio</b> paso a paso.
            </p>
          </div>

          {/* Acciones */}
          <div className="space-y-2 pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              Hablar con un asesor por WhatsApp
            </a>
            <button
              onClick={logout}
              className="w-full rounded-xl px-4 py-2 text-sm font-medium text-gray-400 transition hover:text-gray-600"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
