'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/toastContext';
import { formatCOP } from '@/lib/api/utils/utils';
import {
  getPendingBankDeposits,
  markBankDepositSeen,
} from '@/lib/api/routes/bank';

const VIEW_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'RECEPCIONISTA',
  'CAJA',
  'ASESOR',
  'VENTAS',
];

// Anuncia con VOZ el valor y (si viene) el nombre de quien consignó.
function speak(text) {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-CO';
    u.rate = 1;
    window.speechSynthesis.speak(u);
  } catch {
    /* el navegador puede bloquear la voz hasta que el usuario interactúe */
  }
}

// Vigila las consignaciones nuevas a la cuenta del banco y las anuncia en
// tiempo real (voz + notificación). Sondea cada pocos segundos.
export default function BankDepositNotifier() {
  const { usuario } = useAuth();
  const toast = useToast();
  const processed = useRef(new Set());
  const primed = useRef(false);

  const enabled = !!usuario?.company?.bankNotifyEnabled;
  const canSee = VIEW_ROLES.includes(usuario?.role);

  useEffect(() => {
    if (!enabled || !canSee) return;

    let alive = true;

    const check = async () => {
      try {
        const res = await getPendingBankDeposits();
        const list = res?.data || [];
        for (const d of list) {
          if (processed.current.has(d.id)) continue;
          processed.current.add(d.id);
          // Marca vista en el backend para no repetirla.
          markBankDepositSeen(d.id).catch(() => {});

          const nombre = d.senderName ? ` de ${d.senderName}` : '';
          toast.show({
            type: 'success',
            title: '💰 Consignación recibida',
            message: `${formatCOP(d.amount)}${nombre}`,
            duration: 12000,
          });
          speak(
            `Recibiste una consignación de ${Math.round(d.amount)} pesos${
              d.senderName ? `, de ${d.senderName}` : ''
            }`
          );
        }
      } catch {
        /* silencioso: reintenta en el siguiente ciclo */
      }
    };

    // Primera pasada: marca lo pendiente como "ya visto" SIN anunciar, para no
    // gritar consignaciones viejas al abrir el CRM. Luego sí anuncia lo nuevo.
    const prime = async () => {
      try {
        const res = await getPendingBankDeposits();
        for (const d of res?.data || []) {
          processed.current.add(d.id);
          markBankDepositSeen(d.id).catch(() => {});
        }
      } catch {
        /* ignora */
      } finally {
        primed.current = true;
      }
    };

    prime();
    const t = setInterval(() => {
      if (alive && primed.current) check();
    }, 7000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [enabled, canSee, toast]);

  return null;
}
