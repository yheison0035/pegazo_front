'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ScaleIcon,
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

// Panel de "Obligaciones DIAN": veredicto de renta + obligaciones + editor del
// perfil fiscal y magnitudes. Reutilizable (empresa y contador) pasando los
// fetchers por props.
//
// Props (todas async):
//   loadObligations()            -> { data: { engineAvailable, profile, magnitudes, evaluation } }
//   loadProfile()                -> { data: profile }
//   saveProfile(profileData)     -> guarda el perfil fiscal
//   loadYear(year)               -> { data: magnitudes }
//   saveYear(yearData)           -> guarda las magnitudes del año

const RESPONSIBILITIES = [
  ['responsableIVA', 'Responsable de IVA'],
  ['agenteRetencion', 'Agente de retención'],
  ['autorretenedor', 'Autorretenedor'],
  ['responsableICA', 'Responsable de ICA'],
  ['granContribuyente', 'Gran contribuyente'],
  ['obligadoContabilidad', 'Obligado a llevar contabilidad'],
  ['facturadorElectronico', 'Facturador electrónico'],
];

const MAGNITUDES = [
  ['patrimonioBruto', 'Patrimonio bruto'],
  ['consumosTarjeta', 'Consumos con tarjeta de crédito'],
  ['compras', 'Compras y consumos'],
  ['consignaciones', 'Consignaciones / depósitos / inversiones'],
];

const FREQ_LABEL = {
  ANUAL: 'Anual',
  MENSUAL: 'Mensual',
  BIMESTRAL: 'Bimestral',
  CUATRIMESTRAL: 'Cuatrimestral',
  PERMANENTE: 'Permanente',
  SEGUN_MUNICIPIO: 'Según municipio',
};

