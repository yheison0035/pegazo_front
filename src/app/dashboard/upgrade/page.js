'use client';

import { useState } from 'react';
import { useAuth } from '@/context/authContext';
import { PLANS, PLAN_ORDER } from '@/lib/plans';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import AlertModal from '@/components/dashboard/modals/alertModal';
import Button from '@/components/ui/Button';
import RoleGuard from '@/auth/roleGuard';
import { startPlanCheckout } from '@/lib/api/routes/subscription';

export default function UpgradePage() {
  const { usuario } = useAuth();
  const currentPlan = usuario?.company?.plan || null;
  const currentRank = currentPlan ? PLAN_ORDER.indexOf(currentPlan) : -1;
  const [alert, setAlert] = useState({});
  const [loading, setLoading] = useState('');

  const handleUpgrade = async (planId) => {
    setLoading(planId);
    try {
      // Deja iniciada la compra del plan. El pago en línea (Wompi) se activará
      // aquí cuando encendamos pagos; por ahora deja la solicitud registrada.
      const res = await startPlanCheckout(planId);
      if (res?.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }
      setAlert({
        type: 'success',
        message:
          res?.message ||
          `Solicitud de mejora al plan ${planId} registrada. Te contactaremos para activarlo.`,
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'No se pudo iniciar la mejora de plan.',
      });
    } finally {
      setLoading('');
    }
  };

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Planes y suscripción
        </h1>
        <p className="text-sm text-gray-500">
          {currentPlan
            ? `Tu plan actual es ${currentPlan}. Puedes cambiarlo cuando lo necesites.`
            : 'Elige el plan que mejor se ajuste a tu negocio.'}
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const rank = PLAN_ORDER.indexOf(plan.id);
          const isCurrent = currentPlan === plan.id;
          const isLower = currentRank >= 0 && rank < currentRank;
          const isUpgrade = currentRank >= 0 && rank > currentRank;

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
                <span className="text-2xl font-extrabold text-gray-900">
                  {plan.priceLabel}
                </span>
                <span className="text-xs text-gray-500">{plan.priceSuffix}</span>
              </div>

              <div className="mt-4">
                {isCurrent ? (
                  <Button variant="soft" disabled fullWidth>
                    Plan actual
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => handleUpgrade(plan.id)}
                    loading={loading === plan.id}
                  >
                    {loading === plan.id ? 'Procesando...' : `Mejorar a ${plan.name}`}
                  </Button>
                ) : isLower ? (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => handleUpgrade(plan.id)}
                    loading={loading === plan.id}
                  >
                    {loading === plan.id ? 'Procesando...' : `Cambiar a ${plan.name}`}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => handleUpgrade(plan.id)}
                    loading={loading === plan.id}
                  >
                    {loading === plan.id ? 'Procesando...' : 'Elegir'}
                  </Button>
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
        Los pagos en línea se procesarán de forma segura con Wompi. Precios en
        pesos colombianos (COP).
      </p>

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({})}
      />
    </div>
    </RoleGuard>
  );
}
