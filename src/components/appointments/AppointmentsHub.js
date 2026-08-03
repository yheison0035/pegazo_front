'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BellIcon,
  BellAlertIcon,
  XMarkIcon,
  ClockIcon,
  ScissorsIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import { getAppointmentsAgenda } from '@/lib/api/routes/appointments';
import {
  usesAppointments,
  colombiaToday,
  timeUntilLabel,
} from '@/lib/appointmentsAccess';
import { statusMeta } from '@/lib/appointmentStatus';
import WhatsappLink from '@/components/dashboard/tables/segments/contentData/whatsappLink';
import AgendaModal from './AgendaModal';

const TWO_HOURS = 2 * 3600 * 1000;
const ACTIVE = ['PENDIENTE', 'CONFIRMADA', 'EN_PROCESO'];
const POLL_MS = 60 * 1000; // refresca la agenda cada 60 s (respaldo)
const TICK_MS = 30 * 1000; // recalcula recordatorios cada 30 s

// localStorage helpers (tolerantes a SSR / modo privado)
const lsGet = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const lsSet = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignora */
  }
};

export default function AppointmentsHub() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const enabled = usesAppointments(usuario);
  const companyId = usuario?.company?.id ?? usuario?.companyId ?? 'x';
  const day = colombiaToday();

  const [agenda, setAgenda] = useState({ today: [], tomorrow: [] });
  const [now, setNow] = useState(() => Date.now());
  const [bellOpen, setBellOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState([]);
  const [toasts, setToasts] = useState([]);

  const modalCheckedRef = useRef(false);
  const toastedRef = useRef([]);

  // Carga inicial de flags persistidos del día.
  useEffect(() => {
    if (!enabled) return;
    setDismissed(lsGet(`pegazo:rem-dismissed:${companyId}:${day}`, []));
    toastedRef.current = lsGet(`pegazo:rem-toasted:${companyId}:${day}`, []);
  }, [enabled, companyId, day]);

  const fetchAgenda = useCallback(async () => {
    try {
      const res = await getAppointmentsAgenda();
      const data = res?.data || { today: [], tomorrow: [] };
      setAgenda({
        today: data.today || [],
        tomorrow: data.tomorrow || [],
      });

      // Modal de inicio: se muestra una vez por sesión (cada vez que se inicia
      // sesión vuelve a aparecer; al refrescar no se repite). La marca se borra
      // en el logout (authContext).
      if (!modalCheckedRef.current) {
        modalCheckedRef.current = true;
        const total = (data.today?.length || 0) + (data.tomorrow?.length || 0);
        let alreadyShown = false;
        try {
          alreadyShown = sessionStorage.getItem('pegazo:agenda-shown') === '1';
        } catch {
          /* ignora */
        }
        if (total > 0 && !alreadyShown) {
          setShowModal(true);
        }
      }
    } catch {
      /* silencioso: no romper el dashboard por la agenda */
    }
  }, [companyId, day]);

  // Polling de agenda + tick de tiempo.
  useEffect(() => {
    if (!enabled) return;
    fetchAgenda();
    const poll = setInterval(fetchAgenda, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [enabled, fetchAgenda]);

  // Refresco inmediato al crear / editar / eliminar una cita (y al volver a la
  // pestaña), para que campana, toasts y modal estén siempre al día.
  useEffect(() => {
    if (!enabled) return;
    const onChange = () => fetchAgenda();
    const onFocus = () => {
      if (document.visibilityState === 'visible') fetchAgenda();
    };
    window.addEventListener('pegazo:appointments-changed', onChange);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('pegazo:appointments-changed', onChange);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [enabled, fetchAgenda]);

  // Poda los toasts de citas que ya no existen en la agenda (eliminadas o
  // canceladas): el toast no debe sobrevivir a su cita.
  useEffect(() => {
    const ids = new Set(
      [...(agenda.today || []), ...(agenda.tomorrow || [])].map((a) => a.id)
    );
    setToasts((prev) => prev.filter((t) => ids.has(t.id)));
  }, [agenda]);

  const closeModal = () => {
    setShowModal(false);
    try {
      sessionStorage.setItem('pegazo:agenda-shown', '1');
    } catch {
      /* ignora */
    }
  };

  // Recordatorios activos: citas que empiezan dentro de las próximas 2 h,
  // aún no comenzadas, en estado activo y no descartadas por el usuario.
  const reminders = useMemo(() => {
    const all = [...(agenda.today || []), ...(agenda.tomorrow || [])];
    return all
      .filter((a) => ACTIVE.includes(a.status))
      .map((a) => ({ ...a, startMs: new Date(a.startAt).getTime() }))
      .filter(
        (a) =>
          a.startMs > now &&
          a.startMs - now <= TWO_HOURS &&
          !dismissed.includes(a.id)
      )
      .sort((a, b) => a.startMs - b.startMs);
  }, [agenda, now, dismissed]);

  // Dispara un toast la primera vez que una cita entra en la ventana de 2 h.
  useEffect(() => {
    if (!enabled || reminders.length === 0) return;
    const fresh = reminders.filter((r) => !toastedRef.current.includes(r.id));
    if (fresh.length === 0) return;

    setToasts((prev) => {
      const existing = new Set(prev.map((t) => t.id));
      const add = fresh.filter((r) => !existing.has(r.id));
      return [...prev, ...add];
    });

    toastedRef.current = [
      ...toastedRef.current,
      ...fresh.map((r) => r.id),
    ];
    lsSet(`pegazo:rem-toasted:${companyId}:${day}`, toastedRef.current);
  }, [reminders, enabled, companyId, day]);

  const dismissToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const dismissReminder = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    lsSet(`pegazo:rem-dismissed:${companyId}:${day}`, next);
    dismissToast(id);
  };

  if (!enabled) return null;

  const count = reminders.length;

  return (
    <>
      {/* Campana flotante */}
      <div className="fixed right-3 top-3 z-40 md:right-6 md:top-4">
        <button
          onClick={() => setBellOpen((v) => !v)}
          className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50 ${
            count > 0 ? 'text-gray-700' : 'text-gray-500'
          }`}
          aria-label="Recordatorios de citas"
        >
          {count > 0 ? (
            <BellAlertIcon className="h-5 w-5" />
          ) : (
            <BellIcon className="h-5 w-5" />
          )}
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
              {count}
            </span>
          )}
        </button>

        {bellOpen && (
          <>
            <div
              className="fixed inset-0 z-[-1]"
              onClick={() => setBellOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-sm font-bold text-gray-800">
                  Recordatorios
                </p>
                <p className="text-xs text-gray-500">
                  Citas en las próximas 2 horas
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {count === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-gray-400">
                    No hay citas próximas.
                  </p>
                ) : (
                  reminders.map((r) => (
                    <ReminderRow
                      key={r.id}
                      appt={r}
                      now={now}
                      onDismiss={() => dismissReminder(r.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toasts de recordatorio */}
      <div className="fixed bottom-4 right-4 z-[90] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <ReminderToast
            key={t.id}
            appt={t}
            now={now}
            onClose={() => dismissToast(t.id)}
          />
        ))}
      </div>

      {showModal && <AgendaModal agenda={agenda} onClose={closeModal} />}
    </>
  );
}

function ReminderRow({ appt, now, onDismiss }) {
  const s = statusMeta(appt.status);
  const startMs = new Date(appt.startAt).getTime();
  return (
    <div className="group flex items-start gap-2 rounded-xl px-2 py-2 hover:bg-gray-50">
      <span
        className={`mt-1 h-2 w-2 flex-none rounded-full ${s.dot}`}
        title={s.label}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">
            {appt.startTime}
          </span>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
            {timeUntilLabel(startMs - now)}
          </span>
        </div>
        <p className="truncate text-xs text-gray-600">
          {appt.service?.name}
          {appt.customer?.name ? ` · ${appt.customer.name}` : ''}
        </p>
        {appt.customer?.phone && (
          <div className="mt-1">
            <WhatsappLink phone={appt.customer.phone} className="text-[11px]" />
          </div>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="flex-none rounded-md p-1 text-gray-300 transition hover:bg-gray-100 hover:text-gray-500"
        aria-label="Descartar"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function ReminderToast({ appt, now, onClose }) {
  const startMs = new Date(appt.startAt).getTime();
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <BellAlertIcon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-800">
          Cita {timeUntilLabel(startMs - now)}
        </p>
        <p className="flex items-center gap-1 truncate text-xs text-gray-600">
          <ClockIcon className="h-3.5 w-3.5 flex-none" />
          {appt.startTime} · {appt.service?.name}
        </p>
        {appt.customer?.name && (
          <p className="flex items-center gap-1 truncate text-xs text-gray-500">
            <UserIcon className="h-3.5 w-3.5 flex-none" />
            {appt.customer.name}
          </p>
        )}
        {appt.barber?.name && (
          <p className="flex items-center gap-1 truncate text-xs text-gray-500">
            <ScissorsIcon className="h-3.5 w-3.5 flex-none" />
            {appt.barber.name}
          </p>
        )}
        {appt.customer?.phone && (
          <div className="mt-1">
            <WhatsappLink phone={appt.customer.phone} className="text-[11px]" />
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-none rounded-md p-1 text-gray-400 transition hover:bg-gray-100"
        aria-label="Cerrar"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
