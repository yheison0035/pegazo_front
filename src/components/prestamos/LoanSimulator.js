'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalculatorIcon } from '@heroicons/react/24/outline';
import { getLoanProducts, getLoanSettings, simulateLoan } from '@/lib/api/routes/loans';
import { buildLoanPlan, LOAN_FREQUENCIES, LOAN_AMORTIZATIONS, AMORT_LABEL } from '@/lib/loanPlan';
import { formatCOP, formatDateOnly } from '@/lib/api/utils/utils';
import MoneyInput from '@/components/ui/MoneyInput';
import Button from '@/components/ui/Button';
import AmortizationTable from './AmortizationTable';

const inputCls = 'mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';

// Simulador de crédito: cálculo inmediato (motor local) + confirmación del
// backend (tasa resuelta y avisos). No guarda nada. `onUse` permite llevar los
// datos a "Nuevo préstamo".
export default function LoanSimulator({ customer = null, onUse = null, compact = false }) {
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [principal, setPrincipal] = useState(1000000);
  const [termCount, setTermCount] = useState(12);
  const [frequency, setFrequency] = useState('');
  const [amortization, setAmortization] = useState('');
  const [rate, setRate] = useState('');
  const [firstDueDate, setFirstDueDate] = useState('');
  const [sim, setSim] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([getLoanSettings(), getLoanProducts()]);
        setSettings(s?.data || null);
        setProducts(Array.isArray(p?.data) ? p.data : []);
      } catch {
        /* sin catálogos: igual calcula con lo que escriba el usuario */
      }
    })();
  }, []);

  const product = useMemo(() => products.find((p) => String(p.id) === String(productId)) || null, [products, productId]);
  const st = settings || {};
  const eff = {
    interestRate: rate !== '' ? Number(rate) : sim?.terms?.interestRate ?? product?.interestRate ?? st.defaultInterestRate ?? 0,
    frequency: frequency || sim?.terms?.frequency || product?.frequency || st.defaultFrequency || 'MENSUAL',
    amortization: amortization || sim?.terms?.amortization || product?.amortization || st.defaultAmortization || 'SIMPLE',
    roundTo: product?.roundTo ?? st.roundTo ?? 1,
    rateConversion: st.rateConversion || 'PROPORCIONAL',
    excludeWeekdays: st.excludeWeekdays || [],
  };

  const plan = useMemo(
    () =>
      buildLoanPlan({
        principal: Number(principal) || 0,
        termCount: Number(termCount) || 0,
        interestRate: eff.interestRate,
        frequency: eff.frequency,
        amortization: eff.amortization,
        roundTo: eff.roundTo,
        rateConversion: eff.rateConversion,
        excludeWeekdays: eff.excludeWeekdays,
        firstDueDate: firstDueDate ? new Date(`${firstDueDate}T12:00:00`) : undefined,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [principal, termCount, eff.interestRate, eff.frequency, eff.amortization, eff.roundTo, eff.rateConversion, JSON.stringify(eff.excludeWeekdays), firstDueDate],
  );

  useEffect(() => {
    const P = Number(principal) || 0;
    const N = Number(termCount) || 0;
    if (!P || !N) return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const dto = { principal: P, termCount: N };
        if (customer?.id) dto.customerId = customer.id;
        if (productId) dto.productId = Number(productId);
        if (frequency) dto.frequency = frequency;
        if (amortization) dto.amortization = amortization;
        if (rate !== '') dto.interestRate = Number(rate);
        if (firstDueDate) dto.firstDueDate = firstDueDate;
        const res = await simulateLoan(dto);
        setSim(res?.data || null);
      } catch {
        setSim(null);
      }
    }, 350);
    return () => clearTimeout(timer.current);
  }, [principal, termCount, productId, frequency, amortization, rate, firstDueDate, customer]);

  const warnings = sim?.warnings || [];

  return (
    <div className={`grid gap-5 ${compact ? '' : 'lg:grid-cols-5'}`}>
      <div className={`space-y-3 ${compact ? '' : 'lg:col-span-2'}`}>
        {customer && (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Simulando para <span className="font-semibold">{customer.name}</span>
          </p>
        )}
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-500">Producto de crédito</span>
          <select name="productId" value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls}>
            <option value="">Sin producto (tasa de la empresa)</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · {p.interestRate}% mensual</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-500">Capital</span>
          <MoneyInput name="principal" value={principal} onChange={setPrincipal} className={inputCls} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-xs font-medium text-gray-500">Cuotas</span>
            <input name="termCount" type="number" min="1" value={termCount} onChange={(e) => setTermCount(e.target.value)} className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-gray-500">Frecuencia</span>
            <select name="frequency" value={frequency || eff.frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls}>
              {LOAN_FREQUENCIES.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-gray-500">Tasa (% mensual)</span>
            <input name="interestRate" type="number" step="0.01" min="0" value={rate} onChange={(e) => setRate(e.target.value)} placeholder={`${eff.interestRate}`} className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-gray-500">Sistema</span>
            <select name="amortization" value={amortization || eff.amortization} onChange={(e) => setAmortization(e.target.value)} className={inputCls}>
              {LOAN_AMORTIZATIONS.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm col-span-2">
            <span className="text-xs font-medium text-gray-500">Primera cuota (opcional)</span>
            <input name="firstDueDate" type="date" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} className={inputCls} />
          </label>
        </div>
        <p className="text-xs text-gray-400">{LOAN_AMORTIZATIONS.find((a) => a.id === eff.amortization)?.hint}</p>
        {warnings.map((w) => (
          <p key={w.code} className="rounded-xl bg-amber-50 p-2 text-xs text-amber-800">{w.message}</p>
        ))}
      </div>

      <div className={compact ? '' : 'lg:col-span-3'}>
        <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-orange-700">
            <CalculatorIcon className="h-4 w-4" /> Resultado
          </p>
          {plan ? (
            <>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div><p className="text-xs text-gray-500">Cuota</p><p className="text-xl font-bold text-gray-900">{formatCOP(plan.installmentAmount)}</p></div>
                <div><p className="text-xs text-gray-500">Intereses</p><p className="text-xl font-bold text-gray-900">{formatCOP(plan.totalInterest)}</p></div>
                <div><p className="text-xs text-gray-500">Total a pagar</p><p className="text-xl font-bold text-gray-900">{formatCOP(plan.totalAmount)}</p></div>
                <div><p className="text-xs text-gray-500">Tasa E.A.</p><p className="text-xl font-bold text-gray-900">{plan.effectiveAnnualRatePercent}%</p></div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {plan.termCount} cuotas {LOAN_FREQUENCIES.find((f) => f.id === plan.frequency)?.label?.toLowerCase()}es · {AMORT_LABEL[plan.amortization]} · del {formatDateOnly(plan.firstDueDate)} al {formatDateOnly(plan.lastDueDate)} · {eff.interestRate}% mensual ({plan.periodicRatePercent}% por periodo)
              </p>
              {onUse && (
                <div className="mt-3">
                  <Button variant="primary" onClick={() => onUse({ principal: Number(principal), termCount: Number(termCount), frequency: eff.frequency, amortization: eff.amortization, interestRate: rate !== '' ? Number(rate) : undefined, productId: productId || undefined, customer })}>
                    Crear préstamo con estos datos
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-400">Ingresa capital y cuotas.</p>
          )}
        </div>
        {plan && <div className="mt-3"><AmortizationTable installments={plan.installments} /></div>}
      </div>
    </div>
  );
}
