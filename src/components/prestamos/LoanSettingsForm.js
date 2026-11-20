'use client';

import { useEffect, useState } from 'react';
import { getLoanSettings, updateLoanSettings } from '@/lib/api/routes/loans';
import { LOAN_FREQUENCIES, LOAN_AMORTIZATIONS } from '@/lib/loanPlan';
import { useToast } from '@/context/toastContext';
import Button from '@/components/ui/Button';

const inputCls = 'mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Reglas de crédito de la empresa: tasa y mora por defecto, gracia, frecuencia,
// sistema, redondeo, aprobación, días sin cobro, orden de aplicación, usura de
// referencia y permisos del cobrador. Todo editable por el dueño.
export default function LoanSettingsForm({ onSaved }) {
  const toast = useToast();
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getLoanSettings();
        setS(res?.data || {});
      } catch {
        setS({});
      }
    })();
  }, []);

  if (!s) return <p className="text-sm text-gray-400">Cargando configuración…</p>;
  const set = (k, v) => setS((prev) => ({ ...prev, [k]: v }));
  const toggleDay = (d) => {
    const cur = Array.isArray(s.excludeWeekdays) ? s.excludeWeekdays : [];
    set('excludeWeekdays', cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]);
  };

  const save = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const dto = {
        defaultInterestRate: Number(s.defaultInterestRate) || 0,
        defaultMoraRate: s.defaultMoraRate === '' || s.defaultMoraRate === null ? null : Number(s.defaultMoraRate),
        graceDays: Number(s.graceDays) || 0,
        defaultFrequency: s.defaultFrequency || 'MENSUAL',
        defaultAmortization: s.defaultAmortization || 'SIMPLE',
        rateConversion: s.rateConversion || 'PROPORCIONAL',
        roundTo: Number(s.roundTo) || 1,
        requireApproval: !!s.requireApproval,
        excludeWeekdays: Array.isArray(s.excludeWeekdays) ? s.excludeWeekdays : [],
        usuryRateMonthly: s.usuryRateMonthly === '' || s.usuryRateMonthly === null ? null : Number(s.usuryRateMonthly),
        collectorCanRegisterPayments: s.collectorCanRegisterPayments !== false,
        requireCashForDisbursement: !!s.requireCashForDisbursement,
        maxTerm: s.maxTerm ? Number(s.maxTerm) : null,
        minAmount: s.minAmount ? Number(s.minAmount) : null,
        maxAmount: s.maxAmount ? Number(s.maxAmount) : null,
        remindersEnabled: s.remindersEnabled !== false,
        reminderDaysBefore: Number(s.reminderDaysBefore) || 0,
        alertsEnabled: s.alertsEnabled !== false,
      };
      const res = await updateLoanSettings(dto);
      setS(res?.data || dto);
      toast.show({ type: 'success', message: 'Configuración de préstamos guardada' });
      onSaved?.(res?.data || dto);
    } catch (err) {
      toast.show({ type: 'error', message: err?.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-500">Tasa por defecto (% mensual)</span>
          <input name="defaultInterestRate" type="number" step="0.01" min="0" value={s.defaultInterestRate ?? ''} onChange={(e) => set('defaultInterestRate', e.target.value)} className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-500">Mora (% mensual)</span>
          <input name="defaultMoraRate" type="number" step="0.01" min="0" value={s.defaultMoraRate ?? ''} onChange={(e) => set('defaultMoraRate', e.target.value)} placeholder="Igual a la tasa" className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-500">Días de gracia</span>
          <input name="graceDays" type="number" min="0" value={s.graceDays ?? 0} onChange={(e) => set('graceDays', e.target.value)} className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-500">Frecuencia por defecto</span>
          <select name="defaultFrequency" value={s.defaultFrequency || 'MENSUAL'} onChange={(e) => set('defaultFrequency', e.target.value)} className={inputCls}>
            {LOAN_FREQUENCIES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-500">Sistema por defecto</span>
          <select name="defaultAmortization" value={s.defaultAmortization || 'SIMPLE'} onChange={(e) => set('defaultAmortization', e.target.value)} className={inputCls}>
            {LOAN_AMORTIZATIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-500">Redondear cuota a</span>
          <select name="roundTo" value={s.roundTo || 1} onChange={(e) => set('roundTo', e.target.value)} className={inputCls}>
            <option value={1}>Pesos exactos</option>
            <option value={100}>$100</option>
            <option value={500}>$500</option>
            <option value={1000}>$1.000</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-500">Tasa de referencia / usura (% mensual)</span>
          <input name="usuryRateMonthly" type="number" step="0.01" min="0" value={s.usuryRateMonthly ?? ''} onChange={(e) => set('usuryRateMonthly', e.target.value)} placeholder="Opcional: avisa si se supera" className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-500">Plazo máximo (cuotas)</span>
          <input name="maxTerm" type="number" min="1" value={s.maxTerm ?? ''} onChange={(e) => set('maxTerm', e.target.value)} placeholder="Sin límite" className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-500">Conversión de tasa</span>
          <select name="rateConversion" value={s.rateConversion || 'PROPORCIONAL'} onChange={(e) => set('rateConversion', e.target.value)} className={inputCls}>
            <option value="PROPORCIONAL">Proporcional (3% mensual = 0,1% diario)</option>
            <option value="EFECTIVA">Efectiva (compuesta)</option>
          </select>
        </label>
      </div>

      <div>
        <span className="text-xs font-medium text-gray-500">Días sin cobro (no caen cuotas)</span>
        <div className="mt-1 flex flex-wrap gap-2">
          {DAYS.map((d, i) => {
            const on = (s.excludeWeekdays || []).includes(i);
            return (
              <button key={d} type="button" onClick={() => toggleDay(i)} className={`rounded-full border px-3 py-1 text-xs font-medium ${on ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'}`}>
                {d}{on ? ' ✕' : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 text-sm">
          <input type="checkbox" name="requireApproval" checked={!!s.requireApproval} onChange={(e) => set('requireApproval', e.target.checked)} />
          <span><span className="font-medium">Exigir aprobación</span><span className="block text-xs text-gray-500">Solicitud → aprobación → desembolso</span></span>
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 text-sm">
          <input type="checkbox" name="collectorCanRegisterPayments" checked={s.collectorCanRegisterPayments !== false} onChange={(e) => set('collectorCanRegisterPayments', e.target.checked)} />
          <span><span className="font-medium">Cobradores registran abonos</span><span className="block text-xs text-gray-500">Desde su ruta, en el celular</span></span>
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 text-sm">
          <input type="checkbox" name="requireCashForDisbursement" checked={!!s.requireCashForDisbursement} onChange={(e) => set('requireCashForDisbursement', e.target.checked)} />
          <span><span className="font-medium">Exigir caja abierta</span><span className="block text-xs text-gray-500">Para desembolsar en efectivo</span></span>
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 text-sm">
          <input type="checkbox" name="remindersEnabled" checked={s.remindersEnabled !== false} onChange={(e) => set('remindersEnabled', e.target.checked)} />
          <span><span className="font-medium">Recordar cuotas por correo</span><span className="block text-xs text-gray-500">Al cliente, cada mañana (si tiene correo)</span></span>
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-500">Avisar con días de anticipación</span>
          <input name="reminderDaysBefore" type="number" min="0" max="60" value={s.reminderDaysBefore ?? 1} onChange={(e) => set('reminderDaysBefore', e.target.value)} className={inputCls} />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 text-sm">
          <input type="checkbox" name="alertsEnabled" checked={s.alertsEnabled !== false} onChange={(e) => set('alertsEnabled', e.target.checked)} />
          <span><span className="font-medium">Alertas de mora al equipo</span><span className="block text-xs text-gray-500">Aviso diario al dueño y a cada cobrador</span></span>
        </label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={saving}>Guardar configuración</Button>
      </div>
    </form>
  );
}
