'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExclamationTriangleIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import { notifySubscriptionDue } from '@/lib/api/routes/notifications';
import PayModal from './PayModal';

const OWNER_ROLES = ['SUPER_ADMIN', 'ADMIN'];
const DAY = 86400000;

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / DAY);
}

// Aviso de vencimiento del plan. Solo dueño/admin. Al iniciar sesión, si faltan
// ≤ 3 días (o ya venció), muestra un modal que SOLO se cierra con "Aceptar"
// (una vez por sesión y por fecha de vencimiento) y crea el aviso en la campana.
export default function SubscriptionDueModal() {
  const { usuario } = useAuth();
  const company = usuario?.company;
  const paidUntil = company?.paidUntil;
  const isOwner = OWNER_ROLES.includes(usuario?.role);

  const days = useMemo(() => daysUntil(paidUntil), [paidUntil]);
  const eligible = isOwner && days != null && days <= 3;

  const ackKey = paidUntil
    ? `pegazo:subdue-ack:${new Date(paidUntil).toISOString().slice(0, 10)}`
    : null;

  const [show, setShow] = useState(false);
  const [showPay, setShowPay] = useState(false);

  useEffect(() => {
    if (!eligible || !ackKey) return;
    let acked = false;
    try {
      acked = sessionStorage.getItem(ackKey) === '1';
    } catch {
      /* ignora */
    }
    if (!acked) setShow(true);

    // Crea (idempotente) el aviso en la campana y refresca su contador.
    notifySubscriptionDue()
      .then(() => window.dispatchEvent(new Event('notifications-changed')))
      .catch(() => {});
  }, [eligible, ackKey]);

  const accept = () => {
    try {
      if (ackKey) sessionStorage.setItem(ackKey, '1');
    } catch {
      /* ignora */
    }
    setShow(false);
  };

  if (!eligible) return null;

  const expired = days <= 0;
  const title = expired ? 'Tu plan venció' : 'Tu plan está por vencer';
  const message = expired
    ? 'Tu plan ya venció. Realiza el pago para no perder el acceso a tu negocio.'
    : days === 1
      ? 'Falta 1 día para que venza tu plan. Realiza el pago para no perder el acceso.'
      : `Faltan ${days} días para que venza tu plan. Realiza el pago a tiempo.`;

  return (
    <>
      {show && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div
              className={`px-6 py-4 ${
                expired
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
            >
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <ExclamationTriangleIcon className="h-6 w-6" /> {title}
              </h3>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-gray-600">{message}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={accept}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => setShowPay(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  <BanknotesIcon className="h-5 w-5" /> Pagar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PayModal
        open={showPay}
        onClose={() => setShowPay(false)}
        company={company}
      />
    </>
  );
}
