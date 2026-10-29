'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PaperClipIcon,
  PencilSquareIcon,
  PlusIcon,
  ScaleIcon,
  TrashIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import MoneyInput from '@/components/ui/MoneyInput';
import { downloadWorkbook, readAllSheets } from '@/lib/accounting/xlsxIO';
import { entriesTemplateSheets, toEntryRows } from '@/lib/accounting/importSheets';
import { manualEntriesSheet } from '@/lib/accounting/exportPackage';
import {
  buildOpeningEntry,
  openingTotals,
  pickEquityAccount,
} from '@/lib/accounting/openingBalances';

function cop(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}
function num(n) {
  return new Intl.NumberFormat('es-CO').format(Number(n) || 0);
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
const iso10 = (d) => (d ? String(new Date(d).toISOString()).slice(0, 10) : '');

const btnBase = 'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold';
const btnGhost = `${btnBase} border border-gray-200 text-gray-600 hover:bg-gray-50`;
const btnPrimary = `${btnBase} bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50`;
const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none';

/**
 * Panel de asientos contables (manuales): lista, crear/editar/eliminar,
 * plantilla e importación Excel (formatos PAR y DIARIO), exportación, saldos
 * iniciales, nómina guiada y cierre de periodo. Lo usan la empresa
 * (/dashboard/asientos) y el portal del contador con sus propias APIs.
 *
 * api = { listEntries(params), createEntry(p), updateEntry(id,p), deleteEntry(id),
 *         importEntries(rows), uploadDoc(file), getAccounts(), setClose?(date|null) }
 */
export default function JournalEntriesPanel({
  api,
  companyName = '',
  booksClosedUntil = null,
  onCloseChange,
  onError,
  onChanged,
}) {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState({ start: '', end: '' });
  const [search, setSearch] = useState('');
  const [entryForm, setEntryForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [closeDate, setCloseDate] = useState(iso10(booksClosedUntil));
  const [closeBusy, setCloseBusy] = useState(false);
  const [payrollForm, setPayrollForm] = useState(null);
  const [openingForm, setOpeningForm] = useState(null);

  const fail = useCallback((e, fallback) => onError?.(e?.message || fallback), [onError]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (range.start) params.startDate = range.start;
      if (range.end) params.endDate = range.end;
      const [e1, e2] = await Promise.all([api.listEntries(params), api.getAccounts()]);
      setEntries(e1?.data || []);
      setAccounts(e2?.data || []);
    } catch (e) {
      fail(e, 'No se pudieron cargar los asientos.');
    } finally {
      setLoading(false);
    }
  }, [api, range.start, range.end, fail]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCloseDate(iso10(booksClosedUntil));
  }, [booksClosedUntil]);

  const changed = () => {
    load();
    onChanged?.();
  };

  const nameOf = (code) => accounts.find((a) => a.code === code)?.name || null;
  const isClosed = (date) => booksClosedUntil && new Date(date) <= new Date(booksClosedUntil);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        String(e.description || '').toLowerCase().includes(q) ||
        String(e.reference || '').toLowerCase().includes(q) ||
        (e.lines || []).some((l) => String(l.accountCode).includes(q)),
    );
  }, [entries, search]);

  // ----- Asiento (crear / editar) -----
  const blankLine = () => ({ accountCode: '', debit: '', credit: '' });
  const openNew = () =>
    setEntryForm({
      id: null,
      date: today(),
      description: '',
      reference: '',
      attachmentUrl: '',
      attachmentName: '',
      uploading: false,
      lines: [blankLine(), blankLine()],
    });
  const openEdit = (e) =>
    setEntryForm({
      id: e.id,
      date: iso10(e.date),
      description: e.description || '',
      reference: e.reference || '',
      attachmentUrl: e.attachmentUrl || '',
      attachmentName: e.attachmentName || '',
      uploading: false,
      lines: (e.lines || []).map((l) => ({
        accountCode: l.accountCode,
        debit: l.debit ? String(l.debit) : '',
        credit: l.credit ? String(l.credit) : '',
      })),
    });
  const setLine = (i, patch) =>
    setEntryForm((f) => ({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  const addLine = () => setEntryForm((f) => ({ ...f, lines: [...f.lines, blankLine()] }));
  const removeLine = (i) => setEntryForm((f) => ({ ...f, lines: f.lines.filter((_, j) => j !== i) }));
  const totalD = (entryForm?.lines || []).reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalC = (entryForm?.lines || []).reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const cuadra = totalD === totalC && totalD > 0;

  const uploadDoc = async (file) => {
    if (!file) return;
    setEntryForm((f) => ({ ...f, uploading: true }));
    try {
      const res = await api.uploadDoc(file);
      const d = res?.data;
      setEntryForm((f) => ({ ...f, attachmentUrl: d?.url || '', attachmentName: d?.name || file.name, uploading: false }));
    } catch (e) {
      fail(e, 'No se pudo subir el documento.');
      setEntryForm((f) => ({ ...f, uploading: false }));
    }
  };

  const saveEntry = async () => {
    if (!entryForm.description.trim() || !cuadra) return;
    setBusy(true);
    try {
      const payload = {
        date: entryForm.date,
        description: entryForm.description.trim(),
        reference: entryForm.reference.trim() || null,
        attachmentUrl: entryForm.attachmentUrl || null,
        attachmentName: entryForm.attachmentName || null,
        lines: entryForm.lines
          .filter((l) => l.accountCode && (Number(l.debit) || Number(l.credit)))
          .map((l) => ({
            accountCode: l.accountCode,
            accountName: nameOf(l.accountCode),
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
          })),
      };
      if (entryForm.id) await api.updateEntry(entryForm.id, payload);
      else await api.createEntry(payload);
      setEntryForm(null);
      changed();
    } catch (e) {
      fail(e, 'No se pudo guardar el asiento.');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDel) return;
    setBusy(true);
    try {
      await api.deleteEntry(confirmDel.id);
      setConfirmDel(null);
      changed();
    } catch (e) {
      fail(e, 'No se pudo eliminar el asiento.');
    } finally {
      setBusy(false);
    }
  };

  // ----- Plantilla / importar / exportar -----
  const downloadTemplate = () =>
    downloadWorkbook(entriesTemplateSheets(accounts, today()), `plantilla-asientos_${companyName || 'empresa'}.xlsx`);

  const exportEntries = () =>
    downloadWorkbook(
      [{ name: 'Asientos', rows: manualEntriesSheet(visible) }],
      `asientos_${companyName || 'empresa'}_${today()}.xlsx`,
    );

  const onImportFile = async (file) => {
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const sheets = await readAllSheets(file);
      const known = sheets.filter((s) => ['Movimientos', 'Diario'].includes(s.name));
      const source = known.length ? known : sheets.slice(0, 1);
      // Se omiten las filas de ejemplo de la plantilla.
      const rows = source
        .flatMap((s) => toEntryRows(s.rows))
        .filter((r) => !String(r.descripcion || '').startsWith('Ejemplo:'));
      if (!rows.length) {
        onError?.('El archivo no tiene filas para importar.');
        return;
      }
      const res = await api.importEntries(rows);
      setImportResult(res?.data || null);
      changed();
    } catch (e) {
      fail(e, 'No se pudo importar el archivo.');
    } finally {
      setImporting(false);
    }
  };

  // ----- Cierre de periodo -----
  const applyClose = async (date) => {
    if (!api.setClose) return;
    setCloseBusy(true);
    try {
      const res = await api.setClose(date || null);
      const until = res?.data?.booksClosedUntil ?? null;
      onCloseChange?.(until);
    } catch (e) {
      fail(e, 'No se pudo cambiar el cierre.');
    } finally {
      setCloseBusy(false);
    }
  };

  // ----- Nómina (asiento guiado) -----
  const pickAcc = (prefer, fallback) =>
    accounts.find((a) => a.code === prefer)?.code || accounts.find((a) => a.code === fallback)?.code || '';
  const openPayroll = () =>
    setPayrollForm({
      date: today(),
      employee: '',
      expenseAccount: pickAcc('5110', '5105'),
      deductionAccount: pickAcc('2370', '2365'),
      cashAccount: pickAcc('1105', '1110'),
      devengado: '',
      deducciones: '',
    });
  const payrollNeto = (Number(payrollForm?.devengado) || 0) - (Number(payrollForm?.deducciones) || 0);
  const savePayroll = async () => {
    const f = payrollForm;
    const dev = Number(f.devengado) || 0;
    const ded = Number(f.deducciones) || 0;
    if (!f.employee.trim() || dev <= 0 || !f.expenseAccount || !f.cashAccount) return;
    if (ded < 0 || ded > dev) {
      onError?.('Las deducciones no pueden superar el devengado.');
      return;
    }
    const lines = [{ accountCode: f.expenseAccount, accountName: nameOf(f.expenseAccount), debit: dev, credit: 0 }];
    if (ded > 0) lines.push({ accountCode: f.deductionAccount, accountName: nameOf(f.deductionAccount), debit: 0, credit: ded });
    lines.push({ accountCode: f.cashAccount, accountName: nameOf(f.cashAccount), debit: 0, credit: dev - ded });
    setBusy(true);
    try {
      await api.createEntry({ date: f.date, description: `Nómina · ${f.employee.trim()}`, reference: 'NOMINA', lines });
      setPayrollForm(null);
      changed();
    } catch (e) {
      fail(e, 'No se pudo registrar la nómina.');
    } finally {
      setBusy(false);
    }
  };

  // ----- Saldos iniciales -----
  const openOpening = () => {
    const pre = ['1105', '1110', '1305', '1435', '1540', '2205', '2380'];
    const rows = pre
      .filter((c) => accounts.some((a) => a.code === c))
      .map((c) => ({ accountCode: c, debit: '', credit: '' }));
    setOpeningForm({
      date: `${new Date().getFullYear()}-01-01`,
      equityAccount: pickEquityAccount(accounts),
      rows: rows.length ? rows : [blankLine(), blankLine()],
    });
  };
  const setOpeningRow = (i, patch) =>
    setOpeningForm((f) => ({ ...f, rows: f.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const openingTot = openingTotals(openingForm?.rows || []);
  const saveOpening = async () => {
    setBusy(true);
    try {
      const entry = buildOpeningEntry({
        date: openingForm.date,
        rows: openingForm.rows.map((r) => ({ ...r, accountName: nameOf(r.accountCode) })),
        equityAccount: openingForm.equityAccount,
        accounts,
      });
      await api.createEntry(entry);
      setOpeningForm(null);
      changed();
    } catch (e) {
      fail(e, 'No se pudieron guardar los saldos iniciales.');
    } finally {
      setBusy(false);
    }
  };

  const accountOptions = accounts.map((a) => (
    <option key={a.id || a.code} value={a.code}>
      {a.code} · {a.name}
    </option>
  ));

  return (
    <div>
      {/* Barra de acciones */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          Registra a mano, importa un Excel o carga los saldos iniciales para alimentar los libros.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={downloadTemplate} className={btnGhost} title="Descarga un Excel con el formato y tu plan de cuentas">
            <ArrowDownTrayIcon className="h-4 w-4" /> Plantilla
          </button>
          <label className={`${btnBase} cursor-pointer border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100`}>
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
          <button type="button" onClick={exportEntries} disabled={!visible.length} className={`${btnGhost} disabled:opacity-50`}>
            <ArrowDownTrayIcon className="h-4 w-4" /> Exportar
          </button>
          <button type="button" onClick={openOpening} className={btnGhost} title="Asiento de apertura con los saldos con que arranca la contabilidad">
            <ScaleIcon className="h-4 w-4" /> Saldos iniciales
          </button>
          <button type="button" onClick={openPayroll} className={btnGhost}>
            <UsersIcon className="h-4 w-4" /> Nómina
          </button>
          <button type="button" onClick={openNew} className={btnPrimary}>
            <PlusIcon className="h-4 w-4" /> Nuevo asiento
          </button>
        </div>
      </div>

      {/* Cierre de periodo */}
      {api.setClose && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <span className="text-xs font-semibold text-gray-500">Cierre de periodo:</span>
          {booksClosedUntil ? (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600">
              Cerrado hasta {fmtDate(booksClosedUntil)}
            </span>
          ) : (
            <span className="text-[11px] text-gray-400">Sin cierre (todo editable)</span>
          )}
          <span className="flex-1" />
          <input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm" />
          <button type="button" onClick={() => applyClose(closeDate)} disabled={closeBusy || !closeDate} className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50">
            Cerrar hasta
          </button>
          {booksClosedUntil && (
            <button type="button" onClick={() => applyClose(null)} disabled={closeBusy} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              Reabrir
            </button>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500">Desde</label>
          <input type="date" value={range.start} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500">Hasta</label>
          <input type="date" value={range.end} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-[11px] font-semibold text-gray-500">Buscar</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Descripción, referencia o cuenta" className={inputCls} />
        </div>
        <span className="pb-2 text-xs text-gray-400">{visible.length} asiento{visible.length === 1 ? '' : 's'}</span>
      </div>

      {importResult && (
        <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">
            Importación: {importResult.created} de {importResult.total} fila{importResult.total === 1 ? '' : 's'} → asientos creados
            {importResult.errors?.length ? ` · ${importResult.errors.length} con error` : ''}
          </p>
          {importResult.errors?.length > 0 && (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-red-600">
              {importResult.errors.slice(0, 50).map((er, i) => (
                <li key={i}>Fila {er.row}: {er.message}</li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => setImportResult(null)} className="mt-2 text-xs text-gray-400 hover:text-gray-600">
            Cerrar
          </button>
        </div>
      )}

      {/* Lista */}
      {visible.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-gray-400">
          {entries.length ? 'Ningún asiento coincide con la búsqueda.' : 'Sin asientos aún. Crea el primero con “Nuevo asiento” o importa un Excel.'}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((e) => {
            const tot = (e.lines || []).reduce((s, l) => s + (l.debit || 0), 0);
            const locked = isClosed(e.date);
            return (
              <div key={e.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-2 border-b border-gray-50 bg-gray-50/50 px-4 py-2">
                  <div className="min-w-0">
                    <span className="font-mono text-xs text-gray-500">{fmtDate(e.date)}</span>
                    <span className="ml-2 text-sm text-gray-700">{e.description}</span>
                    {e.reference && <span className="ml-2 text-[11px] text-gray-400">({e.reference})</span>}
                    {locked && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Periodo cerrado</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {e.attachmentUrl && (
                      <a href={e.attachmentUrl} target="_blank" rel="noreferrer" title={e.attachmentName || 'Documento'} className="text-gray-400 hover:text-orange-600">
                        <PaperClipIcon className="h-4 w-4" />
                      </a>
                    )}
                    <span className="text-xs font-semibold tabular-nums text-gray-500">{cop(tot)}</span>
                    {!locked && (
                      <>
                        <button type="button" onClick={() => openEdit(e)} disabled={busy} title="Editar" className="rounded p-1 text-gray-400 hover:bg-orange-50 hover:text-orange-600">
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setConfirmDel(e)} disabled={busy} title="Eliminar" className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <table className="min-w-full text-sm">
                  <tbody>
                    {(e.lines || []).map((l) => (
                      <tr key={l.id || `${l.accountCode}-${l.debit}-${l.credit}`} className="border-t border-gray-50">
                        <td className="w-16 px-4 py-1.5 font-mono text-xs text-gray-400">{l.accountCode}</td>
                        <td className="px-2 py-1.5 text-gray-700">{l.accountName || nameOf(l.accountCode) || ''}</td>
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

      {/* ===== MODAL ASIENTO ===== */}
      {entryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEntryForm(null)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{entryForm.id ? 'Editar asiento' : 'Nuevo asiento'}</h2>
              <button type="button" onClick={() => setEntryForm(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Fecha *</label>
                <input type="date" value={entryForm.date} onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-600">Descripción *</label>
                <input value={entryForm.description} onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })} placeholder="Ej: Compra de mercancía" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Referencia</label>
                <input value={entryForm.reference} onChange={(e) => setEntryForm({ ...entryForm, reference: e.target.value })} placeholder="FAC-001" className={inputCls} />
              </div>
            </div>
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
                        <select value={l.accountCode} onChange={(e) => setLine(i, { accountCode: e.target.value })} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-orange-400 focus:outline-none">
                          <option value="">Elegir cuenta…</option>
                          {accountOptions}
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
                          <button type="button" onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-500">
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
              <button type="button" onClick={addLine} className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700">
                <PlusIcon className="h-4 w-4" /> Agregar línea
              </button>
              <span className={`text-xs font-semibold ${cuadra ? 'text-emerald-600' : 'text-red-500'}`}>
                {cuadra ? '✓ Cuadra' : `Descuadre: ${num(Math.abs(totalD - totalC))}`}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-gray-200 p-3">
              <PaperClipIcon className="h-4 w-4 text-gray-400" />
              {entryForm.attachmentUrl ? (
                <>
                  <a href={entryForm.attachmentUrl} target="_blank" rel="noreferrer" className="truncate text-sm font-medium text-orange-600 hover:underline">
                    {entryForm.attachmentName || 'documento'}
                  </a>
                  <button type="button" onClick={() => setEntryForm({ ...entryForm, attachmentUrl: '', attachmentName: '' })} className="text-gray-400 hover:text-red-500">
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <label className="cursor-pointer text-sm font-medium text-gray-600 hover:text-orange-600">
                  {entryForm.uploading ? 'Subiendo…' : 'Adjuntar documento soporte (factura/recibo)'}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    disabled={entryForm.uploading}
                    onChange={(e) => {
                      uploadDoc(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEntryForm(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="button" onClick={saveEntry} disabled={busy || !cuadra || !entryForm.description.trim()} className={btnPrimary}>
                {busy ? 'Guardando…' : entryForm.id ? 'Guardar cambios' : 'Guardar asiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL NÓMINA ===== */}
      {payrollForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPayrollForm(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Registrar nómina</h2>
              <button type="button" onClick={() => setPayrollForm(null)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <p className="mb-3 text-xs text-gray-500">Genera el asiento contable del pago de nómina. Tú pones los valores; el sistema arma el asiento balanceado.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Fecha *</label>
                <input type="date" value={payrollForm.date} onChange={(e) => setPayrollForm({ ...payrollForm, date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Empleado *</label>
                <input value={payrollForm.employee} onChange={(e) => setPayrollForm({ ...payrollForm, employee: e.target.value })} placeholder="Nombre" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Devengado (salario) *</label>
                <MoneyInput value={payrollForm.devengado} onChange={(v) => setPayrollForm({ ...payrollForm, devengado: v })} placeholder="$ 0" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Deducciones</label>
                <MoneyInput value={payrollForm.deducciones} onChange={(v) => setPayrollForm({ ...payrollForm, deducciones: v })} placeholder="$ 0" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Cuenta de gasto</label>
                <select value={payrollForm.expenseAccount} onChange={(e) => setPayrollForm({ ...payrollForm, expenseAccount: e.target.value })} className={inputCls}>{accountOptions}</select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Cuenta de pago</label>
                <select value={payrollForm.cashAccount} onChange={(e) => setPayrollForm({ ...payrollForm, cashAccount: e.target.value })} className={inputCls}>{accountOptions}</select>
              </div>
              {Number(payrollForm.deducciones) > 0 && (
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Cuenta de deducciones (por pagar)</label>
                  <select value={payrollForm.deductionAccount} onChange={(e) => setPayrollForm({ ...payrollForm, deductionAccount: e.target.value })} className={inputCls}>{accountOptions}</select>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
              <span className="text-gray-500">Neto a pagar</span>
              <span className="font-bold tabular-nums text-gray-900">{cop(payrollNeto)}</span>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPayrollForm(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button type="button" onClick={savePayroll} disabled={busy || !payrollForm.employee.trim() || !(Number(payrollForm.devengado) > 0)} className={btnPrimary}>
                {busy ? 'Guardando…' : 'Registrar nómina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL SALDOS INICIALES ===== */}
      {openingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpeningForm(null)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Saldos iniciales</h2>
              <button type="button" onClick={() => setOpeningForm(null)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <p className="mb-3 text-xs text-gray-500">
              Escribe con qué arranca la contabilidad: caja, bancos, clientes, inventario, deudas… Lo que no cuadre se lleva a la cuenta de patrimonio que elijas (capital).
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Fecha de apertura *</label>
                <input type="date" value={openingForm.date} onChange={(e) => setOpeningForm({ ...openingForm, date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Cuadrar diferencia contra</label>
                <select value={openingForm.equityAccount} onChange={(e) => setOpeningForm({ ...openingForm, equityAccount: e.target.value })} className={inputCls}>
                  <option value="">Elegir cuenta de patrimonio…</option>
                  {accounts.filter((a) => a.type === 'EQUITY').map((a) => (
                    <option key={a.id || a.code} value={a.code}>{a.code} · {a.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 text-left text-[11px] uppercase text-gray-500">
                    <th className="px-3 py-2">Cuenta</th>
                    <th className="w-36 px-3 py-2 text-right">Saldo débito</th>
                    <th className="w-36 px-3 py-2 text-right">Saldo crédito</th>
                    <th className="w-10 px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {openingForm.rows.map((r, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-3 py-1.5">
                        <select value={r.accountCode} onChange={(e) => setOpeningRow(i, { accountCode: e.target.value })} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-orange-400 focus:outline-none">
                          <option value="">Elegir cuenta…</option>
                          {accountOptions}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <MoneyInput value={r.debit} onChange={(v) => setOpeningRow(i, { debit: v, credit: '' })} placeholder="$ 0" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-right text-sm" />
                      </td>
                      <td className="px-2 py-1.5">
                        <MoneyInput value={r.credit} onChange={(v) => setOpeningRow(i, { credit: v, debit: '' })} placeholder="$ 0" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-right text-sm" />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button type="button" onClick={() => setOpeningForm((f) => ({ ...f, rows: f.rows.filter((_, j) => j !== i) }))} className="text-gray-300 hover:text-red-500">
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-100 bg-gray-50/60 font-semibold text-gray-700">
                    <td className="px-3 py-2 text-right text-xs">Totales</td>
                    <td className="px-3 py-2 text-right tabular-nums">{num(openingTot.debit)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{num(openingTot.credit)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <button type="button" onClick={() => setOpeningForm((f) => ({ ...f, rows: [...f.rows, blankLine()] }))} className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700">
                <PlusIcon className="h-4 w-4" /> Agregar cuenta
              </button>
              <span className="text-xs font-semibold text-gray-500">
                {openingTot.diff === 0 ? '✓ Cuadra' : `Diferencia ${num(Math.abs(openingTot.diff))} → ${openingTot.diff > 0 ? 'crédito' : 'débito'} a patrimonio`}
              </span>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpeningForm(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button type="button" onClick={saveOpening} disabled={busy || (openingTot.debit === 0 && openingTot.credit === 0) || (openingTot.diff !== 0 && !openingForm.equityAccount)} className={btnPrimary}>
                {busy ? 'Guardando…' : 'Guardar apertura'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CONFIRMAR ELIMINAR ===== */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmDel(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800">Eliminar asiento</h2>
            <p className="mt-2 text-sm text-gray-600">
              ¿Eliminar el asiento del {fmtDate(confirmDel.date)} “{confirmDel.description}”? Saldrá de los libros y no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDel(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button type="button" onClick={doDelete} disabled={busy} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">
                {busy ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
