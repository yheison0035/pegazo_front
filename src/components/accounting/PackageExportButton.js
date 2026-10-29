'use client';

import { useState } from 'react';
import { ArchiveBoxArrowDownIcon } from '@heroicons/react/24/outline';
import { downloadWorkbook } from '@/lib/accounting/xlsxIO';
import { buildPackageSheets, packageFilename } from '@/lib/accounting/exportPackage';

// "Paquete contable": un solo Excel con diario, mayor/balance de prueba,
// estados financieros, impuestos, plan de cuentas, asientos manuales y
// activos del periodo. `fetchers` trae cada fuente (las que falten se omiten):
// { journal(params), ledger(params), financials(params), taxSummary(params),
//   accounts(), entries(params), assets() } → cada una devuelve { data }.
export default function PackageExportButton({ company, startDate, endDate, fetchers, onError, className = '' }) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const params = { startDate, endDate };
      const safe = async (fn, args) => {
        if (!fn) return undefined;
        try {
          return (await fn(...args))?.data;
        } catch {
          return undefined;
        }
      };
      const [journal, ledger, financials, taxSummary, accounts, entries, assets] = await Promise.all([
        safe(fetchers.journal, [params]),
        safe(fetchers.ledger, [params]),
        safe(fetchers.financials, [params]),
        safe(fetchers.taxSummary, [params]),
        safe(fetchers.accounts, []),
        safe(fetchers.entries, [params]),
        safe(fetchers.assets, []),
      ]);
      const sheets = buildPackageSheets({ company, startDate, endDate, journal, ledger, financials, taxSummary, accounts, entries, assets });
      if (sheets.length <= 1) {
        onError?.('No se pudo armar el paquete: sin datos.');
        return;
      }
      downloadWorkbook(sheets, packageFilename(company, startDate, endDate));
    } catch (e) {
      onError?.(e?.message || 'No se pudo exportar el paquete contable.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      title="Un solo Excel con diario, mayor, estados financieros, impuestos, plan de cuentas, asientos y activos del periodo"
      className={`inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 ${className}`}
    >
      <ArchiveBoxArrowDownIcon className="h-4 w-4" />
      {busy ? 'Armando paquete…' : 'Paquete contable (Excel)'}
    </button>
  );
}
