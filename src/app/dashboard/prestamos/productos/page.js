'use client';

import { useCallback, useEffect, useState } from 'react';
import { RectangleStackIcon, PlusIcon, PencilSquareIcon, TrashIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LoanGuard, { LOAN_OWNER_ROLES, hasLoansModule } from '@/components/prestamos/LoanGuard';
import { useAuth } from '@/context/authContext';
import LoanSettingsForm from '@/components/prestamos/LoanSettingsForm';
import { getLoanProducts, createLoanProduct, updateLoanProduct, deleteLoanProduct } from '@/lib/api/routes/loans';
import { LOAN_FREQUENCIES, LOAN_AMORTIZATIONS, FREQ_LABEL, AMORT_LABEL } from '@/lib/loanPlan';
import { formatCOP } from '@/lib/api/utils/utils';
import { useToast } from '@/context/toastContext';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmModal from '@/components/ui/ConfirmModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

const inputCls = 'mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';
const EMPTY = { name: '', description: '', interestRate: '', moraRate: '', graceDays: 0, frequency: 'MENSUAL', amortization: 'SIMPLE', minTerm: '', maxTerm: '', minAmount: '', maxAmount: '', roundTo: 1, status: 'ACTIVO' };

function ProductModal({ item, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ ...EMPTY, ...(item || {}) });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast.show({ type: 'error', message: 'El nombre es obligatorio.' });
    if (f.interestRate === '' || Number(f.interestRate) < 0) return toast.show({ type: 'error', message: 'Indica la tasa mensual.' });
    setSaving(true);
    try {
      const dto = {
        name: f.name.trim(),
        description: f.description || undefined,
        interestRate: Number(f.interestRate),
        moraRate: f.moraRate === '' || f.moraRate === null ? null : Number(f.moraRate),
        graceDays: Number(f.graceDays) || 0,
        frequency: f.frequency,
        amortization: f.amortization,
        minTerm: f.minTerm ? Number(f.minTerm) : null,
        maxTerm: f.maxTerm ? Number(f.maxTerm) : null,
        minAmount: f.minAmount ? Number(f.minAmount) : null,
        maxAmount: f.maxAmount ? Number(f.maxAmount) : null,
        roundTo: Number(f.roundTo) || 1,
        status: f.status || 'ACTIVO',
      };
      if (item?.id) await updateLoanProduct(item.id, dto);
      else await createLoanProduct(dto);
      toast.show({ type: 'success', message: item?.id ? 'Producto actualizado' : 'Producto de crédito creado' });
      onSaved?.();
      onClose();
    } catch (err) {
      toast.show({ type: 'error', message: err?.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{item?.id ? 'Editar producto de crédito' : 'Nuevo producto de crédito'}</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2"><span className="text-xs font-medium text-gray-500">Nombre</span><input name="name" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej: Microcrédito, Paga diario, Cliente VIP" className={inputCls} /></label>
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Tasa (% mensual)</span><input name="interestRate" type="number" step="0.01" min="0" value={f.interestRate} onChange={(e) => set('interestRate', e.target.value)} placeholder="Ej: 3" className={inputCls} /></label>
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Mora (% mensual)</span><input name="moraRate" type="number" step="0.01" min="0" value={f.moraRate ?? ''} onChange={(e) => set('moraRate', e.target.value)} placeholder="Igual a la tasa" className={inputCls} /></label>
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Frecuencia</span><select name="frequency" value={f.frequency} onChange={(e) => set('frequency', e.target.value)} className={inputCls}>{LOAN_FREQUENCIES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Sistema</span><select name="amortization" value={f.amortization} onChange={(e) => set('amortization', e.target.value)} className={inputCls}>{LOAN_AMORTIZATIONS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Días de gracia</span><input name="graceDays" type="number" min="0" value={f.graceDays} onChange={(e) => set('graceDays', e.target.value)} className={inputCls} /></label>
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Redondear cuota a</span><select name="roundTo" value={f.roundTo} onChange={(e) => set('roundTo', e.target.value)} className={inputCls}><option value={1}>Pesos exactos</option><option value={100}>$100</option><option value={500}>$500</option><option value={1000}>$1.000</option></select></label>
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Plazo mínimo (cuotas)</span><input name="minTerm" type="number" min="1" value={f.minTerm ?? ''} onChange={(e) => set('minTerm', e.target.value)} className={inputCls} /></label>
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Plazo máximo (cuotas)</span><input name="maxTerm" type="number" min="1" value={f.maxTerm ?? ''} onChange={(e) => set('maxTerm', e.target.value)} className={inputCls} /></label>
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Monto mínimo</span><MoneyInput name="minAmount" value={f.minAmount ?? ''} onChange={(v) => set('minAmount', v)} className={inputCls} /></label>
          <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Monto máximo</span><MoneyInput name="maxAmount" value={f.maxAmount ?? ''} onChange={(v) => set('maxAmount', v)} className={inputCls} /></label>
          <label className="block text-sm sm:col-span-2"><span className="text-xs font-medium text-gray-500">Descripción (opcional)</span><input name="description" value={f.description || ''} onChange={(e) => set('description', e.target.value)} className={inputCls} /></label>
          {item?.id && (
            <label className="block text-sm"><span className="text-xs font-medium text-gray-500">Estado</span><select name="status" value={f.status} onChange={(e) => set('status', e.target.value)} className={inputCls}><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option></select></label>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={saving}>{item?.id ? 'Guardar' : 'Crear'}</Button>
        </div>
      </form>
    </div>
  );
}

export default function ProductosCreditoPage() {
  const toast = useToast();
  const { usuario } = useAuth();
  const enabled = hasLoansModule(usuario);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | {} | item
  const [del, setDel] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getLoanProducts({ all: 'true' });
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);
  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    if (!del) return;
    setDeleting(true);
    try {
      await deleteLoanProduct(del.id);
      toast.show({ type: 'success', message: 'Producto eliminado' });
      setDel(null);
      load();
    } catch (err) {
      toast.show({ type: 'error', message: err?.message || 'No se pudo eliminar.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <LoanGuard roles={LOAN_OWNER_ROLES}>
      <div className="w-full p-4">
        {loading && <LoadingOverlay />}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
              <RectangleStackIcon className="h-7 w-7 text-orange-500" /> Productos de crédito
            </h1>
            <p className="text-sm text-gray-500">Define tus líneas de crédito (tasa, mora, frecuencia, plazos y montos). Cada cliente puede tener la suya.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={Cog6ToothIcon} onClick={() => setShowSettings((v) => !v)}>{showSettings ? 'Ocultar configuración' : 'Configuración de préstamos'}</Button>
            <Button variant="primary" icon={PlusIcon} onClick={() => setModal({})}>Nuevo producto</Button>
          </div>
        </div>

        {showSettings && (
          <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-800">Reglas de crédito de la empresa</h2>
            <LoanSettingsForm />
          </div>
        )}

        {!loading && items.length === 0 ? (
          <EmptyState icon={RectangleStackIcon} title="Aún no tienes productos de crédito" subtitle="Crea uno (ej. “Microcrédito 3% mensual”) para asignarlo a tus clientes. Sin productos, se usa la tasa por defecto de la empresa." action={<Button variant="primary" icon={PlusIcon} onClick={() => setModal({})}>Nuevo producto</Button>} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Producto</th><th className="px-3 py-2 text-right">Tasa</th><th className="px-3 py-2 text-right">Mora</th><th className="px-3 py-2">Frecuencia</th><th className="px-3 py-2">Sistema</th><th className="px-3 py-2">Plazo</th><th className="px-3 py-2">Monto</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2"><p className="font-medium text-gray-900">{p.name}</p>{p.description && <p className="text-xs text-gray-400">{p.description}</p>}</td>
                    <td className="px-3 py-2 text-right font-semibold">{p.interestRate}% mensual</td>
                    <td className="px-3 py-2 text-right">{p.moraRate == null ? 'Igual a tasa' : `${p.moraRate}%`}{p.graceDays ? <span className="block text-xs text-gray-400">{p.graceDays}d gracia</span> : null}</td>
                    <td className="px-3 py-2">{FREQ_LABEL[p.frequency] || p.frequency}</td>
                    <td className="px-3 py-2">{AMORT_LABEL[p.amortization] || p.amortization}</td>
                    <td className="px-3 py-2 text-gray-600">{p.minTerm || p.maxTerm ? `${p.minTerm || 1} – ${p.maxTerm || '∞'} cuotas` : 'Libre'}</td>
                    <td className="px-3 py-2 text-gray-600">{p.minAmount || p.maxAmount ? `${formatCOP(p.minAmount || 0)} – ${p.maxAmount ? formatCOP(p.maxAmount) : '∞'}` : 'Libre'}</td>
                    <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <button type="button" aria-label={`Editar ${p.name}`} onClick={() => setModal(p)} className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50"><PencilSquareIcon className="h-4 w-4" /></button>
                        <button type="button" aria-label={`Eliminar ${p.name}`} onClick={() => setDel(p)} className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <ProductModal item={modal.id ? modal : null} onClose={() => setModal(null)} onSaved={load} />}
      <ConfirmModal open={!!del} title="Eliminar producto de crédito" message={`Los préstamos ya creados con “${del?.name}” no cambian. Solo deja de ofrecerse para nuevos préstamos.`} loading={deleting} onConfirm={confirmDelete} onCancel={() => setDel(null)} />
    </LoanGuard>
  );
}
