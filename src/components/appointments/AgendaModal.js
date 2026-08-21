'use client';

import {
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  ScissorsIcon,
  UserIcon,
  BuildingStorefrontIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import ConfirmClientButton from './ConfirmClientButton';
import { statusMeta } from '@/lib/appointmentStatus';

function AppointmentRow({ appt }) {
  const s = statusMeta(appt.status);
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#111827] px-2 py-1 text-xs font-bold text-white">
            <ClockIcon className="h-3.5 w-3.5" />
            {appt.startTime}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.chip}`}
          >
            {s.label}
          </span>
        </div>

        <p className="mt-1.5 flex items-center gap-1.5 truncate text-sm font-semibold text-gray-800">
          <ScissorsIcon className="h-4 w-4 flex-none text-gray-400" />
          {appt.service?.name || 'Servicio'}
        </p>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
          {appt.customer?.name && (
            <span className="inline-flex items-center gap-1">
              <UserIcon className="h-3.5 w-3.5" />
              {appt.customer.name}
            </span>
          )}
          {appt.barber?.name && (
            <span className="inline-flex items-center gap-1">
              <ScissorsIcon className="h-3.5 w-3.5" />
              {appt.barber.name}
            </span>
          )}
          {appt.local?.name && (
            <span className="inline-flex items-center gap-1">
              <BuildingStorefrontIcon className="h-3.5 w-3.5" />
              {appt.local.name}
            </span>
          )}
        </div>
      </div>

      {appt.customer?.phone && (
        <div className="flex-none">
          <ConfirmClientButton appt={appt} />
        </div>
      )}
    </div>
  );
}

function Section({ title, list, emptyText, accent }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <span className={`h-2 w-2 rounded-full ${accent}`} />
          {title}
        </h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
          {list.length}
        </span>
      </div>
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 py-4 text-center text-xs text-gray-400">
          {emptyText}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((a) => (
            <AppointmentRow key={a.id} appt={a} />
          ))}
        </div>
      )}
    </div>
  );
}

// Modal que se muestra al iniciar sesión con el resumen de citas de hoy y mañana.
export default function AgendaModal({ agenda, onClose }) {
  const today = agenda?.today || [];
  const tomorrow = agenda?.tomorrow || [];
  const total = today.length + tomorrow.length;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-none bg-gradient-to-br from-slate-800 to-slate-700 p-5 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/70 transition hover:text-white"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/90">
            <CalendarDaysIcon className="h-5 w-5" />
          </div>
          <h2 className="mt-2 text-lg font-bold">Tu agenda</h2>
          <p className="text-sm text-white/80">
            {total > 0
              ? `Tienes ${total} cita${total === 1 ? '' : 's'} entre hoy y mañana.`
              : 'No tienes citas para hoy ni mañana.'}
          </p>
        </div>

        {total > 0 && (
          <div className="flex flex-none items-start gap-2 border-b border-amber-100 bg-amber-50 px-5 py-3">
            <ExclamationCircleIcon className="mt-0.5 h-5 w-5 flex-none text-amber-500" />
            <p className="text-sm font-medium text-amber-800">
              No olvides confirmar cada cita con el cliente.
            </p>
          </div>
        )}

        <div className="flex-1 space-y-5 overflow-y-auto bg-gray-50 p-5">
          <Section
            title="Hoy"
            list={today}
            emptyText="Sin citas para hoy."
            accent="bg-orange-500"
          />
          <Section
            title="Mañana"
            list={tomorrow}
            emptyText="Sin citas para mañana."
            accent="bg-blue-500"
          />
        </div>

        <div className="flex-none border-t border-gray-100 bg-white p-4">
          <Button variant="primary" fullWidth onClick={onClose}>
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
