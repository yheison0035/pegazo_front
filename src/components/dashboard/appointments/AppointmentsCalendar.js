'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  MoonIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import { getAppointmentsMonth } from '@/lib/api/routes/appointments';
import { getRestDays, getMyRestDays } from '@/lib/api/routes/restDays';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WD = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Colores por estado de la cita.
const STATUS = {
  PENDIENTE: { dot: 'bg-amber-400', chip: 'border-l-amber-400', label: 'Pendiente' },
  CONFIRMADA: { dot: 'bg-blue-500', chip: 'border-l-blue-500', label: 'Confirmada' },
  EN_PROCESO: { dot: 'bg-indigo-500', chip: 'border-l-indigo-500', label: 'En proceso' },
  COMPLETADA: { dot: 'bg-emerald-500', chip: 'border-l-emerald-500', label: 'Completada' },
  CANCELADA: { dot: 'bg-gray-300', chip: 'border-l-gray-300', label: 'Cancelada' },
  NO_ASISTIO: { dot: 'bg-red-500', chip: 'border-l-red-500', label: 'No asistió' },
};
const st = (s) => STATUS[s] || STATUS.PENDIENTE;

function todayStr() {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}
function grid(y, m) {
  const startDow = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++)
    cells.push({
      d,
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  return cells;
}
const firstName = (n) => (n || '').split(' ')[0] || '—';

export default function AppointmentsCalendar() {
  const { usuario } = useAuth();
  const isBarber = ['BARBERO', 'PROFESIONAL'].includes(usuario?.role);

  const [cal, setCal] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [appts, setAppts] = useState([]);
  const [barberId, setBarberId] = useState('');
  const [rest, setRest] = useState(null); // {restWeekdays, timeOff} del barbero elegido
  const [loading, setLoading] = useState(false);
  const [dayOpen, setDayOpen] = useState(null); // dateStr

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getAppointmentsMonth({
        year: cal.y,
        month: cal.m,
        ...(barberId ? { barberId } : {}),
      });
      setAppts(r?.data || []);
    } catch {
      setAppts([]);
    } finally {
      setLoading(false);
    }
  }, [cal, barberId]);

  useEffect(() => {
    load();
  }, [load]);

  // Descansos del barbero en contexto (barbero: los suyos; admin: el elegido).
  useEffect(() => {
    if (isBarber) {
      getMyRestDays().then((r) => setRest(r?.data || null)).catch(() => setRest(null));
    } else if (barberId) {
      getRestDays(barberId).then((r) => setRest(r?.data || null)).catch(() => setRest(null));
    } else {
      setRest(null);
    }
  }, [isBarber, barberId]);

  // Agrupa citas por día (YYYY-MM-DD).
  const byDay = useMemo(() => {
    const map = {};
    for (const a of appts) {
      const key = String(a.date).slice(0, 10);
      (map[key] = map[key] || []).push(a);
    }
    return map;
  }, [appts]);

  // Opciones de barbero: derivadas de las citas del mes (sin endpoint extra).
  const barberOptions = useMemo(() => {
    const m = new Map();
    for (const a of appts) if (a.barber) m.set(a.barber.id, a.barber.name);
    return [...m.entries()].map(([id, name]) => ({ id, name }));
  }, [appts]);

  const offSet = new Set(
    (rest?.timeOff || []).map((t) => String(t.date).slice(0, 10)),
  );
  const restWeekdays = rest?.restWeekdays || [];
  const today = todayStr();

  const goToday = () => {
    const d = new Date();
    setCal({ y: d.getFullYear(), m: d.getMonth() });
  };

  const dayList = dayOpen ? (byDay[dayOpen] || []) : [];

  return (
    <div>
      {/* Barra superior */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setCal((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))
            }
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <span className="min-w-[9rem] text-center text-lg font-bold text-gray-800">
            {MONTHS[cal.m]} {cal.y}
          </span>
          <button
            onClick={() =>
              setCal((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))
            }
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          <button
            onClick={goToday}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Hoy
          </button>
        </div>
        {!isBarber && barberOptions.length > 0 && (
          <select
            value={barberId}
            onChange={(e) => setBarberId(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
          >
            <option value="">Todos los profesionales</option>
            {barberOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Rejilla del mes */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/60 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {WD.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid(cal.y, cal.m).map((c, i) => {
            if (!c)
              return <div key={`b${i}`} className="min-h-[92px] border-b border-r border-gray-50 bg-gray-50/30" />;
            const list = byDay[c.dateStr] || [];
            const weekday = new Date(`${c.dateStr}T00:00:00Z`).getUTCDay();
            const off = offSet.has(c.dateStr) || restWeekdays.includes(weekday);
            const isToday = c.dateStr === today;
            return (
              <button
                key={c.dateStr}
                onClick={() => setDayOpen(c.dateStr)}
                className={`relative min-h-[92px] border-b border-r border-gray-50 p-1.5 text-left align-top transition hover:bg-orange-50/40 ${
                  off ? 'bg-amber-50/50' : ''
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday ? 'bg-orange-500 text-white' : 'text-gray-600'
                    }`}
                  >
                    {c.d}
                  </span>
                  {off && <MoonIcon className="h-3.5 w-3.5 text-amber-500" />}
                </div>
                <div className="space-y-1">
                  {list.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className={`truncate rounded border-l-2 bg-gray-50 px-1 py-0.5 text-[10px] text-gray-600 ${st(a.status).chip}`}
                    >
                      {a.startTime?.replace(/\s*a\.\s*m\./, 'am').replace(/\s*p\.\s*m\./, 'pm')}{' '}
                      {firstName(a.customer?.name)}
                    </div>
                  ))}
                  {list.length > 3 && (
                    <div className="text-[10px] font-medium text-orange-500">
                      +{list.length - 3} más
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-gray-500">
        {Object.entries(STATUS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${v.dot}`} />
            {v.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <MoonIcon className="h-3.5 w-3.5 text-amber-500" /> Descanso
        </span>
      </div>

      {loading && (
        <p className="mt-3 text-center text-sm text-gray-400">Cargando…</p>
      )}

      {/* Detalle del día */}
      {dayOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDayOpen(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold capitalize text-gray-800">
                  {new Date(`${dayOpen}T12:00:00Z`).toLocaleDateString('es-CO', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    timeZone: 'UTC',
                  })}
                </h2>
                <p className="text-xs text-gray-500">
                  {dayList.length} cita(s)
                </p>
              </div>
              <button
                onClick={() => setDayOpen(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              {(offSet.has(dayOpen) ||
                restWeekdays.includes(
                  new Date(`${dayOpen}T00:00:00Z`).getUTCDay(),
                )) && (
                <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  <MoonIcon className="h-4 w-4" /> Día de descanso del profesional.
                </div>
              )}
              {dayList.length ? (
                <ul className="space-y-2">
                  {dayList.map((a) => (
                    <li
                      key={a.id}
                      className={`rounded-xl border border-l-4 border-gray-100 bg-white p-3 ${st(a.status).chip}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800">
                          {a.startTime}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className={`h-2 w-2 rounded-full ${st(a.status).dot}`} />
                          {st(a.status).label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">
                        {a.customer?.name || 'Sin cliente'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {a.service?.name}
                        {!isBarber && a.barber ? ` · ${a.barber.name}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-gray-400">
                  Sin citas este día.
                </p>
              )}
              <Link
                href={`/dashboard/appointments/new?date=${dayOpen}`}
                className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
              >
                <PlusIcon className="h-4 w-4" /> Agendar en este día
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
