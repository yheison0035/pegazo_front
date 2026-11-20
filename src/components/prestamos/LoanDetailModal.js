'use client';

import { useCallback, useEffect, useState } from 'react';
import { XMarkIcon, BanknotesIcon, CheckCircleIcon, XCircleIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import {
  getLoanById,
  approveLoan,
  rejectLoan,
  disburseLoan,
  cancelLoan,
  annulLoanPayment,
  emitLoansChanged,
} from '@/lib/api/routes/loans';
import { formatCOP, formatDateOnly, formatDateTime } from '@/lib/api/utils/utils';
import { FREQ_LABEL, AMORT_LABEL, LOAN_STATUS_LABEL, overdueTone } from '@/lib/loanPlan';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/toastContext';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmModal from '@/components/ui/ConfirmModal';
import WhatsappLink from '@/components/dashboard/tables/segments/contentData/whatsappLink';
import AmortizationTable from './AmortizationTable';
import LoanPaymentModal from './LoanPaymentModal';

const OWNER = ['SUPER_ADMIN', 'ADMIN'];
const CAN_PAY = ['SUPER_ADMIN', 'ADMIN', 'CAJA', 'COBRADOR'];
const CAN_DISBURSE = ['SUPER_ADMIN', 'ADMIN', 'CAJA'];

function Stat({ label, value, tone = 'text-gray-900' }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-base font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

// Ficha completa de un préstamo: términos, estado, cuotas, abonos y acciones
// según el rol (aprobar/rechazar/desembolsar/abonar/anular).
export default function LoanDetailModal({ loanId, initial = null, onClose, onChanged }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const role = usuario?.role;
  const [loan, setLoan] = useState(initial);
  const [loading, setLoading] = useState(!initial);
  const [busy, setBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // { kind, paymentId?, title, message }
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    if (!loanId) return;
    try {
      const res = await getLoanById(loanId);
      setLoan(res?.data || null);
    } catch (err) {
      toast.show({ type: 'error', message: err?.message || 'No se pudo cargar el préstamo.' });
    } finally {
      setLoading(false);
    }
  }, [loanId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const changed = () => {
    emitLoansChanged();
    onChanged?.();
    load();
  };

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.show({ type: 'success', message: okMsg });
      changed();
    } catch (err) {
      toast.show({ type: 'error', message: err?.message || 'No se pudo completar la acción.' });
    } finally {
      setBusy(false);
      setConfirm(null);
      setReason('');
    }
  };

  const onConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === 'approve') return run(() => approveLoan(loan.id), 'Préstamo aprobado');
    if (confirm.kind === 'reject') return run(() => rejectLoan(loan.id, reason), 'Préstamo rechazado');
    if (confirm.kind === 'disburse') return run(() => disburseLoan(loan.id, { method: confirm.method || 'EFECTIVO' }), 'Préstamo desembolsado');
    if (confirm.kind === 'cancel') return run(() => cancelLoan(loan.id, reason), 'Préstamo anulado');
    if (confirm.kind === 'annul') return run(() => annulLoanPayment(loan.id, confirm.paymentId, reason), 'Abono anulado');
    return null;
  };

  const s = loan?.summary || {};
  const tone = overdueTone(s.overdueDays);
  const isOwner = OWNER.includes(role);
  const active = loan?.status === 'DESEMBOLSADO';
  const payments = loan?.payments || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Encabezado */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{loan?.code || 'Préstamo'}</h3>
              {loan && <StatusBadge status={loan.status === 'DESEMBOLSADO' ? s.status : loan.status} />}
              {active && s.overdueDays > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone.cls}`}>Mora {tone.label}</span>
              )}
            </div>
            {loan && (
              <p className="mt-0.5 text-sm text-gray-500">
                {loan.customer?.name} · {loan.customer?.document || 'sin documento'}
                {loan.customer?.phone ? <> · <WhatsappLink phone={loan.customer.phone} message={`Hola ${loan.customer?.name}, te escribimos por tu préstamo ${loan.code}.`} className="inline-flex" /></> : null}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading || !loan ? (
            <p className="text-sm text-gray-400">Cargando…</p>
          ) : (
            <>
              {/* Términos */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Capital" value={formatCOP(loan.principal)} />
                <Stat label="Tasa" value={`${loan.interestRate}% mensual`} />
                <Stat label="Plazo" value={`${loan.termCount} cuotas · ${FREQ_LABEL[loan.frequency] || loan.frequency}`} />
                <Stat label="Sistema" value={AMORT_LABEL[loan.amortization] || loan.amortization} />
                <Stat label="Total a pagar" value={formatCOP(loan.totalAmount)} />
                <Stat label="Intereses" value={formatCOP(loan.totalInterest)} />
                <Stat label="Mora" value={`${loan.moraRate}% mensual${loan.graceDays ? ` · ${loan.graceDays}d gracia` : ''}`} />
                <Stat label="Cobrador" value={loan.collector?.name || 'Sin asignar'} />
              </div>

              {active && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Stat label="Pagado" value={formatCOP(s.paidTotal || 0)} tone="text-emerald-700" />
                  <Stat label="Deuda a hoy" value={formatCOP(s.pendingTotal || 0)} />
                  <Stat label="Vencido" value={formatCOP(s.overdueAmount || 0)} tone={s.overdueAmount ? 'text-red-700' : 'text-gray-900'} />
                  <Stat label="Próxima cuota" value={s.nextDueDate ? `${formatDateOnly(s.nextDueDate)} · ${formatCOP(s.nextInstallmentAmount || 0)}` : '—'} />
                </div>
              )}

              {loan.notes && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{loan.notes}</p>}

              {/* Acciones por estado y rol */}
              <div className="mt-4 flex flex-wrap gap-2">
                {active && CAN_PAY.includes(role) && (
                  <Button variant="primary" icon={BanknotesIcon} onClick={() => setPayOpen(true)}>Registrar abono</Button>
                )}
                {loan.status === 'SOLICITADO' && isOwner && (
                  <>
                    <Button variant="add" icon={CheckCircleIcon} onClick={() => setConfirm({ kind: 'approve', title: 'Aprobar préstamo', message: `Aprobar ${loan.code} por ${formatCOP(loan.principal)} para ${loan.customer?.name}.` })}>Aprobar</Button>
                    <Button variant="danger-soft" icon={XCircleIcon} onClick={() => setConfirm({ kind: 'reject', title: 'Rechazar préstamo', message: 'Indica el motivo del rechazo.', withReason: true })}>Rechazar</Button>
                  </>
                )}
                {['SOLICITADO', 'APROBADO'].includes(loan.status) && CAN_DISBURSE.includes(role) && (
                  <>
                    <Button variant="success" onClick={() => setConfirm({ kind: 'disburse', method: 'EFECTIVO', title: 'Desembolsar en efectivo', message: `Entregar ${formatCOP(loan.principal)} en efectivo (sale de la caja abierta de la sede).` })}>Desembolsar efectivo</Button>
                    <Button variant="outline" onClick={() => setConfirm({ kind: 'disburse', method: 'TRANSFERENCIA', title: 'Desembolsar por transferencia', message: `Registrar el desembolso de ${formatCOP(loan.principal)} por transferencia.` })}>Desembolsar transferencia</Button>
                  </>
                )}
                {isOwner && !['PAGADO', 'ANULADO', 'RECHAZADO'].includes(loan.status) && (
                  <Button variant="danger-soft" onClick={() => setConfirm({ kind: 'cancel', title: 'Anular préstamo', message: 'Solo se puede anular si no tiene abonos. Si fue desembolsado en efectivo, el dinero vuelve a caja.', withReason: true })}>Anular préstamo</Button>
                )}
              </div>

              {/* Cuotas */}
              <h4 className="mb-2 mt-5 text-sm font-semibold text-gray-800">Plan de pagos</h4>
              {loan.installments?.length ? (
                <AmortizationTable installments={loan.installments} withStatus compact />
              ) : (
                <p className="text-sm text-gray-400">El plan de cuotas se genera al desembolsar.</p>
              )}

              {/* Abonos */}
              <h4 className="mb-2 mt-5 text-sm font-semibold text-gray-800">Abonos ({payments.filter((p) => p.status === 'ACTIVO').length})</h4>
              {payments.length ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2">Medio</th>
                        <th className="px-3 py-2 text-right">Valor</th>
                        <th className="px-3 py-2 text-right">Capital</th>
                        <th className="px-3 py-2 text-right">Interés</th>
                        <th className="px-3 py-2 text-right">Mora</th>
                        <th className="px-3 py-2">Registró</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {payments.map((p) => (
                        <tr key={p.id} className={p.status === 'ANULADO' ? 'text-gray-400 line-through' : ''}>
                          <td className="px-3 py-1.5">{formatDateTime(p.paidAt)}</td>
                          <td className="px-3 py-1.5">{p.method}</td>
                          <td className="px-3 py-1.5 text-right font-semibold">{formatCOP(p.amount)}</td>
                          <td className="px-3 py-1.5 text-right">{formatCOP(p.capitalApplied)}</td>
                          <td className="px-3 py-1.5 text-right">{formatCOP(p.interestApplied)}</td>
                          <td className="px-3 py-1.5 text-right">{formatCOP(p.moraApplied)}</td>
                          <td className="px-3 py-1.5">{p.createdBy?.name || '—'}{p.note ? <span className="block text-xs text-gray-400">{p.note}</span> : null}</td>
                          <td className="px-3 py-1.5 text-right">
                            {p.status === 'ACTIVO' && isOwner ? (
                              <button
                                type="button"
                                aria-label={`Anular abono ${p.id}`}
                                title="Anular abono"
                                onClick={() => setConfirm({ kind: 'annul', paymentId: p.id, title: 'Anular abono', message: `Se revierte el abono de ${formatCOP(p.amount)} en las cuotas y, si fue en efectivo, sale de caja.`, withReason: true })}
                                className="rounded-lg border border-red-200 p-1 text-red-600 hover:bg-red-50"
                              >
                                <ArrowUturnLeftIcon className="h-4 w-4" />
                              </button>
                            ) : p.status === 'ANULADO' ? (
                              <span className="text-xs">Anulado</span>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sin abonos todavía.</p>
              )}
            </>
          )}
        </div>
      </div>

      {payOpen && loan && (
        <LoanPaymentModal loan={loan} onClose={() => setPayOpen(false)} onSaved={() => changed()} />
      )}

      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={
          <div>
            <p>{confirm?.message}</p>
            {confirm?.withReason && (
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo (opcional)"
                className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            )}
          </div>
        }
        tone={confirm?.kind === 'approve' || confirm?.kind === 'disburse' ? 'primary' : 'danger'}
        loading={busy}
        onConfirm={onConfirm}
        onCancel={() => { setConfirm(null); setReason(''); }}
      />
    </div>
  );
}
