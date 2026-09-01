'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  HeartIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  PhotoIcon,
  PrinterIcon,
  DocumentCheckIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import {
  getClinical,
  saveClinicalRecord,
  addClinicalEntry,
  deleteClinicalEntry,
  uploadClinicalImage,
  addClinicalConsent,
  deleteClinicalConsent,
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

// Estados del odontograma (dental) y su color.
const TOOTH_STATES = [
  { id: '', label: 'Sano', cls: 'bg-white text-gray-700 border-gray-200' },
  { id: 'caries', label: 'Caries', cls: 'bg-red-100 text-red-700 border-red-300' },
  { id: 'obturado', label: 'Obturado', cls: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'corona', label: 'Corona', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
  { id: 'ausente', label: 'Ausente', cls: 'bg-gray-200 text-gray-400 border-gray-300 line-through' },
];
const toothCls = (st) =>
  (TOOTH_STATES.find((s) => s.id === (st || '')) || TOOTH_STATES[0]).cls;
// Dentición FDI (adulto): superior 18→11, 21→28 · inferior 48→41, 31→38.
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ClinicalHistory({ customerId, patientName = '', dental = false }) {
  const [record, setRecord] = useState(null);
  const [entries, setEntries] = useState([]);
  const [consents, setConsents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRec, setEditRec] = useState(false);
  const [recForm, setRecForm] = useState({});
  const [savingRec, setSavingRec] = useState(false);
  const [showEntry, setShowEntry] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getClinical(customerId);
      setRecord(res?.data?.record || null);
      setEntries(res?.data?.entries || []);
      setConsents(res?.data?.consents || []);
      setAppointments(res?.data?.appointments || []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const apptLabel = (id) => {
    const a = appointments.find((x) => x.id === id);
    if (!a) return null;
    return `${fmtDate(a.date)}${a.startTime ? ' · ' + a.startTime : ''}${a.service?.name ? ' · ' + a.service.name : ''}`;
  };

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

  const saveOdontogram = async (odontogram) => {
    const res = await saveClinicalRecord(customerId, { odontogram });
    setRecord(res?.data || null);
  };

  const removeEntry = async (id) => {
    if (!confirm('¿Eliminar esta evolución?')) return;
    await deleteClinicalEntry(id);
    setEntries((l) => l.filter((e) => e.id !== id));
  };

  const removeConsent = async (id) => {
    if (!confirm('¿Eliminar este consentimiento?')) return;
    await deleteClinicalConsent(id);
    setConsents((l) => l.filter((c) => c.id !== id));
  };

  const printHistory = () => printClinical(patientName, record, entries);

  const hasRecord =
    record &&
    (record.allergies || record.medications || record.conditions || record.bloodType || record.notes);

  return (
    <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <HeartIcon className="h-5 w-5 text-rose-500" /> Historia clínica
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={printHistory}>
            <PrinterIcon className="mr-1 h-4 w-4" /> Imprimir
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowEntry(true)}>
            <PlusIcon className="mr-1 h-4 w-4" /> Nueva evolución
          </Button>
        </div>
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
                        onChange={(e) => setRecForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      />
                    ) : (
                      <input
                        className={inputCls}
                        value={recForm[f.key] || ''}
                        placeholder={f.ph}
                        onChange={(e) => setRecForm((p) => ({ ...p, [f.key]: e.target.value }))}
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

          {/* Odontograma (solo dental) */}
          {dental && (
            <Odontogram
              value={record?.odontogram || {}}
              onSave={saveOdontogram}
            />
          )}

          {/* Consentimientos */}
          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Consentimientos ({consents.length})
            </p>
            <button
              onClick={() => setShowConsent(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"
            >
              <DocumentCheckIcon className="h-3.5 w-3.5" /> Nuevo consentimiento
            </button>
          </div>
          {consents.length === 0 ? (
            <p className="mt-1 text-sm text-gray-400">
              Sin consentimientos firmados.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {consents.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {c.signatureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.signatureUrl}
                        alt="Firma"
                        className="h-10 w-20 flex-none rounded border border-gray-200 bg-white object-contain"
                      />
                    ) : (
                      <DocumentCheckIcon className="h-8 w-8 flex-none text-emerald-500" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {c.title}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Firmado {fmtDate(c.signedAt)}
                        {c.userName ? ` · ${c.userName}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeConsent(c.id)}
                    className="rounded-lg p-1 text-gray-300 hover:bg-rose-50 hover:text-rose-500"
                    aria-label="Eliminar"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

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
                      <span className="text-xs font-semibold text-gray-800">{fmtDate(e.date)}</span>
                      <div className="flex items-center gap-2">
                        {e.userName && (
                          <span className="text-[11px] text-gray-400">{e.userName}</span>
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
                    {e.appointmentId && apptLabel(e.appointmentId) && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600">
                        <CalendarDaysIcon className="h-3 w-3" /> {apptLabel(e.appointmentId)}
                      </span>
                    )}
                    <div className="mt-2 grid grid-cols-1 gap-1.5 text-sm">
                      {e.reason && (
                        <p><span className="font-medium text-gray-500">Motivo: </span><span className="text-gray-700">{e.reason}</span></p>
                      )}
                      {e.diagnosis && (
                        <p><span className="font-medium text-gray-500">Diagnóstico: </span><span className="text-gray-700">{e.diagnosis}</span></p>
                      )}
                      {e.treatment && (
                        <p><span className="font-medium text-gray-500">Tratamiento: </span><span className="text-gray-700">{e.treatment}</span></p>
                      )}
                      {e.notes && <p className="whitespace-pre-line text-gray-600">{e.notes}</p>}
                    </div>
                    {Array.isArray(e.attachments) && e.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {e.attachments.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt="Adjunto clínico"
                              className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
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
          appointments={appointments}
          onClose={() => setShowEntry(false)}
          onSaved={(entry) => {
            setEntries((l) => [entry, ...l]);
            setShowEntry(false);
          }}
        />
      )}

      {showConsent && (
        <ConsentModal
          customerId={customerId}
          onClose={() => setShowConsent(false)}
          onSaved={(consent) => {
            setConsents((l) => [consent, ...l]);
            setShowConsent(false);
          }}
        />
      )}
    </div>
  );
}

/* ---------- Odontograma ---------- */
function Odontogram({ value, onSave }) {
  const [map, setMap] = useState(value || {});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMap(value || {});
    setDirty(false);
  }, [value]);

  const cycle = (n) => {
    const cur = map[n] || '';
    const idx = TOOTH_STATES.findIndex((s) => s.id === cur);
    const next = TOOTH_STATES[(idx + 1) % TOOTH_STATES.length].id;
    const nm = { ...map };
    if (next) nm[n] = next;
    else delete nm[n];
    setMap(nm);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(map);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const Row = ({ teeth }) => (
    <div className="flex justify-center gap-1">
      {teeth.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => cycle(n)}
          title={`Diente ${n}`}
          className={`flex h-9 w-8 flex-col items-center justify-center rounded-md border text-[10px] font-semibold transition ${toothCls(map[n])}`}
        >
          {n}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Odontograma
        </p>
        {dirty && (
          <Button variant="primary" size="sm" loading={saving} onClick={save}>
            Guardar odontograma
          </Button>
        )}
      </div>
      <div className="space-y-1 overflow-x-auto">
        <Row teeth={UPPER} />
        <div className="my-1 border-t border-dashed border-gray-200" />
        <Row teeth={LOWER} />
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {TOOTH_STATES.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className={`inline-block h-3 w-3 rounded border ${s.cls}`} />
            {s.label}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        Toca un diente para cambiar su estado.
      </p>
    </div>
  );
}

/* ---------- Modal de evolución (con adjuntos) ---------- */
function EntryModal({ customerId, appointments = [], onClose, onSaved }) {
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ date: today, reason: '', diagnosis: '', treatment: '', notes: '', appointmentId: '' });
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setErr('');
    try {
      for (const file of files) {
        const res = await uploadClinicalImage(file);
        if (res?.data?.url) setAttachments((a) => [...a, res.data.url]);
      }
    } catch (e2) {
      setErr(e2?.message || 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    if (!f.reason.trim() && !f.notes.trim() && !f.diagnosis.trim() && attachments.length === 0) {
      setErr('Escribe al menos el motivo, diagnóstico, una nota o adjunta una imagen.');
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
        appointmentId: f.appointmentId ? Number(f.appointmentId) : undefined,
        attachments,
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
          <ClipboardDocumentListIcon className="h-5 w-5 text-orange-500" /> Nueva evolución
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Fecha</label>
            <input type="date" className={inputCls} value={f.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          {appointments.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Cita relacionada (opcional)
              </label>
              <select
                className={inputCls}
                value={f.appointmentId}
                onChange={(e) => set('appointmentId', e.target.value)}
              >
                <option value="">Sin cita</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {fmtDate(a.date)}
                    {a.startTime ? ` · ${a.startTime}` : ''}
                    {a.service?.name ? ` · ${a.service.name}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Motivo de consulta</label>
            <input className={inputCls} value={f.reason} onChange={(e) => set('reason', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Diagnóstico</label>
            <input className={inputCls} value={f.diagnosis} onChange={(e) => set('diagnosis', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Procedimiento / tratamiento</label>
            <input className={inputCls} value={f.treatment} onChange={(e) => set('treatment', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Evolución / notas</label>
            <textarea rows={3} className={inputCls} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          {/* Adjuntos */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Fotos / radiografías
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {attachments.map((url) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Adjunto" className="h-16 w-16 rounded-lg border border-gray-200 object-cover" />
                  <button
                    type="button"
                    onClick={() => setAttachments((a) => a.filter((x) => x !== url))}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-xs text-white shadow"
                    aria-label="Quitar"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-[10px] text-gray-400 hover:border-orange-300 hover:text-orange-500"
              >
                <PhotoIcon className="h-5 w-5" />
                {uploading ? '…' : 'Subir'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onFiles}
              />
            </div>
          </div>
        </div>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" loading={saving} disabled={uploading} onClick={save}>
            Guardar evolución
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Consentimiento con firma ---------- */
function SignaturePad({ canvasRef, onDraw }) {
  const drawing = useRef(false);
  const last = useRef(null);

  const pos = (e) => {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const x = (e.clientX - r.left) * (c.width / r.width);
    const y = (e.clientY - r.top) * (c.height / r.height);
    return { x, y };
  };
  const start = (e) => {
    drawing.current = true;
    last.current = pos(e);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = pos(e);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    onDraw?.();
  };
  const end = () => {
    drawing.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={150}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerLeave={end}
      className="w-full touch-none rounded-lg border border-gray-300 bg-white"
      style={{ cursor: 'crosshair' }}
    />
  );
}

function ConsentModal({ customerId, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [hasSig, setHasSig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const canvasRef = useRef(null);

  const clearSig = () => {
    const c = canvasRef.current;
    if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
    setHasSig(false);
  };

  const save = async () => {
    if (!title.trim()) {
      setErr('Escribe un título para el consentimiento.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      let signatureUrl;
      if (hasSig && canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'firma.png', { type: 'image/png' });
        const up = await uploadClinicalImage(file);
        signatureUrl = up?.data?.url;
      }
      const res = await addClinicalConsent(customerId, {
        title: title.trim(),
        notes: notes.trim() || undefined,
        signatureUrl,
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
          <DocumentCheckIcon className="h-5 w-5 text-emerald-600" /> Nuevo
          consentimiento
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Título
            </label>
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Consentimiento de tratamiento de ortodoncia"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Texto / observaciones (opcional)
            </label>
            <textarea
              rows={3}
              className={inputCls}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalle del consentimiento…"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-500">
                Firma del paciente
              </label>
              <button
                type="button"
                onClick={clearSig}
                className="text-[11px] font-medium text-gray-400 hover:text-gray-600"
              >
                Limpiar
              </button>
            </div>
            <SignaturePad canvasRef={canvasRef} onDraw={() => setHasSig(true)} />
            <p className="mt-1 text-[11px] text-gray-400">
              El paciente firma con el mouse o el dedo (en tablet/celular).
            </p>
          </div>
        </div>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={save}>
            Guardar consentimiento
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Impresión ---------- */
function printClinical(patientName, record, entries) {
  const esc = (s) => String(s || '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const rec = record || {};
  const ant = [
    ['Alergias', rec.allergies],
    ['Medicamentos', rec.medications],
    ['Antecedentes', rec.conditions],
    ['Tipo de sangre', rec.bloodType],
    ['Observaciones', rec.notes],
  ].filter(([, v]) => v);
  const antHtml = ant.length
    ? ant.map(([k, v]) => `<p><b>${k}:</b> ${esc(v)}</p>`).join('')
    : '<p style="color:#888">Sin antecedentes.</p>';
  const evHtml = (entries || []).length
    ? entries
        .map((e) => {
          const d = new Date(e.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
          const rows = [
            e.reason && `<b>Motivo:</b> ${esc(e.reason)}`,
            e.diagnosis && `<b>Diagnóstico:</b> ${esc(e.diagnosis)}`,
            e.treatment && `<b>Tratamiento:</b> ${esc(e.treatment)}`,
            e.notes && esc(e.notes),
          ].filter(Boolean).map((r) => `<p style="margin:2px 0">${r}</p>`).join('');
          return `<div style="border:1px solid #eee;border-radius:8px;padding:10px;margin:8px 0">
            <div style="display:flex;justify-content:space-between"><b>${d}</b><span style="color:#888">${esc(e.userName || '')}</span></div>
            ${rows}
          </div>`;
        })
        .join('')
    : '<p style="color:#888">Sin evoluciones.</p>';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Historia clínica${patientName ? ' · ' + esc(patientName) : ''}</title>
    <style>body{font-family:system-ui,Arial,sans-serif;color:#222;max-width:720px;margin:24px auto;padding:0 20px;line-height:1.5}
    h1{font-size:20px;margin:0} h2{font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#e8581f;margin:22px 0 8px;border-bottom:1px solid #eee;padding-bottom:4px}
    p{margin:3px 0;font-size:13px}</style></head><body>
    <h1>Historia clínica${patientName ? ' — ' + esc(patientName) : ''}</h1>
    <p style="color:#888;font-size:12px">Generado el ${new Date().toLocaleDateString('es-CO')}</p>
    <h2>Antecedentes</h2>${antHtml}
    <h2>Evoluciones</h2>${evHtml}
    </body></html>`;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}
