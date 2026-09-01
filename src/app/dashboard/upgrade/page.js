'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import { PLANS, PLAN_ORDER } from '@/lib/plans';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { CreditCardIcon } from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import {
  startPlanCheckout,
  getPlanPaymentStatus,
} from '@/lib/api/routes/subscription';

// WhatsApp de Pegazo para cotizar/cambiar de plan (mismo del sitio público).
const WHATSAPP = '573186356609';

function waUrl(text) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
}

// Ícono de WhatsApp (inline, sin dependencias externas).
function WhatsAppIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.767.967-.94 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

// Banner que aparece al volver de Wompi (?ref=...).
function ReturnBanner({ payment }) {
  if (!payment) return null;
  const map = {
    APPROVED: {
      cls: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      text: `¡Pago aprobado! Tu plan ${payment.plan} ya está activo.`,
    },
    PENDING: {
      cls: 'border-amber-200 bg-amber-50 text-amber-800',
      text: 'Estamos confirmando tu pago. En cuanto Wompi lo apruebe, tu plan se activa automáticamente.',
    },
    DECLINED: {
      cls: 'border-red-200 bg-red-50 text-red-800',
      text: 'El pago fue rechazado. Puedes intentarlo de nuevo o escribirnos por WhatsApp.',
    },
  };
  const s = map[payment.status] || map.PENDING;
  return (
    <div className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${s.cls}`}>
      {s.text}
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={null}>
      <UpgradeInner />
    </Suspense>
  );
}

function UpgradeInner() {
  const { usuario } = useAuth();
  const company = usuario?.company;
  const currentPlan = company?.plan || null;
  const currentRank = currentPlan ? PLAN_ORDER.indexOf(currentPlan) : -1;
  const nombre = company?.name || 'mi negocio';

  const params = useSearchParams();
  const [payment, setPayment] = useState(null); // { plan, status }
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState('');

  // Al volver de Wompi, consulta el estado del pago (el webhook lo confirma).
  useEffect(() => {
    const ref = params.get('ref');
    if (!ref) return;
    getPlanPaymentStatus(ref)
      .then((res) => setPayment(res?.data || null))
      .catch(() => {});
  }, [params]);

  const pay = async (planId) => {
    setPayingId(planId);
    setError('');
    try {
      const res = await startPlanCheckout(planId);
      const url = res?.data?.checkoutUrl;
      if (url) {
        window.location.href = url;
        return;
      }
      setError('No se pudo iniciar el pago. Intenta de nuevo.');
    } catch (e) {
      // 503 cuando la pasarela aún no está configurada: mensaje claro + WhatsApp.
      setError(
        e?.message ||
          'Los pagos en línea aún no están activos. Escríbenos por WhatsApp para activar tu plan.',
      );
    } finally {
      setPayingId(null);
    }
  };

  const cotizarGeneral = waUrl(
    `Hola, soy de "${nombre}"${
      currentPlan ? ` (plan actual: ${currentPlan})` : ''
    } y quiero cotizar un cambio/mejora de mi plan de Pegazo.`,
  );

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="w-full">
        <ReturnBanner payment={payment} />

        {/* Encabezado + plan actual */}
        <div className="mb-6 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Mi plan</h1>
              <p className="mt-1 text-sm text-gray-600">
                {currentPlan ? (
                  <>
                    Tu plan actual es{' '}
                    <span className="font-semibold text-orange-600">
                      {currentPlan}
                    </span>
                    . Mejóralo cuando quieras: el pago es en línea y seguro con
                    Wompi.
                  </>
                ) : (
                  <>Elige el plan a la medida de tu negocio y págalo en línea.</>
                )}
              </p>
            </div>
            <a
              href={cotizarGeneral}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-none cursor-pointer items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              <WhatsAppIcon />
              ¿Dudas? WhatsApp
            </a>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          Planes de Pegazo
        </h2>
        <p className="mb-5 text-sm text-gray-500">
          Paga en línea con Wompi (tarjeta, PSE, Nequi…) y tu plan se activa al
          instante. También puedes escribirnos por WhatsApp.
        </p>

        <div className="grid items-start gap-5 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const rank = PLAN_ORDER.indexOf(plan.id);
            const isCurrent = currentPlan === plan.id;
            const isUpgrade = currentRank >= 0 && rank > currentRank;
            const isFree = (plan.priceMonthly || 0) <= 0;

            const cotizarPlan = waUrl(
              `Hola, soy de "${nombre}"${
                currentPlan ? ` (plan actual: ${currentPlan})` : ''
              } y quiero el plan ${plan.name} de Pegazo.`,
            );

            return (
              <div
                key={plan.id}
                className={`relative flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                  isCurrent
                    ? 'border-orange-500 ring-2 ring-orange-500'
                    : plan.highlight
                      ? 'border-orange-300'
                      : 'border-gray-200'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white">
                    Tu plan actual
                  </span>
                )}

                <div className="text-2xl">{plan.emoji}</div>
                <h3 className="mt-1 text-lg font-bold text-gray-900">
                  {plan.name}
                </h3>
                <p className="text-xs text-gray-500">{plan.tagline}</p>

                <div className="mt-3">
                  <span className="text-2xl font-bold text-gray-900">
                    {plan.priceLabel}
                  </span>
                  {plan.priceSuffix && (
                    <span className="text-sm text-gray-400">
                      {plan.priceSuffix}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full cursor-default rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-600"
                    >
                      Plan actual
                    </button>
                  ) : isFree ? (
                    <a
                      href={cotizarPlan}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                      <WhatsAppIcon />
                      Consultar
                    </a>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => pay(plan.id)}
                        disabled={payingId === plan.id}
                        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
                      >
                        <CreditCardIcon className="h-4 w-4" />
                        {payingId === plan.id
                          ? 'Redirigiendo…'
                          : isUpgrade
                            ? `Mejorar a ${plan.name}`
                            : `Pagar ${plan.priceLabel}`}
                      </button>
                      <a
                        href={cotizarPlan}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 text-xs font-medium text-green-700 hover:underline"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                        o cotizar por WhatsApp
                      </a>
                    </div>
                  )}
                </div>

                <ul className="mt-5 space-y-2 border-t border-gray-100 pt-4">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-none text-orange-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Pagos procesados de forma segura por Wompi. Al aprobarse, tu plan se
          activa automáticamente por 30 días.
        </p>
      </div>
    </RoleGuard>
  );
}
