'use client';

import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  KeyIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  BuildingOffice2Icon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import {
  getAccountantMe,
  getAccountantPortfolio,
  createAccountantCompany,
} from '@/lib/api/routes/accountant';

export default function ContadorPortal() {
  const [me, setMe] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [creating, setCreating] = useState(null); // form nueva empresa
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getAccountantMe();
      const data = res?.data;
      if (data) {
        setMe(data);
        localStorage.setItem('contador', JSON.stringify(data));
      }
    } catch {
      // Respaldo: lo guardado al iniciar sesión.
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

  // Genera el QR de la llave (local, sin llamadas externas).
  useEffect(() => {
    if (!me?.accountantKey) return;
    QRCode.toDataURL(me.accountantKey, { width: 220, margin: 1 })
      .then(setQr)
      .catch(() => setQr(''));
  }, [me?.accountantKey]);

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

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(me.accountantKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">
          Hola{me?.name ? `, ${me.name}` : ''} 👋
        </h1>
        <p className="text-sm text-gray-500">
          Este es tu portal. Comparte tu llave con los negocios para que te
          enlacen y verás aquí la contabilidad de cada uno.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        {/* Llave + QR */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <KeyIcon className="h-5 w-5 text-orange-500" />
            <h2 className="text-sm font-bold text-gray-800">Tu llave de contador</h2>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            El dueño la pega o escanea al activar Contabilidad para enlazarte su
            empresa.
          </p>

          <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <span className="font-mono text-lg font-bold tracking-wider text-gray-800">
              {me?.accountantKey || '—'}
            </span>
            <button
              onClick={copyKey}
              title="Copiar"
              className="flex-none rounded-lg bg-orange-500 p-2 text-white hover:bg-orange-600"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <ClipboardDocumentIcon className="h-4 w-4" />
              )}
            </button>
          </div>

          {qr && (
            <div className="mt-4 flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt="QR de tu llave"
                className="rounded-xl border border-gray-100"
              />
              <p className="mt-2 text-[11px] text-gray-400">
                Escanea para enlazar
              </p>
            </div>
          )}
        </div>

        {/* Portafolio (se llena en el siguiente paso) */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BuildingOffice2Icon className="h-5 w-5 text-orange-500" />
              <h2 className="text-sm font-bold text-gray-800">Tus empresas</h2>
            </div>
            <button
              onClick={() => setCreating({ name: '', nit: '', taxRegime: '' })}
              className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
            >
              <PlusIcon className="h-4 w-4" /> Nueva empresa
            </button>
          </div>
          {companies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-gray-400">
              Aún no tienes empresas.
              <p className="mt-1 text-xs">
                Crea una tú mismo con <b>Nueva empresa</b>, o comparte tu llave{' '}
                <b>{me?.accountantKey || ''}</b> con un negocio de Pegazo para que
                te enlace.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {companies.map((c) => (
                <li key={c.companyId}>
                  <Link
                    href={`/contador/empresa/${c.companyId}`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 transition hover:border-orange-200 hover:bg-orange-50/40"
                  >
                    <img
                      src={c.logo || '/images/no-image.png'}
                      alt=""
                      className="h-10 w-10 flex-none rounded-lg border border-gray-100 object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-semibold text-gray-800">
                        {c.name}
                        <span
                          className={`flex-none rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                            c.accountingOnly
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-orange-50 text-orange-600'
                          }`}
                        >
                          {c.accountingOnly ? 'Solo contabilidad' : 'Pegazo'}
                        </span>
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {c.nit ? `NIT ${c.nit}` : c.type}
                      </p>
                    </div>
                    <span className="flex-none text-xs font-semibold text-orange-600">
                      Ver contabilidad →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal nueva empresa (solo contabilidad) */}
      {creating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setCreating(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Nueva empresa</h2>
              <button onClick={() => setCreating(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-xs text-gray-500">
              Para un cliente que no está en Pegazo. Le llevarás la contabilidad
              con asientos manuales.
            </p>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Nombre de la empresa *
            </label>
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
                <input
                  value={creating.nit}
                  onChange={(e) => setCreating({ ...creating, nit: e.target.value })}
                  placeholder="Opcional"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Régimen</label>
                <select
                  value={creating.taxRegime}
                  onChange={(e) => setCreating({ ...creating, taxRegime: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">—</option>
                  <option value="SIMPLE">Simple</option>
                  <option value="ORDINARIO">Ordinario</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setCreating(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveCompany}
                disabled={busy || !creating.name.trim()}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {busy ? 'Creando…' : 'Crear empresa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
