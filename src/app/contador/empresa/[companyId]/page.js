'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import MoneyInput from '@/components/ui/MoneyInput';
import {
  getAccountantPortfolio,
  getAccCompanyFinancials,
  getAccCompanyJournal,
  getAccCompanyLedger,
  getAccCompanyLedgerAccounts,
  getAccCompanyTaxCalendar,
  getAccCompanyEntries,
  createAccCompanyEntry,
  deleteAccCompanyEntry,
  importAccCompanyEntries,
} from '@/lib/api/routes/accountant';

function cop(n) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(v);
}
function num(n) {
  const v = Number(n) || 0;
  return v ? new Intl.NumberFormat('es-CO').format(v) : '—';
}
function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('es-CO', { timeZone: 'UTC' });
  } catch {
    return '';
  }
}
function downloadCSV(filename, rows) {
  const csv = rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? '');
          return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(';'),
    )
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const ACC_TYPES = [
  ['ASSET', 'Activo'],
  ['LIABILITY', 'Pasivo'],
  ['EQUITY', 'Patrimonio'],
  ['INCOME', 'Ingresos'],
  ['COST', 'Costos'],
  ['EXPENSE', 'Gastos'],
];
const NATURE_LABEL = { DEBIT: 'Débito', CREDIT: 'Crédito' };
const OBLIGATION_LABEL = { IVA: 'IVA', RENTA: 'Renta', RETEFUENTE: 'Retención', ICA: 'ICA', OTRO: 'Otro' };

function Line({ label, value, strong, indent }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${indent ? 'pl-3' : ''} ${strong ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
      <span className="text-sm">{label}</span>
      <span className="text-sm tabular-nums">{cop(value)}</span>
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{title}</h3>
      {children}
    </div>
  );
}

