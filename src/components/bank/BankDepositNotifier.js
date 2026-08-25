'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/toastContext';
import { formatCOP } from '@/lib/api/utils/utils';
import {
  getPendingBankDeposits,
  markBankDepositSeen,
} from '@/lib/api/routes/bank';
import { announceDeposit, primeAudio } from '@/lib/bankSound';

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
    if (typeof window === 'undefined') return;
    // Se mantiene activo: cada interacción reactiva el audio (los navegadores
    // suspenden el AudioContext/voz tras un rato de inactividad; así seguimos
    // "desbloqueados" para el próximo aviso).
    const unlock = () => primeAudio();
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

        // Recolecta las NUEVAS de esta pasada (aún no procesadas). A todas se
        // les marca "vista" para no repetirlas.
        const nuevas = [];
        for (const d of list) {
          if (processed.current.has(d.id)) continue;
          processed.current.add(d.id);
          markBankDepositSeen(d.id).catch(() => {});
          const created = new Date(d.createdAt).getTime();
          if (Number.isFinite(created) && created >= cutoff) nuevas.push(d);
        }
        if (!nuevas.length) return;

        // Si llegan VARIAS de golpe (p. ej. un reenvío en lote del correo), se
        // anuncia SOLO la más reciente; el resto se marca vista en silencio.
        nuevas.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        const d = nuevas[0];
        const nombre = d.senderName ? ` de ${d.senderName}` : '';
        toast.show({
          type: 'success',
          title: '💰 Consignación recibida',
          message: `${formatCOP(d.amount)}${nombre}`,
          duration: 12000,
        });
        announceDeposit(d.amount, d.senderName);
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
