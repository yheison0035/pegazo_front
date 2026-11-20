'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { getCustomers } from '@/lib/api/routes/customers';
import {
  createLoan,
  getLoanProducts,
  getLoanSettings,
  getLoanCollectors,
  simulateLoan,
  emitLoansChanged,
} from '@/lib/api/routes/loans';
import { buildLoanPlan, LOAN_FREQUENCIES, LOAN_AMORTIZATIONS } from '@/lib/loanPlan';
import { formatCOP, formatDateOnly } from '@/lib/api/utils/utils';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/toastContext';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import NewCustomerModal from '@/components/dashboard/modals/newCustomerModal';
import AmortizationTable from './AmortizationTable';

const OWNER = ['SUPER_ADMIN', 'ADMIN'];
const CAN_DISBURSE = ['SUPER_ADMIN', 'ADMIN', 'CAJA'];
const RATE_SOURCE_LABEL = {
  LOAN: 'tasa ajustada para este préstamo',
  CUSTOMER: 'tasa propia del cliente',
  PRODUCT: 'tasa del producto de crédito',
  COMPANY: 'tasa por defecto de la empresa',
  NONE: 'sin tasa configurada',
};

const inputCls = 'mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';

// Crear un préstamo. La tasa llega en cascada (cliente → producto → empresa) y
// se puede ajustar; la vista previa del plan es inmediata (motor local) y el
// backend confirma términos y avisos (cupo, usura, bloqueo) al simular/crear.
export default function NewLoanModal({ open, onClose, onCreated, initial = {} }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const role = usuario?.role;

  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [collectors, setCollectors] = useState([]);

  const [customer, setCustomer] = useState(initial.customer || null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [newCustomer, setNewCustomer] = useState(false);

  const [productId, setProductId] = useState(initial.productId || '');
  const [principal, setPrincipal] = useState(initial.principal || '');
  const [termCount, setTermCount] = useState(initial.termCount || '');
  const [frequency, setFrequency] = useState(initial.frequency || '');
  const [amortization, setAmortization] = useState(initial.amortization || '');
  const [rateOverride, setRateOverride] = useState(initial.interestRate ?? '');
  const [firstDueDate, setFirstDueDate] = useState('');
  const [collectorId, setCollectorId] = useState('');
  const [notes, setNotes] = useState('');
  const [disburseNow, setDisburseNow] = useState(true);
  const [method, setMethod] = useState('EFECTIVO');
  const [force, setForce] = useState(false);

  const [sim, setSim] = useState(null); // respuesta del backend (terms, warnings)
  const [saving, setSaving] = useState(false);
  const simTimer = useRef(null);

  // Catálogos
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [s, p, u] = await Promise.all([getLoanSettings(), getLoanProducts(), getLoanCollectors()]);
        setSettings(s?.data || null);
        setProducts(Array.isArray(p?.data) ? p.data : []);
        setCollectors(Array.isArray(u?.data) ? u.data : []);
      } catch {
        /* los selects quedan vacíos; el backend valida */
      }
    })();
  }, [open]);

  // Buscar clientes por nombre
  useEffect(() => {
    if (!open || !search.trim() || customer) {
      setResults([]);
      return undefined;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await getCustomers({ name: search.trim(), limit: 8 });
        setResults(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search, open, customer]);

  const product = useMemo(() => products.find((p) => String(p.id) === String(productId)) || null, [products, productId]);

  // Términos efectivos para la vista previa local.
  const effective = useMemo(() => {
    const st = settings || {};
    const t = sim?.terms || {};
    return {
      interestRate:
        rateOverride !== '' && rateOverride !== null
          ? Number(rateOverride)
          : t.interestRate ?? product?.interestRate ?? st.defaultInterestRate ?? 0,
      rateSource: rateOverride !== '' ? 'LOAN' : t.rateSource || (product ? 'PRODUCT' : 'COMPANY'),
      frequency: frequency || t.frequency || product?.frequency || st.defaultFrequency || 'MENSUAL',
      amortization: amortization || t.amortization || product?.amortization || st.defaultAmortization || 'SIMPLE',
      roundTo: product?.roundTo ?? st.roundTo ?? 1,
      rateConversion: st.rateConversion || 'PROPORCIONAL',
      excludeWeekdays: st.excludeWeekdays || [],
    };
  }, [settings, sim, product, rateOverride, frequency, amortization]);

  const plan = useMemo(
    () =>
      buildLoanPlan({
        principal: Number(principal) || 0,
        termCount: Number(termCount) || 0,
        interestRate: effective.interestRate,
        frequency: effective.frequency,
        amortization: effective.amortization,
        roundTo: effective.roundTo,
        rateConversion: effective.rateConversion,
        excludeWeekdays: effective.excludeWeekdays,
        firstDueDate: firstDueDate ? new Date(`${firstDueDate}T12:00:00`) : undefined,
      }),
    [principal, termCount, effective, firstDueDate],
  );

  // Simulación en el backend (tasa resuelta + avisos) con pequeño retardo.
  const runSim = useCallback(() => {
    if (!open) return;
    const P = Number(principal) || 0;
    const N = Number(termCount) || 0;
    if (!P || !N) {
      setSim(null);
      return;
    }
    clearTimeout(simTimer.current);
    simTimer.current = setTimeout(async () => {
      try {
        const dto = { principal: P, termCount: N };
        if (customer?.id) dto.customerId = customer.id;
        if (productId) dto.productId = Number(productId);
        if (frequency) dto.frequency = frequency;
        if (amortization) dto.amortization = amortization;
        if (rateOverride !== '') dto.interestRate = Number(rateOverride);
        if (firstDueDate) dto.firstDueDate = firstDueDate;
        const res = await simulateLoan(dto);
        setSim(res?.data || null);
      } catch {
        setSim(null);
      }
    }, 350);
  }, [open, principal, termCount, customer, productId, frequency, amortization, rateOverride, firstDueDate]);

  useEffect(() => {
    runSim();
    return () => clearTimeout(simTimer.current);
  }, [runSim]);

  const warnings = sim?.warnings || [];
  const blocking = warnings.filter((w) => ['BLOCKED', 'CREDIT_LIMIT', 'MIN_AMOUNT', 'MAX_AMOUNT', 'MIN_TERM', 'MAX_TERM'].includes(w.code));
  const canForce = OWNER.includes(role);
  const requireApproval = !!settings?.requireApproval;
  const canDisburse = CAN_DISBURSE.includes(role) && !requireApproval;

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!customer?.id) return toast.show({ type: 'error', message: 'Selecciona el cliente.' });
    if (!(Number(principal) > 0)) return toast.show({ type: 'error', message: 'Ingresa el capital a prestar.' });
    if (!(Number(termCount) > 0)) return toast.show({ type: 'error', message: 'Ingresa el número de cuotas.' });
    if (blocking.length && !(force && canForce)) {
      return toast.show({ type: 'error', message: blocking.map((w) => w.message).join(' ') });
    }
    setSaving(true);
    try {
      const dto = {
        customerId: customer.id,
        principal: Number(principal),
        termCount: Number(termCount),
        frequency: effective.frequency,
        amortization: effective.amortization,
        disburseNow: canDisburse ? disburseNow : false,
      };
      if (productId) dto.productId = Number(productId);
      if (rateOverride !== '') dto.interestRate = Number(rateOverride);
      if (firstDueDate) dto.firstDueDate = firstDueDate;
      if (collectorId) dto.collectorId = Number(collectorId);
      if (notes.trim()) dto.notes = notes.trim();
      if (canDisburse && disburseNow) dto.disbursementMethod = method;
      if (force && canForce) dto.force = true;
      const res = await createLoan(dto);
      emitLoansChanged();
      toast.show({
        type: 'success',
        message: res?.data?.status === 'DESEMBOLSADO' ? `Préstamo ${res.data.code} creado y desembolsado` : `Solicitud ${res?.data?.code || ''} creada`,
      });
      onCreated?.(res?.data);
      onClose?.();
    } catch (err) {
      toast.show({ type: 'error', message: err?.message || 'No se pudo crear el préstamo.' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Nuevo préstamo</h3>
            <p className="text-sm text-gray-500">La tasa se toma del cliente, su producto o la empresa; puedes ajustarla.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto px-6 py-4 lg:grid-cols-5">
          {/* Formulario */}
          <div className="space-y-3 lg:col-span-3">
            {/* Cliente */}
            <div>
              <span className="text-xs font-medium text-gray-500">Cliente</span>
              {customer ? (
                <div className="mt-0.5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                  <span>
                    <span className="font-semibold text-gray-900">{customer.name}</span>
                    <span className="ml-2 text-gray-500">{customer.document || ''} {customer.phone ? `· ${customer.phone}` : ''}</span>
                  </span>
                  <button type="button" onClick={() => { setCustomer(null); setSearch(''); setSim(null); }} className="text-xs font-medium text-emerald-700 hover:underline">Cambiar</button>
                </div>
              ) : (
                <div className="relative mt-0.5">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    name="customerSearch"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar cliente por nombre…"
                    className={`${inputCls} pl-9`}
                    autoComplete="off"
                  />
                  {(results.length > 0 || searching) && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                      {searching && <p className="px-3 py-2 text-xs text-gray-400">Buscando…</p>}
                      {results.map((c) => (
                        <button key={c.id} type="button" onClick={() => { setCustomer(c); setResults([]); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-orange-50">
                          <span className="font-medium text-gray-900">{c.name}</span>
                          <span className="ml-2 text-gray-500">{c.document || ''} {c.phone ? `· ${c.phone}` : ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => setNewCustomer(true)} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline">
                    <UserPlusIcon className="h-4 w-4" /> Crear cliente nuevo
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Producto de crédito</span>
                <select name="productId" value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls}>
                  <option value="">Sin producto (tasa del cliente / empresa)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · {p.interestRate}% mensual</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Capital a prestar</span>
                <MoneyInput name="principal" value={principal} onChange={setPrincipal} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Número de cuotas</span>
                <input name="termCount" type="number" min="1" value={termCount} onChange={(e) => setTermCount(e.target.value)} placeholder="Ej: 30" className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Frecuencia</span>
                <select name="frequency" value={frequency || effective.frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls}>
                  {LOAN_FREQUENCIES.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Tasa de interés (% mensual)</span>
                <input
                  name="interestRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={rateOverride === '' ? '' : rateOverride}
                  onChange={(e) => setRateOverride(e.target.value === '' ? '' : e.target.value)}
                  placeholder={`${effective.interestRate}`}
                  className={inputCls}
                />
                <span className="text-[11px] text-gray-400">
                  {rateOverride === '' ? `Usando ${effective.interestRate}% (${RATE_SOURCE_LABEL[effective.rateSource] || ''})` : 'Tasa ajustada para este préstamo'}
                </span>
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Sistema</span>
                <select name="amortization" value={amortization || effective.amortization} onChange={(e) => setAmortization(e.target.value)} className={inputCls}>
                  {LOAN_AMORTIZATIONS.map((a) => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Primera cuota (opcional)</span>
                <input name="firstDueDate" type="date" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-gray-500">Cobrador</span>
                <select name="collectorId" value={collectorId} onChange={(e) => setCollectorId(e.target.value)} className={inputCls}>
                  <option value="">Sin asignar</option>
                  {collectors.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-xs font-medium text-gray-500">Notas (opcional)</span>
                <input name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Garantía, referencia, observación…" className={inputCls} />
              </label>
            </div>

            {canDisburse ? (
              <div className="rounded-xl border border-gray-200 p-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="disburseNow" checked={disburseNow} onChange={(e) => setDisburseNow(e.target.checked)} />
                  <span className="font-medium text-gray-800">Desembolsar ahora</span>
                  <span className="text-xs text-gray-500">(entregar el dinero y arrancar el plan)</span>
                </label>
                {disburseNow && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['EFECTIVO', 'TRANSFERENCIA', 'BANCOLOMBIA'].map((m) => (
                      <button key={m} type="button" onClick={() => setMethod(m)} className={`rounded-full border px-3 py-1 text-xs font-medium ${method === m ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'}`}>
                        {m === 'EFECTIVO' ? 'Efectivo (sale de caja)' : m.charAt(0) + m.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
                {requireApproval ? 'La empresa exige aprobación: el préstamo quedará como solicitud hasta que un administrador lo apruebe y desembolse.' : 'Tu rol crea la solicitud; un administrador o caja la desembolsa.'}
              </p>
            )}

            {warnings.length > 0 && (
              <div className="space-y-1">
                {warnings.map((w) => (
                  <p key={w.code} className={`rounded-xl p-2 text-xs ${blocking.includes(w) ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>{w.message}</p>
                ))}
                {blocking.length > 0 && canForce && (
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" name="force" checked={force} onChange={(e) => setForce(e.target.checked)} /> Autorizar de todas formas (solo administrador)
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Vista previa */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
              <p className="text-xs uppercase tracking-wide text-orange-700">Vista previa</p>
              {plan ? (
                <>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{formatCOP(plan.installmentAmount)}</p>
                  <p className="text-xs text-gray-500">por cuota · {plan.termCount} cuotas</p>
                  <dl className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between"><dt className="text-gray-500">Capital</dt><dd className="font-medium">{formatCOP(plan.principal)}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Intereses</dt><dd className="font-medium">{formatCOP(plan.totalInterest)}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Total a pagar</dt><dd className="font-semibold text-gray-900">{formatCOP(plan.totalAmount)}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Primera cuota</dt><dd>{formatDateOnly(plan.firstDueDate)}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Última cuota</dt><dd>{formatDateOnly(plan.lastDueDate)}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Tasa</dt><dd>{effective.interestRate}% mensual · {plan.effectiveAnnualRatePercent}% E.A.</dd></div>
                  </dl>
                  {sim?.availableCredit != null && (
                    <p className="mt-2 text-xs text-gray-500">Cupo disponible del cliente: {formatCOP(sim.availableCredit)}</p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-400">Ingresa capital y cuotas para ver el plan.</p>
              )}
            </div>
            {plan && (
              <div className="mt-3">
                <AmortizationTable installments={plan.installments} compact />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={saving}>
            {canDisburse && disburseNow ? 'Crear y desembolsar' : 'Crear solicitud'}
          </Button>
        </div>
      </form>

      {newCustomer && (
        <NewCustomerModal
          localId={usuario?.localId || null}
          onClose={() => setNewCustomer(false)}
          onCreated={(c) => { setCustomer(c); setNewCustomer(false); }}
        />
      )}
    </div>
  );
}
