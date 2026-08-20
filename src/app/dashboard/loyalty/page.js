'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GiftIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import {
  getLoyaltyCustomers,
  redeemCustomerReward,
} from '@/lib/api/routes/customers';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import AlertModal from '@/components/dashboard/modals/alertModal';

export default function LoyaltyPage() {
  const [data, setData] = useState([]);
  const [config, setConfig] = useState(null);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [onlyRewards, setOnlyRewards] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLoyaltyCustomers({
        page,
        limit,
        search,
        onlyRewards: onlyRewards ? 'true' : '',
      });
      setData(res.data || []);
      setConfig(res.config || null);
      setMeta(res.meta || null);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error al cargar' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, onlyRewards]);

  useEffect(() => {
    const t = setTimeout(fetch, 300);
    return () => clearTimeout(t);
  }, [fetch]);

  const redeem = async (id) => {
    try {
      await redeemCustomerReward(id);
      setAlert({ type: 'success', message: 'Premio canjeado.' });
      fetch();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo canjear' });
    }
  };

  const required = config?.loyaltyStampsRequired || 10;

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Fidelización</h1>
            <p className="text-sm text-gray-500">
              Tarjeta de sellos: tus clientes acumulan y ganan premios.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <Cog6ToothIcon className="w-5 h-5" /> Configurar
          </Link>
        </div>

        {/* Estado de la configuración */}
        {config && !config.loyaltyEnabled && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            La fidelización está <b>desactivada</b>. Actívala en{' '}
            <Link href="/dashboard/settings" className="underline font-medium">
              Configuración
            </Link>{' '}
            para empezar a dar sellos y premios.
          </div>
        )}
        {config?.loyaltyEnabled && (
          <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white shadow border border-gray-100 p-4 flex items-center gap-3">
              <div className="rounded-xl bg-orange-100 p-2">
                <GiftIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400">Premio</p>
                <p className="font-semibold text-gray-800">
                  {config.loyaltyReward}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white shadow border border-gray-100 p-4 flex items-center gap-3">
              <div className="rounded-xl bg-orange-100 p-2">
                <TrophyIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400">Sellos por premio</p>
                <p className="font-semibold text-gray-800">{required} sellos</p>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
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
          <button
            onClick={() => {
              setPage(1);
              setOnlyRewards((v) => !v);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium border ${
              onlyRewards
                ? 'bg-orange-50 border-orange-300 text-orange-700'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            Solo con premio
          </button>
        </div>

        {/* Lista */}
        <div className="relative bg-white rounded-2xl shadow border border-gray-100">
          <LoadingOverlay show={loading} text="Cargando..." />
          <div className="divide-y divide-gray-50">
            {data.length === 0 && !loading && (
              <p className="px-5 py-10 text-center text-gray-400">
                Aún no hay clientes con sellos.
              </p>
            )}
            {data.map((c) => {
              const pct = Math.min(100, (c.loyaltyStamps / required) * 100);
              return (
                <div
                  key={c.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/customers/${c.id}`}
                        className="font-medium text-gray-800 hover:text-orange-600 truncate"
                      >
                        {c.name}
                      </Link>
                      {c.loyaltyRewards > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5">
                          <GiftIcon className="w-3.5 h-3.5" />
                          {c.loyaltyRewards} premio{c.loyaltyRewards > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{c.phone || 'Sin teléfono'}</p>
                    {/* Progreso de sellos */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden max-w-xs">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {c.loyaltyStamps}/{required} sellos
                      </span>
                    </div>
                  </div>
                  {c.loyaltyRewards > 0 && (
                    <button
                      onClick={() => redeem(c.id)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 whitespace-nowrap"
                    >
                      Canjear premio
                    </button>
                  )}
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
