'use client';

import { useCallback, useEffect, useState } from 'react';
import { BanknotesIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getCreditProfile, saveCreditProfile, getLoanProducts, getLoans, getLoanCollectors } from '@/lib/api/routes/loans';
import { formatCOP, formatDateOnly } from '@/lib/api/utils/utils';
import { LOAN_STATUS_LABEL } from '@/lib/loanPlan';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/toastContext';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import StatusBadge from '@/components/ui/StatusBadge';
import LoanDetailModal from './LoanDetailModal';
import NewLoanModal from './NewLoanModal';

const inputCls = 'mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';
const CAN_EDIT = ['SUPER_ADMIN', 'ADMIN', 'ANALISTA'];
const CAN_CREATE = ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'CAJA'];
const SOURCE = { LOAN: 'préstamo', CUSTOMER: 'cliente', PRODUCT: 'producto', COMPANY: 'empresa', NONE: '—' };

// Perfil crediticio en la ficha del cliente (solo negocios con módulo
// 'prestamos'): tasa propia, cupo, categoría, datos del estudio, codeudor,
// cobrador por defecto y sus préstamos.
export default function CreditProfileCard({ customerId, customer }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const role = usuario?.role;
  const [data, setData] = useState(null);
  const [loans, setLoans] = useState([]);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [products, setProducts] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [newLoan, setNewLoan] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, l] = await Promise.all([getCreditProfile(customerId), getLoans({ customerId, status: 'ALL' })]);
      setData(p?.data || null);
      setLoans(Array.isArray(l?.data?.items) ? l.data.items : []);
    } catch {
      setData(null);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = async () => {
    const pr = data?.profile || {};
    setForm({
      productId: pr.productId || '',
      customRate: pr.customRate ?? '',
      creditLimit: pr.creditLimit ?? '',
      riskCategory: pr.riskCategory || '',
      monthlyIncome: pr.monthlyIncome ?? '',
      occupation: pr.occupation || '',
      workplace: pr.workplace || '',
      guarantorName: pr.guarantorName || '',
      guarantorDocument: pr.guarantorDocument || '',
      guarantorPhone: pr.guarantorPhone || '',
      collectorId: pr.collectorId || '',
      blocked: !!pr.blocked,
      notes: pr.notes || '',
    });
    setEdit(true);
    try {
      const [p, u] = await Promise.all([getLoanProducts(), getLoanCollectors()]);
      setProducts(Array.isArray(p?.data) ? p.data : []);
      setCollectors(Array.isArray(u?.data) ? u.data : []);
    } catch {
      /* selects vacíos */
    }
  };

  const save = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const dto = {
        productId: form.productId ? Number(form.productId) : null,
        customRate: form.customRate === '' ? null : Number(form.customRate),
        creditLimit: form.creditLimit === '' ? null : Number(form.creditLimit),
        riskCategory: form.riskCategory || null,
        monthlyIncome: form.monthlyIncome === '' ? null : Number(form.monthlyIncome),
        occupation: form.occupation || null,
        workplace: form.workplace || null,
        guarantorName: form.guarantorName || null,
        guarantorDocument: form.guarantorDocument || null,
        guarantorPhone: form.guarantorPhone || null,
        collectorId: form.collectorId ? Number(form.collectorId) : null,
        blocked: !!form.blocked,
        notes: form.notes || null,
      };
      await saveCreditProfile(customerId, dto);
      toast.show({ type: 'success', message: 'Perfil crediticio guardado' });
      setEdit(false);
      load();
    } catch (err) {
      toast.show({ type: 'error', message: err?.message || 'No se pudo guardar el perfil.' });
    } finally {
      setSaving(false);
    }
  };

  const pr = data?.profile;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <BanknotesIcon className="h-5 w-5 text-orange-500" /> Crédito
        </h3>
        <div className="flex gap-2">
          {CAN_EDIT.includes(role) && (
            <Button variant="secondary" size="sm" icon={PencilSquareIcon} onClick={openEdit}>Perfil crediticio</Button>
          )}
          {CAN_CREATE.includes(role) && !pr?.blocked && (
            <Button variant="primary" size="sm" onClick={() => setNewLoan(true)}>Nuevo préstamo</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Tasa efectiva</p>
          <p className="font-semibold text-gray-900">{data?.effectiveRate ? `${data.effectiveRate.rate}% mensual` : '—'}</p>
          <p className="text-[11px] text-gray-400">según {SOURCE[data?.effectiveRate?.source] || '—'}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Capital en préstamos</p>
          <p className="font-semibold text-gray-900">{formatCOP(data?.outstandingCapital || 0)}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Cupo disponible</p>
          <p className="font-semibold text-gray-900">{data?.availableCredit == null ? 'Sin cupo definido' : formatCOP(data.availableCredit)}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Estado</p>
          <p className={`font-semibold ${pr?.blocked ? 'text-red-600' : 'text-emerald-700'}`}>{pr?.blocked ? 'Bloqueado para crédito' : 'Habilitado'}</p>
          {pr?.riskCategory && <p className="text-[11px] text-gray-400">Categoría {pr.riskCategory}</p>}
        </div>
      </div>

      {pr && (pr.guarantorName || pr.collector || pr.occupation) && (
        <p className="mt-2 text-xs text-gray-500">
          {pr.occupation ? `${pr.occupation}${pr.workplace ? ` · ${pr.workplace}` : ''}` : ''}
          {pr.guarantorName ? ` · Codeudor: ${pr.guarantorName}${pr.guarantorPhone ? ` (${pr.guarantorPhone})` : ''}` : ''}
          {pr.collector ? ` · Cobrador: ${pr.collector.name}` : ''}
        </p>
      )}

      <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-800">Préstamos ({loans.length})</h4>
      {loans.length ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2 text-right">Capital</th>
                <th className="px-3 py-2 text-right">Deuda a hoy</th>
                <th className="px-3 py-2">Próxima cuota</th>
                <th className="px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans.map((l) => (
                <tr key={l.id} onClick={() => setDetail(l)} className="cursor-pointer hover:bg-orange-50/40">
                  <td className="px-3 py-1.5 font-medium text-gray-900">{l.code}</td>
                  <td className="px-3 py-1.5 text-gray-600">{formatDateOnly(l.disbursedAt || l.createdAt)}</td>
                  <td className="px-3 py-1.5 text-right">{formatCOP(l.principal)}</td>
                  <td className="px-3 py-1.5 text-right font-semibold">{formatCOP(l.summary?.pendingTotal || 0)}</td>
                  <td className="px-3 py-1.5 text-gray-600">{l.summary?.nextDueDate ? formatDateOnly(l.summary.nextDueDate) : '—'}</td>
                  <td className="px-3 py-1.5"><StatusBadge status={l.status === 'DESEMBOLSADO' ? l.summary?.status : l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Sin préstamos.</p>
      )}

      {edit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setEdit(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Perfil crediticio</h3>
                <p className="text-sm text-gray-500">{customer?.name}</p>
              </div>
              <button type="button" onClick={() => setEdit(false)} aria-label="Cerrar" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Producto / categoría de crédito</span>
                <select name="productId" value={form.productId} onChange={(e) => set('productId', e.target.value)} className={inputCls}>
                  <option value="">Sin producto</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.interestRate}%</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Tasa propia (% mensual)</span>
                <input name="customRate" type="number" step="0.01" min="0" value={form.customRate} onChange={(e) => set('customRate', e.target.value)} placeholder="Usar la del producto / empresa" className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Cupo máximo</span>
                <MoneyInput name="creditLimit" value={form.creditLimit} onChange={(v) => set('creditLimit', v)} placeholder="Sin cupo" className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Categoría de riesgo</span>
                <input name="riskCategory" value={form.riskCategory} onChange={(e) => set('riskCategory', e.target.value)} placeholder="A, B, C…" className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Ingresos mensuales</span>
                <MoneyInput name="monthlyIncome" value={form.monthlyIncome} onChange={(v) => set('monthlyIncome', v)} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Ocupación</span>
                <input name="occupation" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} className={inputCls} />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-xs font-medium text-gray-500">Lugar de trabajo</span>
                <input name="workplace" value={form.workplace} onChange={(e) => set('workplace', e.target.value)} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Codeudor</span>
                <input name="guarantorName" value={form.guarantorName} onChange={(e) => set('guarantorName', e.target.value)} placeholder="Nombre" className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Documento codeudor</span>
                <input name="guarantorDocument" value={form.guarantorDocument} onChange={(e) => set('guarantorDocument', e.target.value)} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Teléfono codeudor</span>
                <input name="guarantorPhone" value={form.guarantorPhone} onChange={(e) => set('guarantorPhone', e.target.value)} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Cobrador por defecto</span>
                <select name="collectorId" value={form.collectorId} onChange={(e) => set('collectorId', e.target.value)} className={inputCls}>
                  <option value="">Sin asignar</option>
                  {collectors.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-xs font-medium text-gray-500">Notas</span>
                <input name="notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} className={inputCls} />
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="blocked" checked={!!form.blocked} onChange={(e) => set('blocked', e.target.checked)} />
                <span className="font-medium text-red-700">Bloquear para crédito</span>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEdit(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" loading={saving}>Guardar perfil</Button>
            </div>
          </form>
        </div>
      )}

      {detail && <LoanDetailModal loanId={detail.id} initial={detail} onClose={() => setDetail(null)} onChanged={load} />}
      <NewLoanModal open={newLoan} onClose={() => setNewLoan(false)} onCreated={load} initial={{ customer: customer ? { id: Number(customerId), ...customer } : { id: Number(customerId), name: data?.customer?.name } }} />
    </div>
  );
}
