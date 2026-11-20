'use client';

import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { formatCOP, formatDateOnly, formatDateTime } from '@/lib/api/utils/utils';
import { useAuth } from '@/context/authContext';
import Button from '@/components/ui/Button';

// Recibo de abono: para imprimir o compartir por WhatsApp con el cliente.
// `payment` es el abono y `loan` el préstamo ya actualizado (con summary).
export default function LoanReceiptModal({ payment, loan, onClose }) {
  const { usuario } = useAuth();
  if (!payment || !loan) return null;
  const s = loan.summary || {};
  const company = usuario?.company || {};
  const kind = payment.allocation?.type === 'LIQUIDACION' ? 'Liquidación' : payment.allocation?.type === 'CAPITAL_EXTRA' ? 'Abono a capital' : 'Abono';
  const lines = [
    `*${company.name || 'Recibo'}* — ${kind} ${loan.code}`,
    `Cliente: ${loan.customer?.name || ''}`,
    `Fecha: ${formatDateTime(payment.paidAt)}`,
    `Valor: ${formatCOP(payment.amount)} (${payment.method || 'EFECTIVO'})`,
    `Capital ${formatCOP(payment.capitalApplied || 0)} · Interés ${formatCOP(payment.interestApplied || 0)}${payment.moraApplied ? ` · Mora ${formatCOP(payment.moraApplied)}` : ''}`,
    `Saldo pendiente: ${formatCOP(s.pendingTotal || 0)}`,
    s.nextDueDate ? `Próxima cuota: ${formatDateOnly(s.nextDueDate)} por ${formatCOP(s.nextInstallmentAmount || 0)}` : '¡Préstamo al día y saldado!',
    '¡Gracias por tu pago!',
  ];
  const text = lines.join('\n');
  const phone = String(loan.customer?.phone || '').replace(/\s+/g, '');
  const wa = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

  const print = () => {
    const w = window.open('', '_blank', 'width=420,height=640');
    if (!w) return;
    w.document.write(`<html><head><title>Recibo ${loan.code}</title><style>body{font-family:ui-monospace,monospace;padding:16px;max-width:360px}h2{margin:0 0 4px;font-size:16px}p{margin:2px 0;font-size:13px}hr{border:0;border-top:1px dashed #999;margin:8px 0}.b{font-weight:700}</style></head><body>
      <h2>${company.name || ''}</h2><p>${kind} · ${loan.code}</p><hr/>
      <p>Cliente: ${loan.customer?.name || ''}</p><p>Fecha: ${formatDateTime(payment.paidAt)}</p><hr/>
      <p class="b">Valor: ${formatCOP(payment.amount)} (${payment.method || 'EFECTIVO'})</p>
      <p>Capital: ${formatCOP(payment.capitalApplied || 0)}</p><p>Interés: ${formatCOP(payment.interestApplied || 0)}</p><p>Mora: ${formatCOP(payment.moraApplied || 0)}</p><hr/>
      <p class="b">Saldo pendiente: ${formatCOP(s.pendingTotal || 0)}</p>
      <p>${s.nextDueDate ? `Próxima cuota: ${formatDateOnly(s.nextDueDate)} · ${formatCOP(s.nextInstallmentAmount || 0)}` : 'Préstamo saldado'}</p>
      <p>Atendió: ${payment.createdBy?.name || usuario?.name || ''}</p><hr/><p>¡Gracias por tu pago!</p>
      <script>window.print();<\/script></body></html>`);
    w.document.close();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recibo de {kind.toLowerCase()}</h3>
            <p className="text-sm text-gray-500">{loan.code} · {loan.customer?.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 font-mono text-sm text-gray-800">
          <p className="text-2xl font-bold text-gray-900">{formatCOP(payment.amount)}</p>
          <p className="text-xs text-gray-500">{formatDateTime(payment.paidAt)} · {payment.method || 'EFECTIVO'}</p>
          <div className="mt-2 space-y-0.5 text-xs">
            <p>Capital: {formatCOP(payment.capitalApplied || 0)}</p>
            <p>Interés: {formatCOP(payment.interestApplied || 0)}</p>
            <p>Mora: {formatCOP(payment.moraApplied || 0)}</p>
          </div>
          <div className="mt-2 border-t border-dashed border-gray-300 pt-2 text-xs">
            <p className="font-semibold">Saldo pendiente: {formatCOP(s.pendingTotal || 0)}</p>
            <p>{s.nextDueDate ? `Próxima cuota: ${formatDateOnly(s.nextDueDate)} · ${formatCOP(s.nextInstallmentAmount || 0)}` : 'Préstamo saldado 🎉'}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" icon={PrinterIcon} onClick={print}>Imprimir</Button>
          {phone ? (
            <Button variant="success" href={wa} target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</Button>
          ) : (
            <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(text)}>Copiar texto</Button>
          )}
          <Button variant="primary" onClick={onClose}>Listo</Button>
        </div>
      </div>
    </div>
  );
}
