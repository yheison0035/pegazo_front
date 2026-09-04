'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GiftIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  TrophyIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import Button from '@/components/ui/Button';
import { Roles, ALL_EXCEPT_BARBER } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import { getLoyaltyCustomers } from '@/lib/api/routes/customers';
import { syncLoyaltyFromSales } from '@/lib/api/routes/company';
import { SALES_CHANGED_EVENT } from '@/lib/api/routes/sales';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import AlertModal from '@/components/dashboard/modals/alertModal';
import WhatsappLink from '@/components/dashboard/tables/segments/contentData/whatsappLink';
import { loyaltyWhatsappMessage } from '@/lib/loyaltyMessage';

export default function LoyaltyPage() {
  const { usuario } = useAuth();
  const isOwnerAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState([]);
  const [config, setConfig] = useState(null);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active'); // 'active' | 'completed'
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLoyaltyCustomers({
        page,
        limit,
        search,
        completed: tab === 'completed',
      });
      setData(res.data || []);
      setConfig(res.config || null);
      setMeta(res.meta || null);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error al cargar' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, tab]);

  useEffect(() => {
    const t = setTimeout(fetch, 300);
    return () => clearTimeout(t);
  }, [fetch]);

  // Tiempo real: al facturar/anular una venta (o al reenfocar la pestaña), la
  // fidelización se recalcula sola en el backend; aquí refrescamos la tabla.
  useEffect(() => {
    const onChange = () => fetch();
    window.addEventListener(SALES_CHANGED_EVENT, onChange);
    window.addEventListener('focus', onChange);
    return () => {
      window.removeEventListener(SALES_CHANGED_EVENT, onChange);
      window.removeEventListener('focus', onChange);
    };
  }, [fetch]);

  const sync = async () => {
    setSyncing(true);
    try {
      const res = await syncLoyaltyFromSales();
      const d = res?.data || {};
      setAlert({
        type: 'success',
        message: `Sincronizado: ${d.customersUpdated} clientes con ${d.salesProcessed} ventas.`,
      });
      fetch();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo sincronizar' });
    } finally {
      setSyncing(false);
    }
  };

  const t1v = config?.loyaltyTier1Visits ?? 4;
  const t1p = config?.loyaltyTier1Percent ?? 50;
  const t2v = config?.loyaltyTier2Visits ?? 8;
  const t2p = config?.loyaltyTier2Percent ?? 100;
  const maxDays = config?.loyaltyMaxDays ?? 25;

  return (
    <RoleGuard allowedRoles={ALL_EXCEPT_BARBER}>
      <div className="w-full p-4 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Fidelización</h1>
            <p className="text-sm text-gray-500">
              Descuentos por visitas frecuentes.
            </p>
          </div>
          <div className="flex gap-2">
            {isOwnerAdmin && (
              <Button
                variant="primary"
                onClick={sync}
                loading={syncing}
                disabled={syncing}
                icon={ArrowPathIcon}
                title="Recalcula los sellos de todos los clientes a partir del historial de ventas"
              >
                {syncing ? 'Sincronizando...' : 'Sincronizar con ventas'}
              </Button>
            )}
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Cog6ToothIcon className="w-5 h-5" /> Configurar
            </Link>
          </div>
        </div>

        {config && !config.loyaltyEnabled && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            La fidelización está <b>desactivada</b>. Actívala en{' '}
            <Link href="/dashboard/settings" className="underline font-medium">
              Configuración
            </Link>
            .
          </div>
        )}

        {config?.loyaltyEnabled && (
          <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white shadow border border-gray-100 p-4 flex items-center gap-3">
              <div className="rounded-xl bg-orange-100 p-2">
                <GiftIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400">Escalón 1</p>
                <p className="font-semibold text-gray-800">
                  Visita #{t1v} → {t1p}%
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white shadow border border-gray-100 p-4 flex items-center gap-3">
              <div className="rounded-xl bg-orange-100 p-2">
                <TrophyIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400">Escalón 2</p>
                <p className="font-semibold text-gray-800">
                  Visita #{t2v} → {t2p}%
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white shadow border border-gray-100 p-4 flex items-center gap-3">
              <div className="rounded-xl bg-orange-100 p-2">
                <ClockIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400">Racha válida</p>
                <p className="font-semibold text-gray-800">
                  Máx. {maxDays} días entre visitas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pestañas: activos (aún acumulan) vs antiguos (ya graduados). */}
        <div className="mb-4 inline-flex rounded-xl bg-gray-100 p-1">
          {[
            { id: 'active', label: 'Acumulando' },
            { id: 'completed', label: 'Clientes antiguos' },
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => {
                setPage(1);
                setTab(tb.id);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === tb.id
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {tab === 'completed' && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Estos clientes ya <b>completaron el rango de fidelización</b> (son
            clientes antiguos): la fidelización queda desactivada y pagan normal.
            Aquí los tienes a la mano para pensar qué ofrecerles más adelante.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Buscar cliente por nombre, teléfono o documento"
              className="flex-1 text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="relative bg-white rounded-2xl shadow border border-gray-100">
          <LoadingOverlay show={loading} text="Cargando..." />
          <div className="divide-y divide-gray-50">
            {data.length === 0 && !loading && (
              <p className="px-5 py-10 text-center text-gray-400">
                {tab === 'completed'
                  ? 'Aún no hay clientes antiguos (que completaron la fidelización).'
                  : 'Aún no hay clientes acumulando visitas.'}
              </p>
            )}
            {data.map((c) => {
              const L = c.loyalty || {};
              const isDone = tab === 'completed' || L.completed;
              const pct = isDone
                ? 100
                : Math.min(100, ((L.currentCount || 0) / t2v) * 100);
              const waMsg = loyaltyWhatsappMessage(c, usuario?.company?.name);
              return (
                <div
                  key={c.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/customers/${c.id}`}
                        className="font-medium text-gray-800 hover:text-orange-600 truncate"
                      >
                        {c.name}
                      </Link>
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-0.5">
                          <TrophyIcon className="w-3.5 h-3.5" />
                          Cliente antiguo · fidelización completada
                        </span>
                      ) : (
                        <>
                          {L.nextDiscount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5">
                              <GiftIcon className="w-3.5 h-3.5" />
                              Próximo corte: {L.nextDiscount}% dcto
                            </span>
                          )}
                          {L.expired && (
                            <span className="rounded-full bg-red-50 text-red-600 text-xs font-medium px-2 py-0.5">
                              Racha vencida
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3">
                      {c.phone ? (
                        <WhatsappLink phone={c.phone} message={waMsg} className="text-xs" />
                      ) : (
                        <span className="text-xs text-gray-400">Sin teléfono</span>
                      )}
                    </div>
                    {!isDone && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden max-w-xs">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {L.currentCount || 0}/{t2v} visitas
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              limit={limit}
              setPage={setPage}
              setLimit={setLimit}
            />
          )}
        </div>

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      </div>
    </RoleGuard>
  );
}
