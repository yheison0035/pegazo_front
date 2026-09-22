'use client';

// Muro de pago (estilo Alegra/Siigo/Treinta). Si la empresa venció
// (company.paidUntil < ahora), tapa TODO el CRM con una pantalla que bloquea los
// módulos y muestra cómo pagar. El backend además rechaza escrituras
// (SubscriptionInterceptor), así el bloqueo no se puede saltar. Se quita solo
// cuando la plataforma extiende paidUntil y el usuario pulsa "Ya pagué".

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/authContext';
import apiFetch from '@/lib/api/auth/client';
import { getPlatformPaymentSettings } from '@/lib/api/routes/platformPayment';
import {
  LockClosedIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const OWNER_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
function fmtCOP(n) {
  if (n == null || n === '') return '';
  return `$${Number(n).toLocaleString('es-CO')}`;
}

export default function PaymentWall() {
  const { usuario, setUsuario, logout } = useAuth();
  const [settings, setSettings] = useState(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  const company = usuario?.company;
  const paidUntil = company?.paidUntil;
  const isPlatform = usuario?.role === 'SUPER_PLATFORM_ADMIN';
  const overdue =
    !isPlatform && paidUntil && new Date(paidUntil).getTime() < Date.now();

  useEffect(() => {
    if (!overdue) return;
    getPlatformPaymentSettings()
      .then((r) => setSettings(r?.data || null))
      .catch(() => {});
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [overdue]);

  const recheck = useCallback(async () => {
    setChecking(true);
    try {
      const p = await apiFetch('/auth/me');
      if (p?.data) {
        localStorage.setItem('usuario', JSON.stringify(p.data));
        setUsuario(p.data);
      }
    } catch {
      /* si falla, seguimos mostrando el muro */
    } finally {
      setChecking(false);
    }
  }, [setUsuario]);

  if (!overdue) return null;

  const isOwner = OWNER_ROLES.has(usuario?.role);
  const wa = (settings?.whatsappNumber || '').replace(/\D/g, '');
  const waMsg = `Hola, soy de "${company?.name || ''}" y quiero renovar mi plan de Pegazo (venció el ${fmtDate(paidUntil)}). Adjunto el comprobante de pago.`;
  const waUrl = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(waMsg)}`
    : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(settings?.accountNumber || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* sin portapapeles */
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm">
      <div className="my-6 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 p-5 text-center text-white">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <LockClosedIcon className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold">Tu suscripción venció</h2>
          <p className="mt-0.5 text-sm text-white/85">
            Venció el {fmtDate(paidUntil)}. Tu cuenta está bloqueada hasta
            confirmar el pago.
          </p>
        </div>

        <div className="space-y-4 p-5">
          {!isOwner && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Pídele al administrador del negocio que realice el pago para
              reactivar el acceso.
            </div>
          )}

          {/* Valor + cuenta */}
          <div className="rounded-xl border border-gray-200 p-4">
            {company?.monthlyPrice ? (
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-sm text-gray-500">Valor a pagar</span>
                <span className="text-xl font-bold text-gray-900">
                  {fmtCOP(company.monthlyPrice)}
                  <span className="text-sm font-normal text-gray-500"> /mes</span>
                </span>
              </div>
            ) : null}

            {settings ? (
              <div className="space-y-1.5 text-sm">
                <div className="text-gray-500">
                  {settings.bankName} · {settings.accountType}
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <span className="font-mono text-base font-semibold text-gray-900">
                    {settings.accountNumber || '—'}
                  </span>
                  <button
                    onClick={copy}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-4 w-4 text-green-600" /> Copiado
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="h-4 w-4" /> Copiar
                      </>
                    )}
                  </button>
                </div>
                <div className="text-gray-500">
                  Titular:{' '}
                  <span className="text-gray-800">
                    {settings.accountHolder || '—'}
                  </span>
                </div>
                {settings.instructions && (
                  <p className="pt-1 text-xs text-gray-500">
                    {settings.instructions}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Cargando datos de pago…</p>
            )}
          </div>

          {/* Acciones */}
          <div className="space-y-2">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700"
              >
                Enviar comprobante por WhatsApp
              </a>
            )}
            <button
              onClick={recheck}
              disabled={checking}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowPathIcon
                className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`}
              />
              {checking ? 'Verificando…' : 'Ya pagué, verificar'}
            </button>
            <button
              onClick={logout}
              className="w-full rounded-xl px-4 py-2 text-sm font-medium text-gray-400 transition hover:text-gray-600"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
