'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  XMarkIcon,
  CheckCircleIcon,
  LockClosedIcon,
} from '@heroicons/react/24/solid';
import { PLAN_UPGRADE_EVENT } from '@/lib/planUpgrade';
import { getPlan } from '@/lib/plans';

// Modal global "Mejora tu plan". Se monta una vez (en el layout del dashboard) y
// se abre al recibir el evento pegazo:plan-upgrade (menú bloqueado o 403 de plan).
export default function PlanUpgradeModal() {
  const [detail, setDetail] = useState(null);

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
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-lg font-bold text-neutral-900">
                    {plan.emoji} Plan {plan.name}
                  </p>
                  <p className="text-sm text-neutral-500">{plan.tagline}</p>
                </div>
                <p className="text-xl font-extrabold text-neutral-900">
                  {plan.priceLabel}
                  <span className="text-xs font-normal text-neutral-500">
                    {plan.priceSuffix}
                  </span>
                </p>
              </div>
              <ul className="mt-4 space-y-2">
                {plan.features.slice(0, 5).map((f) => (
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
            <button
              onClick={close}
              className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Ahora no
            </button>
            <Link
              href="/dashboard/upgrade"
              onClick={close}
              className="flex-1 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 py-2.5 text-center text-sm font-semibold text-white hover:opacity-90"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
