'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import Link from 'next/link';
import {
  KeyIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  BuildingOffice2Icon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  QrCodeIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import {
  getAccountantMe,
  getAccountantPortfolio,
  createAccountantCompany,
} from '@/lib/api/routes/accountant';

// Color de avatar derivado del nombre (para las tarjetas sin logo).
const AVATAR_COLORS = [
  'bg-orange-100 text-orange-700',
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
];
function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export default function ContadorPortal() {
  const [me, setMe] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(null);
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getAccountantMe();
      if (res?.data) {
        setMe(res.data);
        localStorage.setItem('contador', JSON.stringify(res.data));
      }
    } catch {
      try {
        setMe(JSON.parse(localStorage.getItem('contador') || 'null'));
      } catch {
        /* noop */
      }
    }
    try {
      const p = await getAccountantPortfolio();
      setCompanies(p?.data || []);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!me?.accountantKey) return;
    QRCode.toDataURL(me.accountantKey, { width: 200, margin: 1 })
      .then(setQr)
      .catch(() => setQr(''));
  }, [me?.accountantKey]);

  const stats = useMemo(() => {
    const pegazo = companies.filter((c) => !c.accountingOnly).length;
    return { total: companies.length, pegazo, externas: companies.length - pegazo };
  }, [companies]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return companies;
    return companies.filter(
      (c) =>
        c.name?.toLowerCase().includes(t) || String(c.nit || '').includes(t),
    );
  }, [companies, q]);

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(me.accountantKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const saveCompany = async () => {
    const name = (creating?.name || '').trim();
    if (!name) return;
    setBusy(true);
    try {
      await createAccountantCompany({
        name,
        nit: creating.nit?.trim() || null,
        taxRegime: creating.taxRegime || null,
      });
      setCreating(null);
      load();
    } catch {
      /* noop */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Hola{me?.name ? `, ${me.name}` : ''} 👋
          </h1>
          <p className="text-sm text-gray-500">
            Tu portafolio de empresas. Lleva su contabilidad de punta a punta.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-600">
            {stats.total} empresa{stats.total !== 1 ? 's' : ''}
          </span>
          <span className="rounded-full bg-orange-50 px-3 py-1 font-semibold text-orange-600">
            {stats.pegazo} Pegazo
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-500">
            {stats.externas} externas
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Portafolio */}
        <div className="order-2 lg:order-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar empresa o NIT…"
                className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <button
              onClick={() => setCreating({ name: '', nit: '', taxRegime: '' })}
              className="inline-flex items-center gap-1 rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              <PlusIcon className="h-4 w-4" /> Nueva empresa
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center text-gray-400">
              {companies.length === 0 ? (
                <>
                  Aún no tienes empresas.
                  <p className="mt-1 text-xs">
                    Crea una con <b>Nueva empresa</b>, o comparte tu llave{' '}
                    <b>{me?.accountantKey}</b> con un negocio de Pegazo.
                  </p>
                </>
              ) : (
                'No hay empresas que coincidan.'
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((c) => (
                <Link
                  key={c.companyId}
                  href={`/contador/empresa/${c.companyId}`}
                  className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                >
                  {c.logo ? (
                    <img src={c.logo} alt="" className="h-11 w-11 flex-none rounded-xl border border-gray-100 object-contain" />
                  ) : (
                    <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl text-lg font-bold ${avatarColor(c.name)}`}>
                      {(c.name || '?').charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-800">{c.name}</p>
                    <p className="text-[11px] text-gray-400">{c.nit ? `NIT ${c.nit}` : c.type}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                        c.accountingOnly ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-orange-600'
                      }`}
                    >
                      {c.accountingOnly ? 'Solo contabilidad' : 'Pegazo'}
                    </span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 flex-none text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-orange-500" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Llave + QR (aside) */}
        <div className="order-1 lg:order-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <KeyIcon className="h-5 w-5 text-orange-500" />
              <h2 className="text-sm font-bold text-gray-800">Tu llave</h2>
            </div>
            <p className="mb-3 text-[11px] text-gray-500">
              El dueño la pega o escanea al activar Contabilidad para enlazarte.
            </p>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-mono text-base font-bold tracking-wider text-gray-800">
                {me?.accountantKey || '—'}
              </span>
              <button onClick={copyKey} title="Copiar" className="flex-none rounded-lg bg-orange-500 p-2 text-white hover:bg-orange-600">
                {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={() => setShowQr((v) => !v)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              <QrCodeIcon className="h-4 w-4" /> {showQr ? 'Ocultar QR' : 'Mostrar QR'}
            </button>
            {showQr && qr && (
              <div className="mt-3 flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="QR de tu llave" className="rounded-xl border border-gray-100" />
                <p className="mt-1 text-[11px] text-gray-400">Escanea para enlazar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal nueva empresa */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setCreating(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Nueva empresa</h2>
              <button onClick={() => setCreating(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-xs text-gray-500">
              Para un cliente que no está en Pegazo. Le llevarás la contabilidad con asientos manuales.
            </p>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Nombre de la empresa *</label>
            <input
              autoFocus
              value={creating.name}
              onChange={(e) => setCreating({ ...creating, name: e.target.value.toUpperCase() })}
              placeholder="EJ: FERRETERÍA EL TORNILLO"
              className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">NIT</label>
                <input value={creating.nit} onChange={(e) => setCreating({ ...creating, nit: e.target.value })} placeholder="Opcional" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Régimen</label>
                <select value={creating.taxRegime} onChange={(e) => setCreating({ ...creating, taxRegime: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                  <option value="">—</option>
                  <option value="SIMPLE">Simple</option>
                  <option value="ORDINARIO">Ordinario</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setCreating(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={saveCompany} disabled={busy || !creating.name.trim()} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50">
                {busy ? 'Creando…' : 'Crear empresa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
