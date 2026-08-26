'use client';

import Link from 'next/link';
import {
  XMarkIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

// Citas de HOY del barbero (las que ya vienen filtradas a su nombre).
export default function TodayAppointmentsModal({ items = [], onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-6 w-6" />
            <div>
              <h3 className="text-base font-bold leading-tight">
                Mis citas de hoy
              </h3>
              <p className="text-xs text-white/85">
                {items.length}{' '}
                {items.length === 1 ? 'cita' : 'citas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/80 hover:bg-white/15 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No tienes citas para hoy.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-gray-800">
                      {a.startTime || '—'}
                    </span>
                    {a.status && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                        {a.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-700">
                    {a.customer?.name || 'Cliente'}
                  </p>
                  {a.service?.name && (
                    <p className="text-xs text-gray-400">{a.service.name}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-3 text-right">
          <Link
            href="/dashboard/appointments"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg bg-gray-800 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700"
          >
            Ver todas mis citas <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
