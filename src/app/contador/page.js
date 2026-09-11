'use client';

import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  KeyIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import {
  getAccountantMe,
  getAccountantPortfolio,
} from '@/lib/api/routes/accountant';

export default function ContadorPortal() {
  const [me, setMe] = useState(null);
  const [companies, setCompanies] = useState([]);
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
          <div className="mb-3 flex items-center gap-2">
            <BuildingOffice2Icon className="h-5 w-5 text-orange-500" />
            <h2 className="text-sm font-bold text-gray-800">Tus empresas</h2>
          </div>
          {companies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-gray-400">
              Aún no tienes empresas enlazadas.
              <p className="mt-1 text-xs">
                Comparte tu llave <b>{me?.accountantKey || ''}</b> con el negocio:
                al activar Contabilidad y enlazarte, aparecerá aquí.
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
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {c.type}
                        {c.nit ? ` · NIT ${c.nit}` : ''}
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
    </div>
  );
}
