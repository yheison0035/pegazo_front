'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  MoonIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import Button from '@/components/ui/Button';
import TableActionButton from '@/components/ui/TableActionButton';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import {
  getRestDaysProfessionals,
  getRestDays,
  setRestWeekdays,
  addTimeOff,
  removeTimeOff,
} from '@/lib/api/routes/restDays';

const WEEKDAYS = [
  { n: 1, label: 'Lun' },
  { n: 2, label: 'Mar' },
  { n: 3, label: 'Mié' },
  { n: 4, label: 'Jue' },
  { n: 5, label: 'Vie' },
  { n: 6, label: 'Sáb' },
  { n: 0, label: 'Dom' },
];

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

function todayInput() {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Celdas del mes (lunes primero). null = relleno antes del día 1.
function monthGrid(y, m) {
  const startDow = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7; // 0=Lun
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ d, dateStr });
  }
  return cells;
}

// Día de la semana (0=Dom..6=Sáb) de una fecha YYYY-MM-DD.
function weekdayOf(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

export default function RestDaysPage() {
  const [pros, setPros] = useState([]);
  const [selected, setSelected] = useState(null);
  const [config, setConfig] = useState(null); // {restWeekdays, timeOff}
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});
  const [newDate, setNewDate] = useState(todayInput());
  const [newReason, setNewReason] = useState('');
  const [cal, setCal] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [dayBusy, setDayBusy] = useState(null);

  // Programa o quita un descanso puntual desde el calendario.
  const toggleDay = async (dateStr) => {
    if (!config || dateStr < todayInput()) return;
    setDayBusy(dateStr);
    try {
      const existing = (config.timeOff || []).find(
        (t) => String(t.date).slice(0, 10) === dateStr,
      );
      if (existing) await removeTimeOff(existing.id);
      else await addTimeOff(selected, { date: dateStr, reason: 'Programado' });
      await loadConfig(selected);
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setDayBusy(null);
    }
  };

  useEffect(() => {
    getRestDaysProfessionals()
      .then((r) => {
        const list = r?.data || [];
        setPros(list);
        if (list.length) setSelected(list[0].id);
      })
      .catch(() => setPros([]));
  }, []);

  const loadConfig = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const r = await getRestDays(userId);
      setConfig(r?.data || { restWeekdays: [], timeOff: [] });
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo cargar.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected) loadConfig(selected);
  }, [selected, loadConfig]);

  const toggleWeekday = async (n) => {
    if (!config) return;
    const set = new Set(config.restWeekdays || []);
    set.has(n) ? set.delete(n) : set.add(n);
    const next = [...set];
    setConfig({ ...config, restWeekdays: next }); // optimista
    setBusy(true);
    try {
      await setRestWeekdays(selected, next);
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
      loadConfig(selected);
    } finally {
      setBusy(false);
    }
  };

  const addOff = async () => {
    if (!newDate) return;
    setBusy(true);
    try {
      await addTimeOff(selected, {
        date: newDate,
        reason: newReason.trim() || undefined,
      });
      setNewReason('');
      loadConfig(selected);
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo agregar.' });
    } finally {
      setBusy(false);
    }
  };

  const delOff = async (id) => {
    setBusy(true);
    try {
      await removeTimeOff(id);
      loadConfig(selected);
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo eliminar.' });
    } finally {
      setBusy(false);
    }
  };

  const selectedPro = pros.find((p) => p.id === selected);

  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN]}>
      <div className="relative mx-auto w-full max-w-3xl p-4">
        <LoadingOverlay show={loading} text="Cargando..." />

        <div className="mb-4">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
            <MoonIcon className="h-6 w-6 text-orange-500" />
            Descansos del equipo
          </h1>
          <p className="text-sm text-gray-500">
            Define los días libres de cada profesional. No se podrán agendar citas
            esos días, ni en el panel ni en la página pública de reservas.
          </p>
        </div>

        {/* Selección de profesional */}
        {pros.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400 shadow-sm">
            No hay profesionales con agenda en este negocio.
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap gap-2">
              {pros.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    selected === p.id
                      ? 'border-orange-300 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {config && (
              <div className="space-y-6">
                {/* Descanso semanal */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <p className="mb-1 font-semibold text-gray-800">
                    Descanso semanal
                  </p>
                  <p className="mb-4 text-xs text-gray-500">
                    Marca los días en que {selectedPro?.name?.split(' ')[0]} NO
                    atiende (se repite cada semana).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((d) => {
                      const on = (config.restWeekdays || []).includes(d.n);
                      return (
                        <button
                          key={d.n}
                          disabled={busy}
                          onClick={() => toggleWeekday(d.n)}
                          className={`h-11 w-14 rounded-xl border text-sm font-semibold transition disabled:opacity-50 ${
                            on
                              ? 'border-orange-400 bg-orange-500 text-white shadow-sm'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Descansos puntuales */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <p className="mb-1 font-semibold text-gray-800">
                    Días libres puntuales
                  </p>
                  <p className="mb-4 text-xs text-gray-500">
                    Programa cada descanso en el calendario (toca el día).
                    Vacaciones, permisos, el domingo del mes…
                  </p>

                  {/* Calendario mensual */}
                  <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <button
                        onClick={() =>
                          setCal((c) =>
                            c.m === 0
                              ? { y: c.y - 1, m: 11 }
                              : { y: c.y, m: c.m - 1 },
                          )
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
                          setCal((c) =>
                            c.m === 11
                              ? { y: c.y + 1, m: 0 }
                              : { y: c.y, m: c.m + 1 },
                          )
                        }
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(
                        (d) => (
                          <div key={d}>{d}</div>
                        ),
                      )}
                    </div>
                    <div className="mt-1 grid grid-cols-7 gap-1">
                      {monthGrid(cal.y, cal.m).map((cell, i) => {
                        if (!cell) return <div key={`b${i}`} />;
                        const off = (config.timeOff || []).some(
                          (t) => String(t.date).slice(0, 10) === cell.dateStr,
                        );
                        const weekly = (config.restWeekdays || []).includes(
                          weekdayOf(cell.dateStr),
                        );
                        const past = cell.dateStr < todayInput();
                        const isToday = cell.dateStr === todayInput();
                        let cls =
                          'text-gray-700 hover:bg-orange-100 hover:text-orange-700';
                        if (weekly)
                          cls = 'bg-amber-100 text-amber-700 cursor-default';
                        else if (off)
                          cls = 'bg-orange-500 text-white shadow-sm';
                        else if (past)
                          cls = 'text-gray-300 cursor-not-allowed';
                        return (
                          <button
                            key={cell.dateStr}
                            disabled={past || weekly || !!dayBusy}
                            onClick={() => toggleDay(cell.dateStr)}
                            title={
                              weekly
                                ? 'Descanso semanal'
                                : off
                                  ? 'Quitar descanso'
                                  : 'Programar descanso'
                            }
                            className={`relative h-9 rounded-lg text-sm font-medium transition disabled:opacity-100 ${cls} ${
                              isToday ? 'ring-1 ring-orange-300' : ''
                            }`}
                          >
                            {cell.d}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded bg-orange-500" />
                        Programado
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded bg-amber-200" />
                        Descanso semanal
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap items-end gap-2">
                    <div className="flex flex-col">
                      <label className="mb-1 text-xs font-semibold text-gray-600">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={newDate}
                        min={todayInput()}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <label className="mb-1 text-xs font-semibold text-gray-600">
                        Motivo (opcional)
                      </label>
                      <input
                        value={newReason}
                        onChange={(e) => setNewReason(e.target.value)}
                        placeholder="Ej: Vacaciones"
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                    <Button
                      variant="primary"
                      icon={PlusIcon}
                      onClick={addOff}
                      loading={busy}
                    >
                      Agregar
                    </Button>
                  </div>

                  {(config.timeOff || []).length ? (
                    <ul className="divide-y divide-gray-50">
                      {config.timeOff.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center justify-between gap-3 py-2.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <CalendarDaysIcon className="h-5 w-5 text-orange-400" />
                            <div>
                              <p className="text-sm font-medium capitalize text-gray-800">
                                {fmtDate(t.date)}
                              </p>
                              {t.reason && (
                                <p className="text-xs text-gray-400">
                                  {t.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          <TableActionButton
                            icon={TrashIcon}
                            label="Quitar"
                            variant="delete"
                            disabled={busy}
                            onClick={() => delOff(t.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-4 text-center text-sm text-gray-400">
                      Sin días libres próximos.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({})}
        />
      </div>
    </RoleGuard>
  );
}