export default function ContadorEmpresa() {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [view, setView] = useState('estados'); // estados | libros | plan | calendario
  const [start, setStart] = useState(firstOfMonth());
  const [end, setEnd] = useState(today());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // datos por vista
  const [fin, setFin] = useState(null);
  const [finTab, setFinTab] = useState('pyg');
  const [journal, setJournal] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [booksTab, setBooksTab] = useState('journal');
  const [accounts, setAccounts] = useState([]);
  const [calendar, setCalendar] = useState(null);
  const [entries, setEntries] = useState([]);
  const [entryForm, setEntryForm] = useState(null); // {date, description, reference, lines:[]}
  const [entryBusy, setEntryBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    getAccountantPortfolio()
      .then((r) => {
        const c = (r?.data || []).find((x) => String(x.companyId) === String(companyId));
        setCompany(c || null);
      })
      .catch(() => {});
  }, [companyId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = { startDate: start, endDate: end };
    try {
      if (view === 'estados') {
        setFin((await getAccCompanyFinancials(companyId, params))?.data || null);
      } else if (view === 'libros') {
        if (booksTab === 'journal')
          setJournal((await getAccCompanyJournal(companyId, params))?.data || null);
        else setLedger((await getAccCompanyLedger(companyId, params))?.data || null);
      } else if (view === 'plan') {
        setAccounts((await getAccCompanyLedgerAccounts(companyId))?.data || []);
      } else if (view === 'calendario') {
        setCalendar((await getAccCompanyTaxCalendar(companyId))?.data || null);
      } else if (view === 'asientos') {
        const [e1, e2] = await Promise.all([
          getAccCompanyEntries(companyId),
          getAccCompanyLedgerAccounts(companyId),
        ]);
        setEntries(e1?.data || []);
        setAccounts(e2?.data || []);
      }
    } catch (e) {
      setError(e.message || 'No se pudo cargar.');
    } finally {
      setLoading(false);
    }
  }, [companyId, view, booksTab, start, end]);

  useEffect(() => {
    load();
  }, [load]);

  const pyg = fin?.incomeStatement;
  const bal = fin?.balanceSheet;
  const flujo = fin?.cashFlow;

  const exportBooks = () => {
    if (booksTab === 'journal' && journal) {
      const rows = [['Fecha', 'Tipo', 'Ref', 'Descripción', 'Cuenta', 'Nombre', 'Débito', 'Crédito']];
      journal.entries.forEach((e) =>
        e.lines.forEach((l) => rows.push([e.date, e.type, e.ref, e.description, l.code, l.name, l.debit || '', l.credit || ''])),
      );
      downloadCSV(`diario_${company?.name || companyId}.csv`, rows);
    } else if (ledger) {
      const rows = [['Código', 'Cuenta', 'Débito', 'Crédito', 'Saldo']];
      ledger.accounts.forEach((a) => rows.push([a.code, a.name, a.debit || '', a.credit || '', a.balance || '']));
      downloadCSV(`mayor_${company?.name || companyId}.csv`, rows);
    }
  };

  const grouped = ACC_TYPES.map(([t, l]) => [l, accounts.filter((a) => a.type === t)]).filter(([, arr]) => arr.length);

  const cal = calendar?.deadlines || [];
  const daysLabel = (n) => (n < 0 ? `Venció hace ${Math.abs(n)}d` : n === 0 ? 'Hoy' : `Faltan ${n}d`);

  // ----- Asientos manuales -----
  const openEntry = () =>
    setEntryForm({
      date: today(),
      description: '',
      reference: '',
      lines: [
        { accountCode: '', debit: '', credit: '' },
        { accountCode: '', debit: '', credit: '' },
      ],
    });
  const setLine = (i, patch) =>
    setEntryForm((f) => ({
      ...f,
      lines: f.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)),
    }));
  const addLine = () =>
    setEntryForm((f) => ({ ...f, lines: [...f.lines, { accountCode: '', debit: '', credit: '' }] }));
  const removeLine = (i) =>
    setEntryForm((f) => ({ ...f, lines: f.lines.filter((_, j) => j !== i) }));

  const totalD = (entryForm?.lines || []).reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalC = (entryForm?.lines || []).reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const cuadra = totalD === totalC && totalD > 0;

  const saveEntry = async () => {
    if (!entryForm.description.trim() || !cuadra) return;
    setEntryBusy(true);
    try {
      await createAccCompanyEntry(companyId, {
        date: entryForm.date,
        description: entryForm.description.trim(),
        reference: entryForm.reference.trim() || null,
        lines: entryForm.lines
          .filter((l) => l.accountCode && (Number(l.debit) || Number(l.credit)))
          .map((l) => {
            const acc = accounts.find((a) => a.code === l.accountCode);
            return {
              accountCode: l.accountCode,
              accountName: acc?.name || null,
              debit: Number(l.debit) || 0,
              credit: Number(l.credit) || 0,
            };
          }),
      });
      setEntryForm(null);
      load();
    } catch (e) {
      setError(e.message || 'No se pudo guardar el asiento.');
    } finally {
      setEntryBusy(false);
    }
  };

  const removeEntry = async (id) => {
    setEntryBusy(true);
    try {
      await deleteAccCompanyEntry(companyId, id);
      load();
    } catch {
      /* noop */
    } finally {
      setEntryBusy(false);
    }
  };

  // Descarga una plantilla .xlsx: hoja "Movimientos" (a llenar) + hoja "Cuentas"
  // con el PUC de la empresa (para saber qué códigos usar).
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const movs = [
      ['Fecha', 'Descripcion', 'CuentaDebito', 'CuentaCredito', 'Valor', 'Referencia'],
      ['2026-09-01', 'Ejemplo: venta de contado', '1105', '4135', 100000, 'FAC-001'],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(movs), 'Movimientos');
    const cuentas = [['Codigo', 'Cuenta', 'Naturaleza']].concat(
      (accounts || []).map((a) => [a.code, a.name, a.nature]),
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cuentas), 'Cuentas');
    XLSX.writeFile(wb, `plantilla-contable_${company?.name || companyId}.xlsx`);
  };

  const norm = (s) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z]/g, '');

  const onImportFile = async (file) => {
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setError('');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      const ws = wb.Sheets['Movimientos'] || wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });
      const rows = raw.map((r) => {
        const m = {};
        for (const k of Object.keys(r)) m[norm(k)] = r[k];
        return {
          fecha: m.fecha,
          descripcion: m.descripcion,
          cuentaDebito: m.cuentadebito,
          cuentaCredito: m.cuentacredito,
          valor: Number(String(m.valor).replace(/[^\d.-]/g, '')) || 0,
          referencia: m.referencia,
        };
      });
      if (!rows.length) {
        setError('El archivo no tiene filas en la hoja "Movimientos".');
        return;
      }
      const res = await importAccCompanyEntries(companyId, rows);
      setImportResult(res?.data || null);
      load();
    } catch (e) {
      setError(e.message || 'No se pudo importar el archivo.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <Link href="/contador" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600">
        <ArrowLeftIcon className="h-4 w-4" /> Mis empresas
      </Link>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">{company?.name || 'Empresa'}</h1>
        <p className="text-sm text-gray-500">
          Contabilidad{company?.nit ? ` · NIT ${company.nit}` : ''}
        </p>
      </div>

      {/* Vistas */}
      <div className="mb-3 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
        {[
          ['estados', 'Estados financieros'],
          ['asientos', 'Asientos'],
          ['libros', 'Libros'],
          ['plan', 'Plan de cuentas'],
          ['calendario', 'Calendario'],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              view === k ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Rango (no aplica a plan/calendario/asientos) */}
      {view !== 'plan' && view !== 'calendario' && view !== 'asientos' && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500">Desde</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500">Hasta</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          </div>
          {view === 'libros' && (
            <button onClick={exportBooks} className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              <ArrowDownTrayIcon className="h-4 w-4" /> Exportar
            </button>
          )}
        </div>
      )}

      {error && <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-400">Cargando…</p>}

      {/* ===== ESTADOS ===== */}
      {view === 'estados' && fin && (
        <>
          <div className="mb-3 flex rounded-xl bg-gray-100 p-1">
            {[['pyg', 'Resultados'], ['balance', 'Balance'], ['flujo', 'Flujo']].map(([k, l]) => (
              <button key={k} onClick={() => setFinTab(k)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${finTab === k ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>{l}</button>
            ))}
          </div>
          {finTab === 'pyg' && pyg && (
            <div className="space-y-3">
              <Section title="Ingresos">
                {pyg.income.map((a) => <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />)}
                <Line label="Total ingresos" value={pyg.totalIncome} strong />
              </Section>
              {pyg.costs.length > 0 && (
                <Section title="Costos">
                  {pyg.costs.map((a) => <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />)}
                  <Line label="Total costos" value={pyg.totalCosts} strong />
                </Section>
              )}
              <Section title="Gastos">
                {pyg.expenses.map((a) => <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />)}
                <Line label="Total gastos" value={pyg.totalExpenses} strong />
              </Section>
              <div className={`rounded-2xl px-6 py-4 text-white ${pyg.netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase">{pyg.netProfit >= 0 ? 'Utilidad neta' : 'Pérdida neta'}</span>
                  <span className="text-xl font-bold tabular-nums">{cop(pyg.netProfit)}</span>
                </div>
              </div>
            </div>
          )}
          {finTab === 'balance' && bal && (
            <div className="space-y-3">
              <Section title="Activos">
                {bal.assets.map((a) => <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />)}
                <Line label="Total activos" value={bal.totalAssets} strong />
              </Section>
              <Section title="Pasivos">
                {bal.liabilities.map((a) => <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />)}
                <Line label="Total pasivos" value={bal.totalLiabilities} strong />
              </Section>
              <Section title="Patrimonio">
                {bal.equity.map((a) => <Line key={a.code} label={`${a.code} · ${a.name}`} value={a.value} indent />)}
                <Line label="Resultado del ejercicio" value={bal.retainedResult} indent />
                <Line label="Total patrimonio" value={bal.totalEquity} strong />
              </Section>
              <div className="rounded-2xl bg-gray-900 px-6 py-3 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Pasivo + Patrimonio</span>
                  <span className="text-lg font-bold tabular-nums">{cop(bal.totalLiabilities + bal.totalEquity)}</span>
                </div>
                <p className="mt-1 text-[11px] text-white/60">{bal.balanced ? '✓ Cuadra' : '⚠ Descuadre'}</p>
              </div>
            </div>
          )}
          {finTab === 'flujo' && flujo && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <p className="text-[10px] font-semibold uppercase text-gray-400">Entradas</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-emerald-600">{cop(flujo.totalIn)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <p className="text-[10px] font-semibold uppercase text-gray-400">Salidas</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-red-500">{cop(flujo.totalOut)}</p>
              </div>
              <div className={`rounded-2xl p-4 text-center text-white shadow-sm ${flujo.net >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`}>
                <p className="text-[10px] font-semibold uppercase text-white/80">Flujo neto</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{cop(flujo.net)}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== ASIENTOS MANUALES ===== */}
      {view === 'asientos' && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              Registra a mano o importa un Excel para alimentar los libros.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4" /> Plantilla
              </button>
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100">
                <ArrowUpTrayIcon className="h-4 w-4" />
                {importing ? 'Importando…' : 'Importar Excel'}
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  disabled={importing}
                  onChange={(e) => {
                    onImportFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
              <button
                onClick={openEntry}
                className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                <PlusIcon className="h-4 w-4" /> Nuevo asiento
              </button>
            </div>
          </div>

          {importResult && (
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-800">
                Importación: {importResult.created} de {importResult.total} asientos creados
                {importResult.errors?.length ? ` · ${importResult.errors.length} con error` : ''}
              </p>
              {importResult.errors?.length > 0 && (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-red-600">
                  {importResult.errors.slice(0, 30).map((er, i) => (
                    <li key={i}>Fila {er.row}: {er.message}</li>
                  ))}
                </ul>
              )}
              <button onClick={() => setImportResult(null)} className="mt-2 text-xs text-gray-400 hover:text-gray-600">
                Cerrar
              </button>
            </div>
          )}
          {entries.length === 0 && !loading ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-gray-400">
              Sin asientos aún. Crea el primero con “Nuevo asiento”.
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => {
                const tot = (e.lines || []).reduce((s, l) => s + (l.debit || 0), 0);
                return (
                  <div key={e.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-50 bg-gray-50/50 px-4 py-2">
                      <div className="min-w-0">
                        <span className="font-mono text-xs text-gray-500">{fmtDate(e.date)}</span>
                        <span className="ml-2 text-sm text-gray-700">{e.description}</span>
                        {e.reference && <span className="ml-2 text-[11px] text-gray-400">({e.reference})</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold tabular-nums text-gray-500">{cop(tot)}</span>
                        <button onClick={() => removeEntry(e.id)} disabled={entryBusy} title="Eliminar" className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <table className="min-w-full text-sm">
                      <tbody>
                        {e.lines.map((l) => (
                          <tr key={l.id} className="border-t border-gray-50">
                            <td className="w-16 px-4 py-1.5 font-mono text-xs text-gray-400">{l.accountCode}</td>
                            <td className="px-2 py-1.5 text-gray-700">{l.accountName || ''}</td>
                            <td className="w-28 px-4 py-1.5 text-right tabular-nums">{l.debit ? num(l.debit) : ''}</td>
                            <td className="w-28 px-4 py-1.5 text-right tabular-nums">{l.credit ? num(l.credit) : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== LIBROS ===== */}
      {view === 'libros' && (
        <>
          <div className="mb-3 flex rounded-xl bg-gray-100 p-1">
            {[['journal', 'Libro diario'], ['ledger', 'Libro mayor']].map(([k, l]) => (
              <button key={k} onClick={() => setBooksTab(k)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${booksTab === k ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>{l}</button>
            ))}
          </div>
          {booksTab === 'journal' &&
            (journal?.entries || []).map((e, i) => (
              <div key={i} className="mb-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-50 bg-gray-50/50 px-4 py-2">
                  <span className="font-mono text-xs text-gray-500">{e.date}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">{e.type}</span>
                  <span className="text-xs text-gray-600">{e.description}</span>
                </div>
                <table className="min-w-full text-sm">
                  <tbody>
                    {e.lines.map((l, j) => (
                      <tr key={j} className="border-t border-gray-50">
                        <td className="w-16 px-4 py-1.5 font-mono text-xs text-gray-400">{l.code}</td>
                        <td className="px-2 py-1.5 text-gray-700">{l.name}</td>
                        <td className="w-28 px-4 py-1.5 text-right tabular-nums">{l.debit ? num(l.debit) : ''}</td>
                        <td className="w-28 px-4 py-1.5 text-right tabular-nums">{l.credit ? num(l.credit) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          {booksTab === 'ledger' && ledger && (
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase text-gray-500">
                    <th className="px-4 py-3">Cuenta</th>
                    <th className="px-4 py-3 text-right">Débito</th>
                    <th className="px-4 py-3 text-right">Crédito</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ledger.accounts.map((a) => (
                    <tr key={a.code} className="text-gray-700">
                      <td className="px-4 py-2.5"><span className="font-mono text-xs text-gray-400">{a.code}</span> {a.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{a.debit ? num(a.debit) : '—'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{a.credit ? num(a.credit) : '—'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-gray-900">{num(a.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===== PLAN DE CUENTAS ===== */}
      {view === 'plan' && (
        <div className="space-y-4">
          {grouped.map(([label, arr]) => (
            <div key={label} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/60 px-4 py-2.5 text-sm font-bold uppercase text-gray-600">{label}</div>
              <table className="min-w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  {arr.map((a) => (
                    <tr key={a.id} className="text-gray-700">
                      <td className="w-20 px-4 py-2 font-mono text-xs text-gray-500">{a.code}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">{a.name}</td>
                      <td className="px-4 py-2 text-right text-[11px] text-gray-400">{NATURE_LABEL[a.nature]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* ===== CALENDARIO ===== */}
      {view === 'calendario' && calendar && (
        <div className="space-y-2">
          {cal.length === 0 && <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-gray-400">Sin vencimientos cargados para esta empresa.</div>}
          {cal.map((d) => (
            <div key={d.id} className={`flex items-center justify-between gap-3 rounded-2xl border bg-white p-3 shadow-sm ${d.status === 'VENCIDO' ? 'border-red-200' : d.status === 'PROXIMO' ? 'border-amber-200' : 'border-gray-100'}`}>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  <span className="mr-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">{OBLIGATION_LABEL[d.obligation] || d.obligation}</span>
                  {d.title}
                </p>
                <p className="text-xs text-gray-500">{fmtDate(d.dueDate)}{d.period ? ` · ${d.period}` : ''}</p>
              </div>
              <span className={`flex-none rounded-lg px-3 py-1.5 text-xs font-bold ${d.status === 'VENCIDO' ? 'bg-red-50 text-red-600' : d.status === 'PROXIMO' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500'}`}>{daysLabel(d.daysLeft)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ===== MODAL NUEVO ASIENTO ===== */}
      {entryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEntryForm(null)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Nuevo asiento</h2>
              <button onClick={() => setEntryForm(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Fecha *</label>
                <input type="date" value={entryForm.date} onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-600">Descripción *</label>
                <input value={entryForm.description} onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })} placeholder="Ej: Compra de mercancía" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              </div>
            </div>

            {/* Líneas */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 text-left text-[11px] uppercase text-gray-500">
                    <th className="px-3 py-2">Cuenta</th>
                    <th className="w-32 px-3 py-2 text-right">Débito</th>
                    <th className="w-32 px-3 py-2 text-right">Crédito</th>
                    <th className="w-10 px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {entryForm.lines.map((l, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-3 py-1.5">
                        <select
                          value={l.accountCode}
                          onChange={(e) => setLine(i, { accountCode: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-orange-400 focus:outline-none"
                        >
                          <option value="">Elegir cuenta…</option>
                          {accounts.map((a) => (
                            <option key={a.id || a.code} value={a.code}>
                              {a.code} · {a.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <MoneyInput value={l.debit} onChange={(v) => setLine(i, { debit: v, credit: '' })} placeholder="$ 0" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-right text-sm" />
                      </td>
                      <td className="px-2 py-1.5">
                        <MoneyInput value={l.credit} onChange={(v) => setLine(i, { credit: v, debit: '' })} placeholder="$ 0" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-right text-sm" />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {entryForm.lines.length > 2 && (
                          <button onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-500">
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-100 bg-gray-50/60 font-semibold text-gray-700">
                    <td className="px-3 py-2 text-right text-xs">Totales</td>
                    <td className="px-3 py-2 text-right tabular-nums">{num(totalD)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{num(totalC)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <button onClick={addLine} className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700">
                <PlusIcon className="h-4 w-4" /> Agregar línea
              </button>
              <span className={`text-xs font-semibold ${cuadra ? 'text-emerald-600' : 'text-red-500'}`}>
                {cuadra ? '✓ Cuadra' : `Descuadre: ${num(Math.abs(totalD - totalC))}`}
              </span>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEntryForm(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={saveEntry}
                disabled={entryBusy || !cuadra || !entryForm.description.trim()}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {entryBusy ? 'Guardando…' : 'Guardar asiento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
