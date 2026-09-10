'use client';

import { useRouter } from 'next/navigation';
import {
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

// Asistente de bienvenida para el primer ingreso de un negocio nuevo. Muestra
// los primeros pasos (ya adaptados a la terminología del tipo de negocio) y
// lleva al dueño al primero que falta. Se muestra una sola vez por empresa.
export default function WelcomeWizard({ open, steps = [], companyName, onClose }) {
  const router = useRouter();
  if (!open) return null;

  const firstPending = steps.find((s) => !s.done) || steps[0];
  const start = () => {
    onClose?.();
    if (firstPending?.href) router.push(firstPending.href);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5">
          <div className="flex items-center gap-2 text-white">
            <SparklesIcon className="h-6 w-6" />
            <h2 className="text-lg font-bold">¡Bienvenido a Pegazo!</h2>
          </div>
          <p className="mt-1 text-sm text-white/90">
            {companyName ? `${companyName}, ` : ''}ya dejamos Pegazo adaptado a tu
            negocio. Empieza con estos pasos:
          </p>
        </div>

        <div className="space-y-2 px-6 py-5">
          {steps.map((s, i) => (
            <div
              key={s.label}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                s.done
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <span className="flex items-center gap-3 text-sm font-medium text-gray-800">
                {s.done ? (
                  <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                    {i + 1}
                  </span>
                )}
                <span className={s.done ? 'text-gray-400 line-through' : ''}>
                  {s.label}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Explorar por mi cuenta
          </button>
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Empezar ahora <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
