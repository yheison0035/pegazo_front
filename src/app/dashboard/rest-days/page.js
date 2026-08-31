'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  MoonIcon,
  CalendarDaysIcon,
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

export default function RestDaysPage() {
  const [pros, setPros] = useState([]);
  const [selected, setSelected] = useState(null);
  const [config, setConfig] = useState(null); // {restWeekdays, timeOff}
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});
  const [newDate, setNewDate] = useState(todayInput());
  const [newReason, setNewReason] = useState('');

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
                    Vacaciones, citas médicas, permisos… (fechas específicas).
                  </p>

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
