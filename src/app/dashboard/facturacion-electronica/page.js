'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  BoltIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
  PlusIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';
import {
  getFiscalStatus,
  setupFiscal,
  getFiscalDocuments,
  getFiscalStats,
  getFiscalRepresentation,
  addFiscalResolution,
  emitFiscalTestInvoice,
} from '@/lib/api/routes/fiscal';

const TYPE_LABELS = {
  FACTURA_VENTA: 'Factura',
  NOTA_CREDITO: 'Nota crédito',
  NOTA_DEBITO: 'Nota débito',
  DOCUMENTO_POS: 'Documento POS',
  NOMINA: 'Nómina',
};

const POLL_MS = 20000;

export default function FacturacionElectronicaPage() {
  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN]}>
      <FacturacionElectronica />
    </RoleGuard>
  );
}

function FacturacionElectronica() {
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [docs, setDocs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [working, setWorking] = useState(false);
  const [alert, setAlert] = useState({});
  const [lastSync, setLastSync] = useState(null);

  // filtros
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [docStatus, setDocStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // modales
  const [repHtml, setRepHtml] = useState(null);
  const [repLoading, setRepLoading] = useState(false);
  const [showResModal, setShowResModal] = useState(false);

  const linked = status?.linked;

  const loadStatus = useCallback(async () => {
    try {
      const res = await getFiscalStatus();
      setStatus(res?.data || null);
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    }
  }, []);

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const [s, d] = await Promise.all([
          getFiscalStats().catch(() => null),
          getFiscalDocuments({
            page,
            limit: 15,
            search,
            type,
            status: docStatus,
            dateFrom,
            dateTo,
          }),
        ]);
        setStats(s);
        setDocs(d?.data || []);
        setMeta(d?.meta || null);
        setLastSync(new Date());
      } catch (e) {
        if (!silent) setAlert({ type: 'error', message: e.message });
      } finally {
        if (!silent) setRefreshing(false);
      }
    },
    [page, search, type, docStatus, dateFrom, dateTo],
  );

  // carga inicial
  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadStatus();
      setLoading(false);
    })();
  }, [loadStatus]);

  // datos cuando ya está vinculada + cambio de filtros
  useEffect(() => {
    if (linked) loadData();
  }, [linked, loadData]);

  // polling en tiempo real (solo si hay documentos en tránsito)
  const pendingTransit = useMemo(
    () => (stats ? (stats.enviado || 0) + (stats.contingencia || 0) : 0),
    [stats],
  );
  const pollRef = useRef();
  useEffect(() => {
    if (!linked) return;
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadData(true), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [linked, loadData]);

  const hasResolution = (status?.resolutions?.length || 0) > 0;

  const handleEmitTest = async () => {
    setWorking(true);
    try {
      const r = await emitFiscalTestInvoice();
      setAlert({
        type: 'success',
        message: `Factura de prueba emitida: ${r?.number || ''} (${r?.status || ''}).`,
      });
      await loadData();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setWorking(false);
    }
  };

  const handleSetup = async () => {
    setWorking(true);
    try {
      await setupFiscal();
      setAlert({ type: 'success', message: 'Facturación electrónica activada.' });
      await loadStatus();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setWorking(false);
    }
  };

  const openRepresentation = async (id) => {
    setRepLoading(true);
    setRepHtml('');
    try {
      const html = await getFiscalRepresentation(id);
      setRepHtml(typeof html === 'string' ? html : html?.data || '');
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
      setRepHtml(null);
    } finally {
      setRepLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-[60vh] w-full">
        <LoadingOverlay show text="Cargando facturación electrónica..." />
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6">
      {/* ENCABEZADO */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow">
              <DocumentTextIcon className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-semibold text-gray-800">
              Facturación Electrónica
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Emisión directa ante la DIAN · sin costo por documento
          </p>
        </div>

        {linked && (
          <div className="flex flex-wrap items-center gap-2">
            <LiveIndicator lastSync={lastSync} active={pendingTransit > 0} />
            <Button
              variant="outline"
              size="sm"
              icon={ArrowPathIcon}
              loading={refreshing}
              onClick={() => loadData()}
            >
              Actualizar
            </Button>
            {hasResolution && (
              <Button
                variant="primary"
                size="sm"
                icon={PlusIcon}
                loading={working}
                onClick={handleEmitTest}
              >
                Emitir factura de prueba
              </Button>
            )}
          </div>
        )}
      </div>

      {/* NO VINCULADA -> activación */}
      {!linked && <SetupCard status={status} working={working} onSetup={handleSetup} />}

      {linked && (
        <>
          {/* ESTADO DE HABILITACIÓN */}
          <HabilitacionStrip
            status={status}
            onConfig={() => setShowResModal(true)}
          />

          {/* KPIs */}
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label="Total emitidos"
              value={stats?.total ?? 0}
              icon={DocumentTextIcon}
              tone="slate"
            />
            <KpiCard
              label="Aceptados DIAN"
              value={stats?.aceptado ?? 0}
              icon={CheckBadgeIcon}
              tone="emerald"
            />
            <KpiCard
              label="Firmados / por transmitir"
              value={(stats?.firmado ?? 0) + (stats?.enviado ?? 0)}
              icon={BoltIcon}
              tone="indigo"
            />
            <KpiCard
              label="Rechazados"
              value={stats?.rechazado ?? 0}
              icon={ExclamationTriangleIcon}
              tone="red"
            />
          </div>

          {/* TABLA */}
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* toolbar */}
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
              <div className="relative max-w-xs flex-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder="Buscar por número o CUFE..."
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>Desde</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setPage(1);
                      setDateFrom(e.target.value);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <span>Hasta</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setPage(1);
                      setDateTo(e.target.value);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={() => {
                        setPage(1);
                        setDateFrom('');
                        setDateTo('');
                      }}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <Select
                  value={type}
                  onChange={(v) => {
                    setPage(1);
                    setType(v);
                  }}
                  options={[
                    ['', 'Todos los tipos'],
                    ['FACTURA_VENTA', 'Facturas'],
                    ['NOTA_CREDITO', 'Notas crédito'],
                    ['NOTA_DEBITO', 'Notas débito'],
                  ]}
                />
                <Select
                  value={docStatus}
                  onChange={(v) => {
                    setPage(1);
                    setDocStatus(v);
                  }}
                  options={[
                    ['', 'Todos los estados'],
                    ['BORRADOR', 'Borrador'],
                    ['FIRMADO', 'Firmado'],
                    ['ENVIADO', 'Enviado'],
                    ['ACEPTADO', 'Aceptado'],
                    ['RECHAZADO', 'Rechazado'],
                  ]}
                />
              </div>
            </div>

            <div className="relative overflow-x-auto">
              <LoadingOverlay show={refreshing} text="" />
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 font-semibold">Número</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 text-right font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center">
                        <DocumentTextIcon className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-sm text-gray-500">
                          Aún no hay documentos emitidos.
                        </p>
                        <p className="text-xs text-gray-400">
                          Emite una factura desde una venta para verla aquí.
                        </p>
                      </td>
                    </tr>
                  )}
                  {docs.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-gray-50 transition hover:bg-orange-50/30"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                        {d.number || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {TYPE_LABELS[d.type] || d.type}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {d.customer || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-gray-800">
                        {formatCOP(d.total || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={d.status} />
                        {d.status === 'RECHAZADO' && d.error && (
                          <span
                            className="ml-1 cursor-help text-red-400"
                            title={d.error}
                          >
                            ⓘ
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDateTime(d.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openRepresentation(d.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-orange-600 transition hover:bg-orange-50"
                        >
                          <EyeIcon className="h-4 w-4" /> Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* paginación */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
                <span>
                  Página {meta.page} de {meta.totalPages} · {meta.total} documentos
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL representación */}
      {(repHtml !== null || repLoading) && (
        <RepresentationModal
          html={repHtml}
          loading={repLoading}
          onClose={() => {
            setRepHtml(null);
            setRepLoading(false);
          }}
        />
      )}

      {/* MODAL resolución de numeración */}
      {showResModal && (
        <ResolutionModal
          onClose={() => setShowResModal(false)}
          onSaved={async () => {
            setShowResModal(false);
            setAlert({ type: 'success', message: 'Resolución registrada.' });
            await loadStatus();
          }}
          onError={(m) => setAlert({ type: 'error', message: m })}
        />
      )}

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({})}
      />
    </div>
  );
}

/* ───────── Sub-componentes ───────── */

function LiveIndicator({ lastSync, active }) {
  const secs = lastSync
    ? Math.max(0, Math.round((Date.now() - lastSync.getTime()) / 1000))
    : null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 ring-1 ring-gray-200">
      <span className="relative flex h-2 w-2">
        {active && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      En vivo{secs != null ? ` · hace ${secs}s` : ''}
    </span>
  );
}

function SetupCard({ status, working, onSetup }) {
  const noNit = status && status.hasNit === false;
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg">
        <BoltIcon className="h-7 w-7" />
      </span>
      <h2 className="text-xl font-semibold text-gray-800">
        Activa tu facturación electrónica
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
        Emite facturas y notas directo ante la DIAN, sin intermediarios ni costo
        por documento. Al activar, vinculamos tu empresa al sistema fiscal de
        Pegazo.
      </p>

      {noNit ? (
        <div className="mx-auto mt-5 flex max-w-md items-start gap-2 rounded-xl bg-amber-50 p-3 text-left text-sm text-amber-800 ring-1 ring-amber-200">
          <ExclamationTriangleIcon className="h-5 w-5 flex-none" />
          <span>
            Primero configura el <b>NIT</b> de tu empresa en los datos del
            negocio. Es obligatorio para facturar ante la DIAN.
          </span>
        </div>
      ) : (
        <Button
          variant="primary"
          size="lg"
          className="mt-6"
          loading={working}
          onClick={onSetup}
        >
          Activar facturación electrónica
        </Button>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
        {[
          ['UBL 2.1 + CUFE', 'Formato oficial DIAN'],
          ['Firma digital', 'XAdES-EPES segura'],
          ['$0 por factura', 'Sin costo por documento'],
        ].map(([t, s]) => (
          <div key={t} className="rounded-xl bg-gray-50 p-3">
            <p className="text-sm font-semibold text-gray-800">{t}</p>
            <p className="text-xs text-gray-500">{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HabilitacionStrip({ status, onConfig }) {
  const isProd = status?.env === 'PRODUCCION';
  const hasCert = status?.hasCertificate;
  const resCount = status?.resolutions?.length || 0;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <StripItem
          icon={ShieldCheckIcon}
          label="Estado DIAN"
          ok={status?.habilitacion === 'HABILITADO'}
        >
          <StatusBadge status={status?.habilitacion || 'REGISTRADO'} />
        </StripItem>
        <StripItem icon={BoltIcon} label="Ambiente" ok={isProd}>
          <span
            className={`text-sm font-semibold ${isProd ? 'text-emerald-600' : 'text-amber-600'}`}
          >
            {isProd ? 'Producción' : 'Pruebas (habilitación)'}
          </span>
        </StripItem>
        <StripItem icon={CheckBadgeIcon} label="Certificado" ok={hasCert}>
          <span
            className={`text-sm font-semibold ${hasCert ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            {hasCert ? 'Cargado' : 'Falta cargar'}
          </span>
        </StripItem>
        <StripItem icon={DocumentTextIcon} label="Resoluciones" ok={resCount > 0}>
          <span className="text-sm font-semibold text-gray-700">{resCount}</span>
        </StripItem>
      </div>
      <Button variant="outline" size="sm" icon={Cog6ToothIcon} onClick={onConfig}>
        Configurar
      </Button>
    </div>
  );
}

function StripItem({ icon: Icon, label, ok, children }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`grid h-8 w-8 place-items-center rounded-lg ${
          ok ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-gray-400">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

const TONES = {
  slate: 'from-slate-500 to-slate-400',
  emerald: 'from-emerald-500 to-emerald-400',
  indigo: 'from-indigo-500 to-indigo-400',
  red: 'from-red-500 to-red-400',
};

function KpiCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-800">
            {value}
          </p>
        </div>
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${TONES[tone]} text-white shadow`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

function RepresentationModal({ html, loading, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-800">
            Representación gráfica
          </h3>
          <div className="flex items-center gap-2">
            {html && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const w = window.open('', '_blank');
                  if (w) {
                    w.document.write(html);
                    w.document.close();
                    w.focus();
                    w.print();
                  }
                }}
              >
                Imprimir
              </Button>
            )}
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="relative flex-1 bg-gray-50">
          {loading ? (
            <LoadingOverlay show text="Generando representación..." />
          ) : (
            <iframe
              title="Representación"
              srcDoc={html}
              className="h-full w-full border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Campo del modal de resolución. Definido a NIVEL DE MÓDULO (no dentro del
// componente padre) para que React no lo remonte en cada tecla — si se define
// dentro del render, el input pierde el foco y se resetea al escribir.
function ResField({ form, set, k, label, ...rest }) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <input
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        className="rounded-lg border border-gray-200 px-3 py-2 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        {...rest}
      />
    </label>
  );
}

function ResolutionModal({ onClose, onSaved, onError }) {
  const [form, setForm] = useState({
    documentType: 'FACTURA_VENTA',
    prefix: 'SETP',
    resolution: '',
    technicalKey: '',
    rangeFrom: '',
    rangeTo: '',
    validFrom: '',
    validTo: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setSaving(true);
    try {
      await addFiscalResolution({
        ...form,
        rangeFrom: Number(form.rangeFrom),
        rangeTo: Number(form.rangeTo),
      });
      onSaved();
    } catch (e) {
      onError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Resolución de numeración
            </h3>
            <p className="text-xs text-gray-500">
              Los rangos autorizados por la DIAN para tus documentos.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5">
          <label className="col-span-2 flex flex-col text-sm">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tipo de documento
            </span>
            <select
              value={form.documentType}
              onChange={(e) => set('documentType', e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="FACTURA_VENTA">Factura de venta</option>
              <option value="NOTA_CREDITO">Nota crédito</option>
              <option value="NOTA_DEBITO">Nota débito</option>
            </select>
          </label>
          <ResField form={form} set={set} k="prefix" label="Prefijo" placeholder="SETP" />
          <ResField form={form} set={set} k="resolution" label="N° Resolución" placeholder="18760000001" />
          <ResField
            form={form}
            set={set}
            k="technicalKey"
            label="Clave técnica"
            placeholder="(solo factura)"
          />
          <ResField form={form} set={set} k="rangeFrom" label="Desde" type="number" placeholder="990000000" />
          <ResField form={form} set={set} k="rangeTo" label="Hasta" type="number" placeholder="995000000" />
          <ResField form={form} set={set} k="validFrom" label="Válida desde" type="date" />
          <ResField form={form} set={set} k="validTo" label="Válida hasta" type="date" />
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <Button variant="clear" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" icon={PlusIcon} loading={saving} onClick={submit}>
            Registrar
          </Button>
        </div>
      </div>
    </div>
  );
}
