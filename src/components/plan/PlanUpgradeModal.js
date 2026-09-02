'use client';

import { useEffect, useState } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  LockClosedIcon,
} from '@heroicons/react/24/solid';
import Button from '@/components/ui/Button';
import { PLAN_UPGRADE_EVENT } from '@/lib/planUpgrade';
import { getPlan } from '@/lib/plans';
import { useAuth } from '@/context/authContext';
import { planFeaturesForType } from '@/config/planFeaturesByType';

// Modal global "Mejora tu plan". Se monta una vez (en el layout del dashboard) y
// se abre al recibir el evento pegazo:plan-upgrade (menú bloqueado o 403 de plan).
export default function PlanUpgradeModal() {
  const [detail, setDetail] = useState(null);
  const { usuario } = useAuth();

  useEffect(() => {
    const handler = (e) => setDetail(e.detail || {});
    window.addEventListener(PLAN_UPGRADE_EVENT, handler);
    return () => window.removeEventListener(PLAN_UPGRADE_EVENT, handler);
  }, []);

  if (!detail) return null;

  const plan = getPlan(detail.requiredPlan);
  const close = () => setDetail(null);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={close}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-orange-600 to-amber-500 p-6 text-white">
          <button
            onClick={close}
            className="absolute right-4 top-4 text-white/80 hover:text-white"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <LockClosedIcon className="h-8 w-8" />
          <h2 className="mt-2 text-xl font-bold">Mejora tu plan</h2>
          <p className="mt-1 text-sm text-white/90">
            {detail.message ||
              (detail.featureName
                ? `"${detail.featureName}" está disponible en un plan superior.`
                : 'Esta función requiere un plan superior.')}
          </p>
        </div>

        <div className="p-6">
          {plan ? (
            <>
              <div>
                <p className="text-lg font-bold text-neutral-900">
                  {plan.emoji} Plan {plan.name}
                </p>
                <p className="text-sm text-neutral-500">{plan.tagline}</p>
              </div>
              <ul className="mt-4 space-y-2">
                {planFeaturesForType(plan.id, usuario?.company?.type)
                  .filter((f) => !f.startsWith('Todo lo de'))
                  .slice(0, 5)
                  .map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-neutral-600"
                  >
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-none text-orange-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-neutral-600">
              Contacta a soporte para ampliar tu plan.
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={close}>
              Ahora no
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              href="/dashboard/upgrade"
              onClick={close}
            >
              Ver planes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
