'use client';

import { useCallback, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

// Panel "Declaración de renta (borrador)": consolidado anual + impuesto
// estimado, exportable a Excel. Reutilizable (empresa y contador) pasando el
// loader por prop.
//
// Props:
//   load(params)  -> { data: { year, company, personType, regime, consolidado,
//                       baseGravable, impuestoEstimado, effectiveRate, detail,
//                       engineAvailable, nota, disclaimer } }

function cop(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

const PERSON_LABEL = { NATURAL: 'Persona natural', JURIDICA: 'Persona jurídica' };
const REGIME_LABEL = {
  ORDINARIO: 'Ordinario',
  SIMPLE: 'Régimen Simple',
  NO_RESPONSABLE: 'No responsable de IVA',
};

export default function RentaDraftPanel({ load, className = '' }) {
  const now = new Date().getUTCFullYear();
  const [year, setYear] = useState(now);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await load({ year });
      setData(res?.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [load, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const c = data?.consolidado || {};
  const years = [now - 1, now, now + 1];

  const rows = [
    ['Ingresos', c.ingresos],
    ['Costos', c.costos],
    ['Gastos', c.gastos],
    ['Renta líquida (utilidad)', c.rentaLiquida],
    ['Patrimonio bruto', c.patrimonioBruto],
    ['Patrimonio líquido', c.patrimonioLiquido],
  ];

  const exportExcel = () => {
    if (!data) return;
    const aoa = [
      ['Declaración de renta (borrador)', ''],
      ['Empresa', data.company?.name || ''],
      ['NIT', data.company?.nit || ''],
      ['Año', data.year],
      ['Tipo de persona', PERSON_LABEL[data.personType] || data.personType],
      ['Régimen', REGIME_LABEL[data.regime] || data.regime],
      ['', ''],
      ['Concepto', 'Valor (COP)'],
      ...rows.map(([label, val]) => [label, Number(val) || 0]),
      ['', ''],
      ['Base gravable (estimada)', Number(data.baseGravable) || 0],
      ['Impuesto de renta estimado', data.impuestoEstimado ?? 'N/D'],
      [
        'Tarifa efectiva',
        data.effectiveRate != null ? `${(data.effectiveRate * 100).toFixed(2)}%` : 'N/D',
      ],
      ['', ''],
      ['Nota', data.nota || ''],
      ['Aviso', data.disclaimer || ''],
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Renta');
    XLSX.writeFile(wb, `borrador-renta_${data.company?.name || 'empresa'}_${data.year}.xlsx`);
  };

  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
          <DocumentChartBarIcon className="h-5 w-5 text-indigo-500" /> Declaración
          de renta <span className="text-xs font-normal text-gray-400">(borrador)</span>
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
            onClick={exportExcel}
            disabled={!data}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      {loading && !data ? (
        <p className="py-6 text-center text-xs text-gray-400">Cargando...</p>
      ) : !data ? (
        <p className="py-6 text-center text-xs text-gray-400">
          No se pudo cargar el borrador.
        </p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
              {PERSON_LABEL[data.personType] || data.personType}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
              {REGIME_LABEL[data.regime] || data.regime}
            </span>
            {c.balanced === false && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                Balance descuadrado — revisa los libros
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-100">
            {rows.map(([label, val], i) => (
              <div
                key={label}
                className={`flex items-center justify-between px-3 py-2 text-sm ${
                  i % 2 ? 'bg-gray-50/60' : 'bg-white'
                } ${label.startsWith('Renta líquida') ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
              >
                <span>{label}</span>
                <span className="tabular-nums">{cop(val)}</span>
              </div>
            ))}
          </div>

          {/* Impuesto estimado */}
          <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
            {data.regime === 'SIMPLE' ? (
              <p className="text-xs text-indigo-800">{data.nota}</p>
            ) : (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400">
                      Impuesto de renta estimado
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-indigo-700">
                      {data.impuestoEstimado != null ? cop(data.impuestoEstimado) : 'N/D'}
                    </p>
                  </div>
                  {data.effectiveRate != null && (
                    <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-indigo-600 shadow-sm">
                      Tarifa efect. {(data.effectiveRate * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-indigo-500">
                  Sobre base gravable estimada de {cop(data.baseGravable)}.
                </p>
                {!data.engineAvailable && (
                  <p className="mt-1 text-[11px] text-amber-700">
                    El motor de reglas no está disponible; el impuesto no se pudo
                    estimar en este momento.
                  </p>
                )}
              </>
            )}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
            {data.disclaimer}
          </p>
        </>
      )}
    </div>
  );
}
