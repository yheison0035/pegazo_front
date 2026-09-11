'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CalendarDaysIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import Button from '@/components/ui/Button';
import TableActionButton from '@/components/ui/TableActionButton';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import MoneyInput from '@/components/ui/MoneyInput';
import {
  getTaxDeadlines,
  createTaxDeadline,
  updateTaxDeadline,
  deleteTaxDeadline,
  getTaxParameters,
  upsertTaxParameter,
} from '@/lib/api/routes/tax';

const OBLIGATIONS = [
  ['IVA', 'IVA'],
  ['RENTA', 'Renta'],
  ['RETEFUENTE', 'Retención en la fuente'],
  ['ICA', 'ICA'],
  ['OTRO', 'Otro'],
];
const YEARS = [2025, 2026, 2027, 2028];

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('es-CO', { timeZone: 'UTC' });
  } catch {
    return '';
  }
}
const emptyForm = {
  obligation: 'IVA',
  title: '',
  period: '',
  dueDate: '',
  nitDigits: '',
  regime: '',
  notes: '',
  active: true,
};

function TaxCalendarInner() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState([]);
  const [uvt, setUvt] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({});
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dl, params] = await Promise.all([
        getTaxDeadlines(year),
        getTaxParameters(year),
      ]);
      setRows(dl?.data || []);
      const u = (params?.data || []).find((p) => p.key === 'UVT');
      setUvt(u?.value ?? '');
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo cargar.' });
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  const saveUvt = async () => {
    setBusy(true);
    try {
      await upsertTaxParameter({ key: 'UVT', year, value: Number(uvt) || 0 });
      setAlert({ type: 'success', message: 'UVT guardada.' });
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    const f = editing;
    if (!f.title.trim() || !f.dueDate) {
      setAlert({ type: 'error', message: 'Completa título y fecha.' });
      return;
    }
    setBusy(true);
    try {
      const payload = { ...f, year, title: f.title.trim() };
      if (f.id) await updateTaxDeadline(f.id, payload);
      else await createTaxDeadline(payload);
      setEditing(null);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteTaxDeadline(confirmDel.id);
      setConfirmDel(null);
      load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo eliminar.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-4xl p-4">
      <LoadingOverlay show={loading} text="Cargando..." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
            <CalendarDaysIcon className="h-6 w-6 text-orange-500" /> Calendario
            tributario
          </h1>
          <p className="text-sm text-gray-500">
            Cárgalo por año. Cada empresa ve las fechas que le aplican por el
            último dígito de su NIT y su régimen.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            icon={PlusIcon}
            onClick={() => setEditing({ ...emptyForm })}
          >
            Nueva fecha
          </Button>
        </div>
      </div>

      {/* UVT */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            UVT {year} (valor en COP)
          </label>
          <MoneyInput
            value={uvt}
            onChange={(v) => setUvt(v)}
            placeholder="$ 0"
            className="w-48 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
          />
        </div>
        <Button variant="secondary" onClick={saveUvt} loading={busy}>
          Guardar UVT
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Obligación</th>
              <th className="px-4 py-3">Título / periodo</th>
              <th className="px-4 py-3">Vence</th>
              <th className="px-4 py-3">Aplica a</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((d) => (
              <tr key={d.id} className={d.active ? 'text-gray-700' : 'text-gray-400'}>
                <td className="px-4 py-3 font-semibold">{d.obligation}</td>
                <td className="px-4 py-3">
                  {d.title}
                  {d.period && (
                    <span className="block text-[11px] text-gray-400">{d.period}</span>
                  )}
                </td>
                <td className="px-4 py-3">{fmtDate(d.dueDate)}</td>
                <td className="px-4 py-3 text-[11px] text-gray-500">
                  {d.nitDigits ? `NIT: ${d.nitDigits}` : 'Todos los NIT'}
                  {d.regime ? ` · ${d.regime}` : ''}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <TableActionButton
                      icon={PencilSquareIcon}
                      label="Editar"
                      variant="edit"
                      disabled={busy}
                      onClick={() =>
                        setEditing({
                          id: d.id,
                          obligation: d.obligation,
                          title: d.title,
                          period: d.period || '',
                          dueDate: d.dueDate
                            ? new Date(d.dueDate).toISOString().slice(0, 10)
                            : '',
                          nitDigits: d.nitDigits || '',
                          regime: d.regime || '',
                          notes: d.notes || '',
                          active: d.active,
                        })
                      }
                    />
                    <TableActionButton
                      icon={TrashIcon}
                      label="Eliminar"
                      variant="delete"
                      disabled={busy}
                      onClick={() => setConfirmDel(d)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  No hay fechas cargadas para {year}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {editing.id ? 'Editar fecha' : 'Nueva fecha'} · {year}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Obligación *
                </label>
                <select
                  value={editing.obligation}
                  onChange={(e) => setEditing({ ...editing, obligation: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                >
                  {OBLIGATIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Fecha de vencimiento *
                </label>
                <input
                  type="date"
                  value={editing.dueDate}
                  onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Título *
                </label>
                <input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Ej: Declaración de IVA - Bimestre 1"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Periodo
                </label>
                <input
                  value={editing.period}
                  onChange={(e) => setEditing({ ...editing, period: e.target.value })}
                  placeholder="Ej: Bimestre 1"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Régimen
                </label>
                <select
                  value={editing.regime}
                  onChange={(e) => setEditing({ ...editing, regime: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Todos</option>
                  <option value="SIMPLE">Simple</option>
                  <option value="ORDINARIO">Ordinario</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Últimos dígitos del NIT que aplican
                </label>
                <input
                  value={editing.nitDigits}
                  onChange={(e) => setEditing({ ...editing, nitDigits: e.target.value })}
                  placeholder="Vacío = todos. Ej: 1,2,3"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Notas
                </label>
                <textarea
                  rows={2}
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                />
                Activa (visible para las empresas)
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button variant="primary" icon={CheckCircleIcon} onClick={save} loading={busy}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirmDel(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-800">Eliminar fecha</h2>
            <p className="mt-2 text-sm text-gray-600">
              ¿Eliminar <b>{confirmDel.title}</b>?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmDel(null)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={doDelete} loading={busy}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertModal type={alert.type} message={alert.message} onClose={() => setAlert({})} />
    </div>
  );
}

export default function TaxCalendarPage() {
  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <TaxCalendarInner />
    </RoleGuard>
  );
}
