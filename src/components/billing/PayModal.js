'use client';

import { useEffect, useState } from 'react';
import {
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { getPlatformPaymentSettings } from '@/lib/api/routes/platformPayment';
import { formatCOP } from '@/lib/api/utils/utils';

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

// Modal "Pagar": dos columnas. Izquierda, a qué cuenta consignar (con valor y
// fecha). Derecha, a qué WhatsApp enviar el comprobante. Los datos de la cuenta
// vienen de la config global de la plataforma (editable en SUPER_PLATFORM).
export default function PayModal({ open, onClose, company }) {
  const [settings, setSettings] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    getPlatformPaymentSettings()
      .then(({ data }) => alive && setSettings(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [open]);

  if (!open) return null;

  const amount = company?.monthlyPrice;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(settings?.accountNumber || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  const wa = (settings?.whatsappNumber || '').replace(/[^\d]/g, '');
  const waFull = wa.startsWith('57') ? wa : `57${wa}`;
  const waMsg = encodeURIComponent(
    `Hola, adjunto el comprobante de pago de mi plan Pegazo${
      company?.name ? ` (${company.name})` : ''
    }.`,
  );

  const Field = ({ label, children }) => (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="text-sm font-semibold text-gray-800">{children}</div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <BanknotesIcon className="h-6 w-6" /> Pagar mi plan
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-0 sm:grid-cols-2">
          {/* Columna 1: datos de la cuenta */}
          <div className="space-y-4 border-b border-gray-100 p-6 sm:border-b-0 sm:border-r">
            <p className="text-sm font-bold text-gray-800">
              1. Consigna o transfiere a:
            </p>
            {!settings ? (
              <p className="text-sm text-gray-400">Cargando datos…</p>
            ) : (
              <div className="space-y-3">
                <Field label="Banco">
                  {settings.bankName} · {settings.accountType}
                </Field>
                <Field label="Número de cuenta">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base tracking-wide">
                      {settings.accountNumber || '—'}
                    </span>
                    <button
                      onClick={copy}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50"
                    >
                      {copied ? (
                        <>
                          <CheckIcon className="h-3.5 w-3.5" /> Copiado
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="h-3.5 w-3.5" /> Copiar
                        </>
                      )}
                    </button>
                  </div>
                </Field>
                <Field label="Titular">{settings.accountHolder || '—'}</Field>
                <div className="rounded-xl bg-orange-50 p-3">
                  <Field label="Valor a pagar">
                    <span className="text-lg font-extrabold text-orange-600">
                      {amount ? formatCOP(amount) : 'Por definir'}
                    </span>
                  </Field>
                </div>
                <Field label="Fecha de pago (vence)">
                  {fmtDate(company?.paidUntil)}
                </Field>
                {company?.paymentDay ? (
                  <Field label="Día de pago">
                    Cada {company.paymentDay} de cada mes
                  </Field>
                ) : null}
              </div>
            )}
          </div>

          {/* Columna 2: enviar comprobante */}
          <div className="space-y-4 p-6">
            <p className="text-sm font-bold text-gray-800">
              2. Envía tu comprobante:
            </p>
            <p className="text-sm text-gray-600">
              {settings?.instructions ||
                'Después de pagar, envía la foto o PDF del comprobante por WhatsApp para activar/renovar tu plan.'}
            </p>
            {settings?.whatsappNumber && (
              <>
                <Field label="WhatsApp">
                  <span className="font-mono">{settings.whatsappNumber}</span>
                </Field>
                <a
                  href={`https://wa.me/${waFull}?text=${waMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  Enviar comprobante por WhatsApp
                </a>
              </>
            )}
            <p className="text-[11px] text-gray-400">
              Tu plan se renueva cuando confirmamos el pago. Guarda el
              comprobante.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
