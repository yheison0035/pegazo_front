'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDaysIcon,
  CheckIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/toastContext';
import { usesAppointments } from '@/lib/appointmentsAccess';
import {
  getRecentPendingAppointments,
  confirmAppointment,
} from '@/lib/api/routes/appointments';
import { chime, speak, primeAudio } from '@/lib/bankSound';

// Roles que gestionan/confirman citas (los que deben enterarse de una reserva
// nueva). El barbero ya recibe su propio push de cita asignada.
const MANAGER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA', 'COORDINADOR'];

const SEEN_KEY = 'apptNotifSeen';
const SEEN_WINDOW_MS = 20 * 60 * 1000; // recuerda lo anunciado por 20 min

function loadSeen() {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
    const now = Date.now();
    const clean = {};
    for (const [id, t] of Object.entries(raw)) {
      if (now - Number(t) < SEEN_WINDOW_MS) clean[id] = t;
    }
    return clean;
  } catch {
    return {};
  }
}
function saveSeen(map) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(map));
  } catch {
    /* noop */
  }
}

// Aviso por VOZ + tarjeta con "Ver" y "Confirmar" cuando entra una cita nueva
// (reserva online o creada por otra persona). Al confirmar, el backend le manda
// el correo de confirmación al cliente.
export default function AppointmentNotifier() {
  const { usuario } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [cards, setCards] = useState([]);
  const seen = useRef(null);

  const enabled =
    usesAppointments(usuario) && MANAGER_ROLES.includes(usuario?.role);

  // Desbloquea la voz en la primera interacción (política de autoplay).
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const unlock = () => primeAudio();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [enabled]);

  const dismiss = useCallback((id) => {
    setCards((list) => list.filter((c) => c.id !== id));
  }, []);

  const check = useCallback(async () => {
    try {
      const res = await getRecentPendingAppointments();
      const list = res?.data || [];
      if (!seen.current) seen.current = loadSeen();

      const nuevas = [];
      for (const a of list) {
        if (seen.current[a.id]) continue;
        seen.current[a.id] = Date.now();
        nuevas.push(a);
      }
      if (!nuevas.length) return;
      saveSeen(seen.current);

      // Se muestran todas como tarjetas; se anuncia por voz la más reciente.
      setCards((prev) => {
        const ids = new Set(prev.map((c) => c.id));
        const add = nuevas.filter((a) => !ids.has(a.id));
        return [...add, ...prev].slice(0, 4);
      });
      const n = nuevas[0];
      const cliente = n.customer?.name || 'un cliente';
      const servicio = n.service?.name ? `, ${n.service.name}` : '';
      chime();
      speak(`Nueva cita de ${cliente}${servicio}, a las ${n.startTime || ''}`);
    } catch {
      /* silencioso: reintenta en el siguiente ciclo */
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    check();
    const t = setInterval(() => {
      if (alive) check();
    }, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [enabled, check]);

  const onConfirm = async (card) => {
    setCards((list) =>
      list.map((c) => (c.id === card.id ? { ...c, busy: true } : c)),
    );
    try {
      await confirmAppointment(card.id);
      toast.show({
        type: 'success',
        title: 'Cita confirmada',
        message: 'Le avisamos al cliente por correo.',
      });
      dismiss(card.id);
    } catch (e) {
      toast.show({
        type: 'error',
        message: e?.message || 'No se pudo confirmar la cita.',
      });
      setCards((list) =>
        list.map((c) => (c.id === card.id ? { ...c, busy: false } : c)),
      );
    }
  };

  const onView = (card) => {
    dismiss(card.id);
    router.push('/dashboard/appointments');
  };

  if (!enabled || cards.length === 0) return null;

  const fmtDate = (d) => {
    try {
      return new Date(d).toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[100] flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {cards.map((card) => (
        <div
          key={card.id}
          className="rounded-2xl border border-gray-100 border-l-4 border-l-orange-500 bg-white p-3.5 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <CalendarDaysIcon className="mt-0.5 h-6 w-6 flex-none text-orange-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-800">Nueva cita</p>
              <p className="mt-0.5 truncate text-sm text-gray-700">
                {card.customer?.name || 'Sin cliente'}
              </p>
              <p className="truncate text-xs text-gray-400">
                {card.service?.name || 'Servicio'}
                {' · '}
                {fmtDate(card.date)} {card.startTime}
                {card.barber?.name ? ` · ${card.barber.name}` : ''}
              </p>
            </div>
            <button
              onClick={() => dismiss(card.id)}
              className="flex-none text-gray-300 transition hover:text-gray-600"
              aria-label="Cerrar"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onView(card)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:text-orange-600"
            >
              <EyeIcon className="h-4 w-4" /> Ver
            </button>
            <button
              type="button"
              onClick={() => onConfirm(card)}
              disabled={card.busy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              <CheckIcon className="h-4 w-4" /> {card.busy ? 'Confirmando…' : 'Confirmar'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
