'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  HeartIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import {
  getClinical,
  saveClinicalRecord,
  addClinicalEntry,
  deleteClinicalEntry,
} from '@/lib/api/routes/clinical';

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

const REC_FIELDS = [
  { key: 'allergies', label: 'Alergias', ph: 'Ej: Penicilina, látex…' },
  { key: 'medications', label: 'Medicamentos actuales', ph: 'Ej: Losartán 50mg…' },
  { key: 'conditions', label: 'Antecedentes / enfermedades', ph: 'Ej: Diabetes, hipertensión…' },
  { key: 'bloodType', label: 'Tipo de sangre', ph: 'Ej: O+' },
  { key: 'notes', label: 'Observaciones generales', ph: 'Notas relevantes del paciente…' },
];

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ClinicalHistory({ customerId }) {
  const [record, setRecord] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRec, setEditRec] = useState(false);
  const [recForm, setRecForm] = useState({});
  const [savingRec, setSavingRec] = useState(false);
  const [showEntry, setShowEntry] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getClinical(customerId);
      setRecord(res?.data?.record || null);
      setEntries(res?.data?.entries || []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startEdit = () => {
    setRecForm({
      allergies: record?.allergies || '',
      medications: record?.medications || '',
      conditions: record?.conditions || '',
      bloodType: record?.bloodType || '',
      notes: record?.notes || '',
    });
    setEditRec(true);
  };

  const saveRec = async () => {
    setSavingRec(true);
    try {
      const res = await saveClinicalRecord(customerId, recForm);
      setRecord(res?.data || null);
      setEditRec(false);
    } finally {
      setSavingRec(false);
    }
  };

  const removeEntry = async (id) => {
    if (!confirm('¿Eliminar esta evolución?')) return;
    await deleteClinicalEntry(id);
    setEntries((l) => l.filter((e) => e.id !== id));
  };

  const hasRecord =
    record &&
    (record.allergies || record.medications || record.conditions || record.bloodType || record.notes);

  return (
    <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <HeartIcon className="h-5 w-5 text-rose-500" /> Historia clínica
        </h2>
        <Button variant="secondary" size="sm" onClick={() => setShowEntry(true)}>
          <PlusIcon className="mr-1 h-4 w-4" /> Nueva evolución
        </Button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-gray-400">Cargando…</p>
      ) : (
        <>
          {/* Antecedentes */}
          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Antecedentes del paciente
              </p>
              {!editRec && (
                <button
                  onClick={startEdit}
                  className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"
                >
                  <PencilSquareIcon className="h-3.5 w-3.5" /> Editar
                </button>
              )}
            </div>

            {editRec ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {REC_FIELDS.map((f) => (
                  <div key={f.key} className={f.key === 'notes' ? 'sm:col-span-2' : ''}>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      {f.label}
                    </label>
                    {f.key === 'notes' || f.key === 'conditions' ? (
                      <textarea
                        rows={2}
                        className={inputCls}
                        value={recForm[f.key] || ''}
                        placeholder={f.ph}
                        onChange={(e) =>
                          setRecForm((p) => ({ ...p, [f.key]: e.target.value }))
                        }
                      />
                    ) : (
                      <input
                        className={inputCls}
                        value={recForm[f.key] || ''}
                        placeholder={f.ph}
                        onChange={(e) =>
                          setRecForm((p) => ({ ...p, [f.key]: e.target.value }))
                        }
                      />
                    )}
                  </div>
                ))}
                <div className="flex gap-2 sm:col-span-2">
                  <Button variant="primary" size="sm" loading={savingRec} onClick={saveRec}>
                    Guardar
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditRec(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : hasRecord ? (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {REC_FIELDS.filter((f) => record[f.key]).map((f) => (
                  <div key={f.key} className={f.key === 'notes' ? 'sm:col-span-2' : ''}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      {f.label}
                    </dt>
                    <dd className="text-sm text-gray-700">{record[f.key]}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-gray-400">
                Sin antecedentes registrados. Usa “Editar” para agregarlos.
              </p>
            )}
          </div>

          {/* Evoluciones */}
          <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Evoluciones ({entries.length})
          </p>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-400">
              Aún no hay evoluciones. Registra la primera con “Nueva evolución”.
            </p>
          ) : (
            <ol className="relative space-y-3 border-l border-gray-200 pl-4">
              {entries.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-orange-400 ring-2 ring-white" />
                  <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-800">
                        {fmtDate(e.date)}
                      </span>
                      <div className="flex items-center gap-2">
                        {e.userName && (
                          <span className="text-[11px] text-gray-400">
                            {e.userName}
                          </span>
                        )}
                        <button
                          onClick={() => removeEntry(e.id)}
                          className="rounded-lg p-1 text-gray-300 hover:bg-rose-50 hover:text-rose-500"
                          aria-label="Eliminar"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-1.5 text-sm">
                      {e.reason && (
                        <p>
                          <span className="font-medium text-gray-500">Motivo: </span>
                          <span className="text-gray-700">{e.reason}</span>
                        </p>
                      )}
                      {e.diagnosis && (
                        <p>
                          <span className="font-medium text-gray-500">Diagnóstico: </span>
                          <span className="text-gray-700">{e.diagnosis}</span>
                        </p>
                      )}
                      {e.treatment && (
                        <p>
                          <span className="font-medium text-gray-500">Tratamiento: </span>
                          <span className="text-gray-700">{e.treatment}</span>
                        </p>
                      )}
                      {e.notes && (
                        <p className="whitespace-pre-line text-gray-600">{e.notes}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      {showEntry && (
        <EntryModal
          customerId={customerId}
          onClose={() => setShowEntry(false)}
          onSaved={(entry) => {
            setEntries((l) => [entry, ...l]);
            setShowEntry(false);
          }}
        />
      )}
    </div>
  );
}

function EntryModal({ customerId, onClose, onSaved }) {
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ date: today, reason: '', diagnosis: '', treatment: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.reason.trim() && !f.notes.trim() && !f.diagnosis.trim()) {
      setErr('Escribe al menos el motivo, diagnóstico o una nota.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      const res = await addClinicalEntry(customerId, {
        date: f.date ? new Date(f.date).toISOString() : undefined,
        reason: f.reason,
        diagnosis: f.diagnosis,
        treatment: f.treatment,
        notes: f.notes,
      });
      onSaved(res?.data);
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <ClipboardDocumentListIcon className="h-5 w-5 text-orange-500" />
          Nueva evolución
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Fecha</label>
            <input
              type="date"
              className={inputCls}
              value={f.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Motivo de consulta
            </label>
            <input className={inputCls} value={f.reason} onChange={(e) => set('reason', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Diagnóstico</label>
            <input className={inputCls} value={f.diagnosis} onChange={(e) => set('diagnosis', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Procedimiento / tratamiento
            </label>
            <input className={inputCls} value={f.treatment} onChange={(e) => set('treatment', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Evolución / notas</label>
            <textarea rows={3} className={inputCls} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={save}>
            Guardar evolución
          </Button>
        </div>
      </div>
    </div>
  );
}
