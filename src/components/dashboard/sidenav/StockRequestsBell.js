'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BellAlertIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/toastContext';
import { getPendingStockRequestCount } from '@/lib/api/routes/stock-requests';

// Campana de solicitudes de disminución de stock. Solo la ven dueño/admin.
// Muestra un contador rojo con las pendientes y se mantiene visible hasta que
// se aprueben o rechacen todas. Sondea cada 20s y avisa (toast) cuando entra
// una nueva. El badge no desaparece hasta llegar a cero.
export default function StockRequestsBell({ expanded }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const [count, setCount] = useState(0);
  const prev = useRef(null);

  const isApprover = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);

  const poll = useCallback(async () => {
    if (!isApprover) return;
    try {
      const { data } = await getPendingStockRequestCount();
      const c = Number(data?.count) || 0;
      setCount(c);
      if (prev.current != null && c > prev.current) {
        toast.show({
          type: 'warning',
          title: 'Solicitud de stock',
          message: 'Tienes una nueva solicitud de disminución por aprobar.',
        });
      }
      prev.current = c;
    } catch {
      // silencioso: la campana no debe romper la navegación
    }
  }, [isApprover, toast]);

  useEffect(() => {
    if (!isApprover) return;
    poll();
    const t = setInterval(poll, 20000);
    const onChange = () => poll();
    window.addEventListener('stock-requests-changed', onChange);
    return () => {
      clearInterval(t);
      window.removeEventListener('stock-requests-changed', onChange);
    };
  }, [isApprover, poll]);

  if (!isApprover) return null;

  return (
    <div className="border-t border-white/10 px-2 py-3">
      <Link
        href="/dashboard/inventory/stock-requests"
        title="Solicitudes de disminución de stock"
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-gray-300 transition hover:bg-white/10"
      >
        <span className="relative flex-none">
          <BellAlertIcon
            className={`h-6 w-6 ${count > 0 ? 'text-red-400' : 'text-orange-300'}`}
          />
          {count > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </span>
        {expanded && (
          <span className="flex items-center gap-2 whitespace-nowrap text-sm font-medium">
            Solicitudes de stock
            {count > 0 && (
              <span className="rounded-full bg-red-500/90 px-1.5 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </span>
        )}
      </Link>
    </div>
  );
}
