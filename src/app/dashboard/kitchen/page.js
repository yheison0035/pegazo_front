'use client';

import { useCallback, useEffect, useState } from 'react';
import { FireIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/authContext';
import { getKitchen, setComandaStatus } from '@/lib/api/routes/comandas';

const NEXT = {
  PENDIENTE: { to: 'PREPARANDO', label: 'Empezar a preparar' },
  PREPARANDO: { to: 'LISTO', label: 'Marcar listo' },
  LISTO: { to: 'ENTREGADO', label: 'Entregar' },
};

const STATUS_META = {
  PENDIENTE: { label: 'Pendiente', chip: 'bg-orange-100 text-orange-700' },
  PREPARANDO: { label: 'Preparando', chip: 'bg-blue-100 text-blue-700' },
  LISTO: { label: 'Listo', chip: 'bg-green-100 text-green-700' },
};

// Minutos transcurridos desde que entró el pedido (para priorizar por espera).
function minutesSince(dateStr, now) {
  const ms = now - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / 60000));
}
function elapsedLabel(min) {
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  return `hace ${h} h ${min % 60} min`;
}

export default function Kitchen() {
  const auth = useAuth();
  // La cocina marca Preparando/Listo; "Entregar" es acción del mesero.
  const isCocinero = auth?.usuario?.role === 'COCINERO';
  const [comandas, setComandas] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const res = await getKitchen();
      setComandas(res?.data || []);
    } catch {
      setComandas([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    // Casi en tiempo real: refresca datos cada 12s.
    const t = setInterval(load, 12000);
    // El reloj de espera avanza cada 20s aunque no haya recarga.
    const clock = setInterval(() => setNow(Date.now()), 20000);
    return () => {
      clearInterval(t);
      clearInterval(clock);
    };
  }, [load]);

  const advance = async (c) => {
    const next = NEXT[c.status]?.to;
    if (!next) return;
    await setComandaStatus(c.id, next);
    load();
  };

  const columns = ['PENDIENTE', 'PREPARANDO', 'LISTO'];

  return (
    <div className="w-full p-4">
      <h1 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-gray-800">
        <FireIcon className="h-6 w-6 text-orange-500" />
        Cocina
      </h1>

      {loaded && comandas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
          No hay comandas en cocina.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {columns.map((col) => {
            const list = comandas.filter((c) => c.status === col);
            const meta = STATUS_META[col];
            return (
              <div key={col} className="rounded-2xl bg-gray-50 p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.chip}`}
                  >
                    {meta.label}
                  </span>
                  <span className="text-xs font-semibold text-gray-400">
                    {list.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {list.map((c) => {
                    const min = minutesSince(c.createdAt, now);
                    // Prioridad por espera: >15 min urgente, 8–15 min atención.
                    const urgent = col !== 'LISTO' && min >= 15;
                    const warn = col !== 'LISTO' && min >= 8 && min < 15;
                    return (
                    <div
                      key={c.id}
                      className={`rounded-xl border bg-white p-3 shadow-sm ${
                        urgent
                          ? 'border-red-300 ring-1 ring-red-200'
                          : warn
                            ? 'border-amber-300'
                            : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-800">
                          {c.mesa?.name || 'Para llevar'}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            urgent
                              ? 'text-red-600'
                              : warn
                                ? 'text-amber-600'
                                : 'text-gray-400'
                          }`}
                        >
                          {elapsedLabel(min)}
                        </span>
                      </div>
                      {c.user?.name && (
                        <p className="text-[11px] text-gray-400">
                          Mesero: {c.user.name} · #{c.id}
                        </p>
                      )}
                      <ul className="mt-2 space-y-0.5">
                        {c.items.map((it) => (
                          <li key={it.id} className="text-xs text-gray-600">
                            <span className="font-medium">
                              {it.quantity}× {it.name}
                            </span>
                            {it.notes && (
                              <span className="mt-0.5 block font-semibold text-orange-600">
                                📝 {it.notes}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      {c.notes && (
                        <p className="mt-1 text-[11px] italic text-gray-400">
                          {c.notes}
                        </p>
                      )}
                      {NEXT[c.status] &&
                        !(isCocinero && c.status === 'LISTO') && (
                          <Button
                            variant="add"
                            size="sm"
                            iconRight={ArrowRightIcon}
                            onClick={() => advance(c)}
                            className="mt-2 w-full"
                          >
                            {NEXT[c.status].label}
                          </Button>
                        )}
                    </div>
                    );
                  })}
                  {list.length === 0 && (
                    <p className="py-4 text-center text-[11px] text-gray-300">
                      —
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
