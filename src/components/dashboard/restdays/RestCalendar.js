'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WD = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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
  for (let d = 1; d <= days; d++) {
    cells.push({
      d,
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }
  return cells;
}
function weekdayOf(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

/**
 * Calendario mensual de descansos.
 * - restWeekdays: número de día (0=Dom..6=Sáb) recurrentes.
 * - timeOff: [{ id, date }] fechas puntuales.
 * - onToggle(dateStr): si se pasa, los días son interactivos; si no, solo lectura.
 */
export default function RestCalendar({
  restWeekdays = [],
  timeOff = [],
  onToggle,
  dayBusy = null,
  compact = false,
}) {
  const [cal, setCal] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const interactive = typeof onToggle === 'function';
  const today = todayStr();
  const offSet = new Set(
    (timeOff || []).map((t) => String(t.date).slice(0, 10)),
  );
  const cell = compact ? 'h-8 text-xs' : 'h-9 text-sm';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() =>
            setCal((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))
          }
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTH_NAMES[cal.m]} {cal.y}
        </span>
        <button
          onClick={() =>
            setCal((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))
          }
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {WD.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid(cal.y, cal.m).map((c, i) => {
          if (!c) return <div key={`b${i}`} />;
          const off = offSet.has(c.dateStr);
          const weekly = restWeekdays.includes(weekdayOf(c.dateStr));
          const past = c.dateStr < today;
          const isToday = c.dateStr === today;
          let cls = interactive
            ? 'text-gray-700 hover:bg-orange-100 hover:text-orange-700'
            : 'text-gray-600';
          if (weekly) cls = 'bg-amber-100 text-amber-700 cursor-default';
          else if (off) cls = 'bg-orange-500 text-white shadow-sm';
          else if (past && interactive) cls = 'text-gray-300 cursor-not-allowed';
          else if (past) cls = 'text-gray-300';
          return (
            <button
              key={c.dateStr}
              disabled={!interactive || past || weekly || !!dayBusy}
              onClick={interactive ? () => onToggle(c.dateStr) : undefined}
              title={weekly ? 'Descanso semanal' : off ? 'Descanso' : ''}
              className={`relative rounded-lg font-medium transition disabled:opacity-100 ${cell} ${cls} ${
                isToday ? 'ring-1 ring-orange-300' : ''
              }`}
            >
              {c.d}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded bg-orange-500" />
          Descanso
        </span>
        {restWeekdays.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded bg-amber-200" />
            Semanal
          </span>
        )}
      </div>
    </div>
  );
}
