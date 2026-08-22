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

export default function Kitchen() {
  const auth = useAuth();
  // La cocina marca Preparando/Listo; "Entregar" es acción del mesero.
  const isCocinero = auth?.usuario?.role === 'COCINERO';
  const [comandas, setComandas] = useState([]);
  const [loaded, setLoaded] = useState(false);

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
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
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
                  {list.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-800">
                          {c.mesa?.name || 'Para llevar'}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          #{c.id}
                        </span>
                      </div>
                      {c.user?.name && (
                        <p className="text-[11px] text-gray-400">
                          Mesero: {c.user.name}
                        </p>
                      )}
                      <ul className="mt-2 space-y-0.5">
                        {c.items.map((it) => (
                          <li
                            key={it.id}
                            className="flex justify-between text-xs text-gray-600"
                          >
                            <span className="truncate">
                              {it.quantity}× {it.name}
                            </span>
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
                  ))}
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