function cop(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

export default function TaxObligationsPanel({
  loadObligations,
  loadProfile,
  saveProfile,
  loadYear,
  saveYear,
  className = '',
}) {
  const now = new Date().getUTCFullYear();
  const [year, setYear] = useState(now);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await loadObligations({ year });
      setData(res?.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [loadObligations, year]);

  useEffect(() => {
    load();
  }, [load]);

  // Abre el editor con los valores actuales del perfil + magnitudes.
  const openEditor = async () => {
    try {
      const [p, y] = await Promise.all([loadProfile(), loadYear(year)]);
      const prof = p?.data || {};
      const mag = y?.data || {};
      setForm({
        personType: (prof.personType || '').toUpperCase().includes('JUR')
          ? 'JURIDICA'
          : 'NATURAL',
        taxRegime: prof.taxRegime || 'ORDINARIO',
        responsableIVA: !!prof.responsableIVA,
        agenteRetencion: !!prof.agenteRetencion,
        autorretenedor: !!prof.autorretenedor,
        responsableICA: !!prof.responsableICA,
        granContribuyente: !!prof.granContribuyente,
        obligadoContabilidad: !!prof.obligadoContabilidad,
        facturadorElectronico: !!prof.facturadorElectronico,
        ingresosBrutosOverride: mag.ingresosBrutosOverride ?? '',
        ingresosVentas: mag.ingresosVentas ?? 0,
        patrimonioBruto: mag.patrimonioBruto ?? 0,
        consumosTarjeta: mag.consumosTarjeta ?? 0,
        compras: mag.compras ?? 0,
        consignaciones: mag.consignaciones ?? 0,
      });
      setEditing(true);
    } catch {
      /* noop */
    }
  };

  const submit = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await saveProfile({
        personType: form.personType,
        taxRegime: form.taxRegime,
        responsableIVA: form.responsableIVA,
        agenteRetencion: form.agenteRetencion,
        autorretenedor: form.autorretenedor,
        responsableICA: form.responsableICA,
        granContribuyente: form.granContribuyente,
        obligadoContabilidad: form.obligadoContabilidad,
        facturadorElectronico: form.facturadorElectronico,
      });
      await saveYear({
        year,
        ingresosBrutosOverride:
          form.ingresosBrutosOverride === '' ? null : form.ingresosBrutosOverride,
        patrimonioBruto: form.patrimonioBruto,
        consumosTarjeta: form.consumosTarjeta,
        compras: form.compras,
        consignaciones: form.consignaciones,
      });
      setEditing(false);
      await load();
    } catch {
      /* noop */
    } finally {
      setSaving(false);
    }
  };

  const ev = data?.evaluation;
  const must = ev?.mustDeclareRenta;
  const years = [now - 1, now, now + 1];

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
          <ScaleIcon className="h-5 w-5 text-purple-500" /> Obligaciones DIAN
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={openEditor}
            className="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black"
          >
            <PencilSquareIcon className="h-4 w-4" /> Perfil fiscal
          </button>
        </div>
      </div>

      {data && !data.engineAvailable && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          El motor de reglas tributarias no está disponible en este momento.
          Puedes configurar el perfil fiscal; el veredicto de renta se calculará
          cuando el servicio esté activo.
        </div>
      )}

      {/* Veredicto de renta */}
      {ev && (
        <div
          className={`mb-3 flex items-start gap-3 rounded-xl border p-3 ${
            must === true
              ? 'border-purple-200 bg-purple-50'
              : must === false
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-gray-200 bg-gray-50'
          }`}
        >
          {must === true ? (
            <CheckCircleIcon className="mt-0.5 h-6 w-6 flex-none text-purple-600" />
          ) : must === false ? (
            <XCircleIcon className="mt-0.5 h-6 w-6 flex-none text-emerald-600" />
          ) : (
            <QuestionMarkCircleIcon className="mt-0.5 h-6 w-6 flex-none text-gray-400" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800">
              {must === true
                ? 'Debe declarar renta'
                : must === false
                  ? 'No está obligado a declarar renta'
                  : 'Falta información para determinar la renta'}
            </p>
            <ul className="mt-1 space-y-0.5">
              {(ev.rentaReasons || [])
                .filter((r) => r.exceeded || r.key === 'SIN_UVT' || must !== true)
                .slice(0, 6)
                .map((r, i) => (
                  <li key={i} className="text-xs text-gray-600">
                    • {r.label}
                    {r.threshold ? (
                      <span className="text-gray-400">
                        {' '}
                        (tope {cop(r.threshold.cop)} · {r.value ? cop(r.value) : '—'})
                      </span>
                    ) : null}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}

      {/* Obligaciones */}
      {ev?.obligations?.length > 0 ? (
        <div className="space-y-2">
          {ev.obligations.map((o, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {o.label}
                </p>
                <p className="text-[11px] text-gray-400">{o.basis}</p>
              </div>
              <span className="flex-none rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-gray-600 shadow-sm">
                {FREQ_LABEL[o.frequency] || o.frequency}
              </span>
            </div>
          ))}
        </div>
      ) : ev ? (
        <p className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-xs text-gray-400">
          Sin obligaciones derivadas con el perfil actual. Revisa el perfil
          fiscal para que refleje las responsabilidades del RUT.
        </p>
      ) : !loading ? (
        <p className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-xs text-gray-400">
          Configura el perfil fiscal para ver las obligaciones DIAN.
        </p>
      ) : null}

      {ev?.disclaimer && (
        <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
          {ev.disclaimer}
        </p>
      )}

      {/* Editor de perfil + magnitudes */}
      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <h3 className="mb-3 text-base font-semibold text-gray-800">
              Perfil fiscal · {year}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-gray-600">
                Tipo de persona
                <select
                  value={form.personType}
                  onChange={(e) => set('personType', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                >
                  <option value="NATURAL">Persona natural</option>
                  <option value="JURIDICA">Persona jurídica</option>
                </select>
              </label>
              <label className="text-xs font-medium text-gray-600">
                Régimen
                <select
                  value={form.taxRegime}
                  onChange={(e) => set('taxRegime', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                >
                  <option value="ORDINARIO">Ordinario</option>
                  <option value="SIMPLE">Régimen Simple (RST)</option>
                  <option value="NO_RESPONSABLE">No responsable de IVA</option>
                </select>
              </label>
            </div>

            <p className="mt-4 mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">
              Responsabilidades del RUT
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {RESPONSIBILITIES.map(([k, label]) => (
                <label
                  key={k}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 px-2.5 py-1.5 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={!!form[k]}
                    onChange={(e) => set(k, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {label}
                </label>
              ))}
            </div>

            <p className="mt-4 mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">
              Magnitudes del año (para topes de renta)
            </p>
            <label className="block text-xs font-medium text-gray-600">
              Ingresos brutos
              <input
                type="number"
                value={form.ingresosBrutosOverride}
                placeholder={`Ventas del año: ${cop(form.ingresosVentas)}`}
                onChange={(e) => set('ingresosBrutosOverride', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
              />
              <span className="text-[11px] text-gray-400">
                Vacío = usar las ventas registradas ({cop(form.ingresosVentas)}).
              </span>
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {MAGNITUDES.map(([k, label]) => (
                <label key={k} className="text-xs font-medium text-gray-600">
                  {label}
                  <input
                    type="number"
                    value={form[k]}
                    onChange={(e) => set(k, e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={saving}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar y recalcular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
