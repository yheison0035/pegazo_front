'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/toastContext';
import { formatCOP } from '@/lib/api/utils/utils';
import {
  getPendingBankDeposits,
  markBankDepositSeen,
} from '@/lib/api/routes/bank';
import { announceDeposit } from '@/lib/bankSound';

// Vigila las consignaciones nuevas a la cuenta del banco y las anuncia en
// tiempo real (voz + notificación). Sondea cada pocos segundos. Lo puede oír/ver
// CUALQUIER rol del negocio (todos deben enterarse de que entró plata).
export default function BankDepositNotifier() {
  const { usuario } = useAuth();
  const toast = useToast();
  const processed = useRef(new Set());

  const enabled = !!usuario?.company?.bankNotifyEnabled;
  const canSee = !!usuario?.role; // cualquier rol autenticado

  // Desbloquea la voz del navegador en la primera interacción del usuario
  // (política de autoplay): así los avisos programados sí suenan después.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const unlock = () => {
      try {
        window.speechSynthesis.resume();
        const u = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(u);
      } catch {
        /* ignora */
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !canSee) return;

    let alive = true;
    // Todo lo que llegó ANTES de este momento (menos un pequeño margen) se
    // considera "viejo" y se marca visto en silencio, para no gritar el
    // historial al abrir el CRM. Lo que llegue de aquí en adelante —o justo
    // segundos antes de cargar— SÍ se anuncia en tiempo real.
    const cutoff = Date.now() - 90 * 1000; // 90s de margen

    const check = async () => {
      try {
        const res = await getPendingBankDeposits();
        const list = res?.data || [];
        for (const d of list) {
          if (processed.current.has(d.id)) continue;
          processed.current.add(d.id);
          // Marca vista en el backend para no repetirla (en cualquier caso).
          markBankDepositSeen(d.id).catch(() => {});

          const created = new Date(d.createdAt).getTime();
          const esViejo = Number.isFinite(created) && created < cutoff;
          if (esViejo) continue; // historial: no anunciar, solo marcar visto

          const nombre = d.senderName ? ` de ${d.senderName}` : '';
          toast.show({
            type: 'success',
            title: '💰 Consignación recibida',
            message: `${formatCOP(d.amount)}${nombre}`,
            duration: 12000,
          });
          announceDeposit(d.amount, d.senderName);
        }
      } catch {
        /* silencioso: reintenta en el siguiente ciclo */
      }
    };

    check(); // primera pasada inmediata (anuncia lo reciente)
    const t = setInterval(() => {
      if (alive) check();
    }, 5000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [enabled, canSee, toast]);

  return null;
}
