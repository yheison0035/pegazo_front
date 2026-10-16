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
import { useAuth } from '@/context/authContext';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
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
  uploadFiscalCertificate,
  updateFiscalConfig,
  emitFiscalTestInvoice,
  sendFiscalEmail,
  getFiscalWhatsapp,
  deleteFiscalDocument,
  annulFiscalDocument,
  createFiscalCreditNote,
  createFiscalDebitNote,
} from '@/lib/api/routes/fiscal';

// Conceptos DIAN por tipo de nota.
const CREDIT_CONCEPTS = [
  ['1', 'Devolución parcial de bienes / servicio'],
  ['2', 'Anulación de la factura'],
  ['3', 'Rebaja o descuento'],
  ['4', 'Ajuste de precio'],
  ['5', 'Otros'],
];
const DEBIT_CONCEPTS = [
  ['1', 'Intereses'],
  ['2', 'Gastos por cobrar'],
  ['3', 'Cambio del valor (mayor)'],
  ['4', 'Otros'],
];

const TYPE_LABELS = {
  FACTURA_VENTA: 'Factura',
  NOTA_CREDITO: 'Nota crédito',
  NOTA_DEBITO: 'Nota débito',
  DOCUMENTO_POS: 'Documento POS',
  NOMINA: 'Nómina',
};

const POLL_MS = 20000;

export default function FacturacionElectronicaPage() {
  const auth = useAuth();
  const released = !!auth?.usuario?.company?.einvoicingReleased;
  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN]}>
      {released ? <FacturacionElectronica /> : <ComingSoon />}
    </RoleGuard>
  );
}

// Mientras no tengamos el certificado como PT, la función queda oculta.
function ComingSoon() {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
      <p className="text-base font-bold text-gray-800">Próximamente</p>
      <p className="mt-1 text-sm text-gray-500">
        La facturación electrónica estará disponible muy pronto. Te avisaremos
        cuando puedas activarla.
      </p>
    </div>
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
  const [repDocId, setRepDocId] = useState(null);
  const [showResModal, setShowResModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [noteModal, setNoteModal] = useState(null); // { doc, kind: 'CREDIT'|'DEBIT' }

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
  const hasCert = !!status?.hasCertificate;
  const isProd = status?.env === 'PRODUCCION';
  // Puede PROBAR (habilitación) con certificado + resolución.
  const readyToTest = linked && hasCert && hasResolution;
  // Puede facturar REAL solo en producción.
  const readyProd = readyToTest && isProd;

  const openSupport = () =>
    typeof window !== 'undefined' &&
    window.dispatchEvent(new Event('pegazo-open-support'));

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
    setRepDocId(id);
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

  const [sending, setSending] = useState(false);
  const handleSendEmail = async () => {
    if (!repDocId) return;
    setSending(true);
    try {
      const r = await sendFiscalEmail(repDocId);
      setAlert({ type: 'success', message: `Factura enviada a ${r?.to || 'el cliente'}.` });
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setSending(false);
    }
  };
  const handleSendWhatsapp = async () => {
    if (!repDocId) return;
    try {
      const r = await getFiscalWhatsapp(repDocId);
      if (r?.url) window.open(r.url, '_blank');
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    }
  };

  const handleDelete = async (doc) => {
    if (
      !window.confirm(
        `¿Eliminar el documento ${doc.number || ''}? Solo se puede porque aún no fue transmitido a la DIAN.`,
      )
    )
      return;
    try {
      await deleteFiscalDocument(doc.id);
      setAlert({ type: 'success', message: 'Documento eliminado.' });
      await loadData();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    }
  };

  const handleAnnul = async (doc) => {
    if (
      !window.confirm(
        `¿Anular la factura ${doc.number || ''}? Se generará una nota crédito total que la deja sin efecto.`,
      )
    )
      return;
    try {
      const nc = await annulFiscalDocument(doc.id);
      setAlert({
        type: 'success',
        message: `Factura anulada con la nota crédito ${nc?.number || ''}.`,
      });
      await loadData();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
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
            {readyToTest && (
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

      {/* ONBOARDING guiado (modelo Proveedor Tecnológico): pasos bloqueados, se
          desbloquea el siguiente al terminar el anterior. Sin certificado del
          cliente — ese lo pone Pegazo como PT. Mientras no quede listo en
          producción, el cliente NO puede facturar. */}
      {!readyProd && (
        <OnboardingWizard
          status={status}
          working={working}
          onSetup={handleSetup}
          onResolution={() => setShowResModal(true)}
          openSupport={openSupport}
        />
      )}

      {readyProd && (
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
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openRepresentation(d.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-orange-600 transition hover:bg-orange-50"
                          >
                            <EyeIcon className="h-4 w-4" /> Ver
                          </button>
                          {d.type === 'FACTURA_VENTA' &&
                            d.status !== 'RECHAZADO' && (
                              <>
                                <button
                                  onClick={() => setNoteModal({ doc: d, kind: 'CREDIT' })}
                                  className="rounded-lg px-2 py-1 text-xs font-medium text-amber-600 transition hover:bg-amber-50"
                                  title="Nota crédito (devolución, descuento, ajuste)"
                                >
                                  N. crédito
                                </button>
                                <button
                                  onClick={() => setNoteModal({ doc: d, kind: 'DEBIT' })}
                                  className="rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                                  title="Nota débito (subir el valor)"
                                >
                                  N. débito
                                </button>
                                <button
                                  onClick={() => handleAnnul(d)}
                                  className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                  title="Anular con nota crédito total"
                                >
                                  Anular
                                </button>
                              </>
                            )}
                          {(d.status === 'BORRADOR' ||
                            d.status === 'FIRMADO' ||
                            d.status === 'ERROR') && (
                            <button
                              onClick={() => handleDelete(d)}
                              className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                              title="Eliminar (aún no transmitida)"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
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
          sending={sending}
          onEmail={handleSendEmail}
          onWhatsapp={handleSendWhatsapp}
          onClose={() => {
            setRepHtml(null);
            setRepLoading(false);
            setRepDocId(null);
          }}
        />
      )}

      {/* MODAL nota crédito / débito */}
      {noteModal && (
        <NoteModal
          doc={noteModal.doc}
          kind={noteModal.kind}
          onClose={() => setNoteModal(null)}
          onSaved={async (nota) => {
            setNoteModal(null);
            setAlert({
              type: 'success',
              message: `${noteModal.kind === 'DEBIT' ? 'Nota débito' : 'Nota crédito'} ${nota?.number || ''} emitida.`,
            });
            await loadData();
          }}
          onError={(m) => setAlert({ type: 'error', message: m })}
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

      {showCertModal && (
        <CertModal
          onClose={() => setShowCertModal(false)}
          onSaved={async () => {
            setShowCertModal(false);
            setAlert({ type: 'success', message: 'Certificado cargado y cifrado.' });
            await loadStatus();
          }}
          onError={(m) => setAlert({ type: 'error', message: m })}
        />
      )}

      {showConfigModal && (
        <ConfigModal
          status={status}
          onClose={() => setShowConfigModal(false)}
          onSaved={async () => {
            setShowConfigModal(false);
            setAlert({ type: 'success', message: 'Datos de la DIAN guardados.' });
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

function RepresentationModal({
  html,
  loading,
  sending,
  onEmail,
  onWhatsapp,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-800">
            Representación gráfica
          </h3>
          <div className="flex items-center gap-2">
            {html && onEmail && (
              <Button
                variant="outline"
                size="sm"
                loading={sending}
                onClick={onEmail}
              >
                Enviar por correo
              </Button>
            )}
            {html && onWhatsapp && (
              <Button variant="outline" size="sm" onClick={onWhatsapp}>
                WhatsApp
              </Button>
            )}
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

// Modal de nota crédito PARCIAL: devolución/ajuste sobre una factura aceptada.
function NoteModal({ doc, kind, onClose, onSaved, onError }) {
  const isDebit = kind === 'DEBIT';
  const concepts = isDebit ? DEBIT_CONCEPTS : CREDIT_CONCEPTS;
  const [concept, setConcept] = useState(isDebit ? '3' : '1');
  const [reason, setReason] = useState('');
  const [lines, setLines] = useState([
    { description: '', quantity: 1, unitPrice: '', vatRate: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const setLine = (i, k, v) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));
  const addLine = () =>
    setLines((ls) => [
      ...ls,
      { description: '', quantity: 1, unitPrice: '', vatRate: 0 },
    ]);
  const removeLine = (i) => setLines((ls) => ls.filter((_, idx) => idx !== i));

  const total = lines.reduce(
    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
    0,
  );

  const submit = async () => {
    const clean = lines
      .filter((l) => l.description.trim() && Number(l.unitPrice) > 0)
      .map((l) => ({
        description: l.description.trim(),
        quantity: Number(l.quantity) || 1,
        unitPrice: Number(l.unitPrice),
        vatRate: Number(l.vatRate) || 0,
      }));
    if (!clean.length) {
      onError('Agrega al menos una línea con descripción y valor.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        originalInvoiceId: doc.id,
        reason:
          reason ||
          concepts.find(([c]) => c === concept)?.[1] ||
          (isDebit ? 'Ajuste' : 'Devolución / ajuste'),
        reasonCode: concept,
        lines: clean,
      };
      const nota = isDebit
        ? await createFiscalDebitNote(payload)
        : await createFiscalCreditNote(payload);
      onSaved(nota);
    } catch (e) {
      onError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              {isDebit ? 'Nota débito' : 'Nota crédito'}
            </h3>
            <p className="text-xs text-gray-500">
              Sobre la factura {doc.number} ·{' '}
              {isDebit ? 'sube el valor cobrado' : 'devoluciones, descuentos o ajustes'}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 p-5">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Concepto (DIAN)
            </span>
            <select
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              {concepts.map(([c, label]) => (
                <option key={c} value={c}>
                  {c} · {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Motivo (detalle)
            </span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descripción del motivo…"
              className="rounded-lg border border-gray-200 px-3 py-2 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </label>

          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="flex items-end gap-2">
                <label className="flex-1">
                  <span className="text-[10px] uppercase text-gray-400">
                    Concepto
                  </span>
                  <input
                    value={l.description}
                    onChange={(e) => setLine(i, 'description', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </label>
                <label className="w-14">
                  <span className="text-[10px] uppercase text-gray-400">Cant</span>
                  <input
                    type="number"
                    value={l.quantity}
                    onChange={(e) => setLine(i, 'quantity', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </label>
                <label className="w-24">
                  <span className="text-[10px] uppercase text-gray-400">
                    V. unit.
                  </span>
                  <MoneyInput
                    value={l.unitPrice}
                    onChange={(v) => setLine(i, 'unitPrice', v)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </label>
                <label className="w-16">
                  <span className="text-[10px] uppercase text-gray-400">IVA%</span>
                  <input
                    type="number"
                    value={l.vatRate}
                    onChange={(e) => setLine(i, 'vatRate', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </label>
                {lines.length > 1 && (
                  <button
                    onClick={() => removeLine(i)}
                    className="mb-1 grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addLine}
              className="text-xs font-medium text-orange-600 hover:underline"
            >
              + Agregar línea
            </button>
          </div>

          <div className="text-right text-sm font-semibold text-gray-800">
            {isDebit ? 'Total a cobrar (adicional):' : 'Total a acreditar:'}{' '}
            {'$' + total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <Button variant="clear" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" icon={PlusIcon} loading={saving} onClick={submit}>
            {isDebit ? 'Emitir nota débito' : 'Emitir nota crédito'}
          </Button>
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

// Paso a paso para dejar la empresa conectada a la DIAN. Cada paso muestra si
// ya está hecho y un botón para completarlo. El último (pasar a producción) se
// hace desde "Datos de la DIAN".
// Enlaces oficiales de la DIAN para el trámite (portal de habilitación).
const DIAN_HABILITACION_URL =
  'https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/proceso-de-registro-y-habilitacion-como-facturador-electronico/';
const DIAN_PORTAL_URL = 'https://www.dian.gov.co/';

// Asistente guiado (modelo Proveedor Tecnológico): pasos BLOQUEADOS en orden.
// El cliente NO sube certificado (lo pone Pegazo como PT). Solo hace su trámite
// en la DIAN (firma + asociarse a Pegazo + resolución) y nosotros validamos.
function OnboardingWizard({ status, working, onSetup, onResolution, openSupport }) {
  const linked = !!status?.linked;
  const hasRes = (status?.resolutions?.length || 0) > 0;
  const isProd = status?.env === 'PRODUCCION';

  // Pasos que el cliente ATESTIGUA (no verificables por API): se recuerdan por
  // navegador para no repetir, sin bloquear la verdad (lo real lo valida la DIAN).
  const key = `pegazo-fe-onb-${status?.nit || 'co'}`;
  const [ack, setAck] = useState({ ife: false, assoc: false });
  const [mode, setMode] = useState(''); // '' | 'nuevo' | 'migra'
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(key) || '{}');
      setAck({ ife: !!r.ife, assoc: !!r.assoc });
      if (r.mode) setMode(r.mode);
    } catch {
      /* noop */
    }
  }, [key]);
  const persist = (patch) => {
    try {
      const cur = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({ ...cur, ...patch }));
    } catch {
      /* noop */
    }
  };
  const mark = (k) =>
    setAck((p) => {
      persist({ [k]: true });
      return { ...p, [k]: true };
    });
  const chooseMode = (m) => {
    setMode(m);
    persist({ mode: m });
  };

  // ¿El cliente ya facturaba electrónicamente con otro proveedor (Alegra, Siigo,
  // Treinta…)? Entonces YA tiene firma electrónica y resolución: solo cambia el
  // proveedor a Pegazo. Simplifica el paso a paso.
  const migra = mode === 'migra';

  const d1 = linked;
  const d2 = d1 && ack.ife;
  const d3 = d2 && ack.assoc;
  const d4 = d3 && hasRes;
  const d5 = d4 && isProd;
  const done = [d1, d2, d3, d4, d5];
  const current = done.findIndex((x) => !x); // índice del paso activo

  const steps = [
    {
      title: 'Activa el servicio',
      desc: 'Enlazamos tu empresa con el sistema fiscal de Pegazo. Un solo clic.',
      body: (
        <Button variant="primary" size="sm" loading={working} onClick={onSetup}>
          Activar
        </Button>
      ),
    },
    {
      title: 'Verifica tu habilitación (firma) en la DIAN',
      desc: 'Entra a dian.gov.co → “Factura Electrónica” → “Habilitación” e inicia sesión con tu documento (opción Persona o Empresa).',
      body: (
        <div className="space-y-2">
          <div className="space-y-1 rounded-xl bg-gray-50 p-3 text-xs text-gray-600 ring-1 ring-gray-200">
            <p className="font-semibold text-gray-700">
              ¿Cómo saber si ya estás listo?
            </p>
            <p>
              1. Menú <b>“Registro y habilitación” → “Documentos electrónicos”</b>.
            </p>
            <p>
              2. Elige <b>“Factura electrónica”</b>.
            </p>
            <p>
              3. En la pantalla <b>“Facturador electrónico”</b> mira el campo{' '}
              <b>“Estado de aprobación”</b>:
            </p>
            <p className="pl-3">
              • Si dice <b className="text-emerald-700">“Habilitado”</b> → ✅ ya
              tienes todo (firma incluida). Continúa.
            </p>
            <p className="pl-3">
              • Si no → genera tu <b>Firma Electrónica</b> (en dian.gov.co →
              “Temas de interés” → “Firma Electrónica” → “Generar”) y vuelve.
              ¿Te enredas? Escríbenos por el chat.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={DIAN_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Abrir portal DIAN
            </a>
            <Button variant="primary" size="sm" onClick={() => mark('ife')}>
              Ya estoy habilitado — continuar
            </Button>
          </div>
        </div>
      ),
    },
    {
      title: 'Asocia a Pegazo como tu proveedor',
      desc: migra
        ? 'En la misma pantalla “Facturador electrónico”, botón verde “Configurar modos de operación”. Quita tu proveedor anterior y asocia a Pegazo con estos datos; tu numeración actual sigue sirviendo.'
        : 'En la pantalla “Facturador electrónico”, botón verde “Configurar modos de operación” → elige “Proveedor tecnológico” → asocia Pegazo con estos datos.',
      body: (
        <div className="space-y-2">
          {status?.pt?.nit || status?.pt?.softwareId ? (
            <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Datos de Pegazo (Proveedor Tecnológico)
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-gray-700">
                {status.pt.legalName && (
                  <p>
                    Razón social: <b>{status.pt.legalName}</b>
                  </p>
                )}
                {status.pt.nit && (
                  <p>
                    NIT: <b>{status.pt.nit}</b>
                  </p>
                )}
                {status.pt.softwareId && (
                  <p>
                    ID de software: <b>{status.pt.softwareId}</b>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-orange-50 px-3 py-2 text-[11px] text-orange-700 ring-1 ring-orange-200">
              ¿No ves los datos de Pegazo (NIT y software) para asociar?
              Escríbenos por el chat y te los pasamos al instante.
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <a
              href={DIAN_HABILITACION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Guía / portal de habilitación
            </a>
            <Button variant="primary" size="sm" onClick={() => mark('assoc')}>
              Ya me asocié a Pegazo
            </Button>
          </div>
        </div>
      ),
    },
    {
      title: 'Registra tu resolución de numeración',
      desc: migra
        ? 'Usa la MISMA resolución que ya tenías (no pidas una nueva); regístrala aquí.'
        : 'Es gratis. La DIAN te da un prefijo y un rango autorizado; regístralo aquí.',
      body: (
        <Button variant="primary" size="sm" onClick={onResolution}>
          Registrar resolución
        </Button>
      ),
    },
    {
      title: 'Validación con la DIAN',
      desc: 'Nosotros enviamos el set de pruebas y validamos tu habilitación. Cuando quede lista, te activamos la facturación en producción.',
      body: (
        <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
          <BoltIcon className="h-4 w-4 flex-none" />
          Estamos validando… te avisamos cuando puedas facturar.
        </div>
      ),
    },
  ];

  return (
    <div className="mt-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <h3 className="text-base font-bold text-gray-800">
        Conecta tu facturación electrónica
      </h3>
      <p className="mt-0.5 text-sm text-gray-500">
        Sigue estos pasos — se desbloquea el siguiente al terminar el anterior.
        Nosotros hacemos lo técnico (firma y envío); tú no necesitas certificado.
      </p>

      {/* Pregunta inicial: adapta el paso a paso según si es la primera vez o
          si ya facturaba con otro proveedor (Alegra/Siigo/Treinta). */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <p className="mb-2 text-xs font-semibold text-gray-700">
          Para guiarte mejor: ¿ya facturabas electrónicamente antes?
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => chooseMode('nuevo')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'nuevo'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            Es mi primera vez
          </button>
          <button
            type="button"
            onClick={() => chooseMode('migra')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'migra'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            Ya lo hacía con otro proveedor (Alegra, Siigo, Treinta…)
          </button>
        </div>
        {mode === 'migra' && (
          <p className="mt-2 text-[11px] text-emerald-700">
            ✓ Entonces ya tienes firma electrónica y resolución. Solo tienes que
            cambiar tu proveedor a Pegazo — te guiamos abajo.
          </p>
        )}
      </div>

      <ol className="mt-5">
        {steps.map((s, i) => {
          const isDone = done[i];
          const isCurrent = i === current;
          const isLast = i === steps.length - 1;
          return (
            <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
              {!isLast && (
                <span
                  className={`absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px ${
                    isDone ? 'bg-emerald-300' : 'bg-gray-200'
                  }`}
                />
              )}
              <span
                className={`z-10 grid h-8 w-8 flex-none place-items-center rounded-full text-sm font-bold ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                      ? 'bg-orange-500 text-white ring-4 ring-orange-100'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </span>
              <div className={`flex-1 ${isCurrent ? '' : 'opacity-70'}`}>
                <p
                  className={`text-sm font-semibold ${
                    isDone ? 'text-emerald-700' : 'text-gray-800'
                  }`}
                >
                  {s.title}
                  {isDone && (
                    <span className="ml-2 text-[11px] font-medium text-emerald-600">
                      listo
                    </span>
                  )}
                </p>
                {!isDone && <p className="mt-0.5 text-xs text-gray-500">{s.desc}</p>}
                {isCurrent && <div className="mt-2.5">{s.body}</div>}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400">
          ¿Te trabas en algún paso? Te ayudamos a configurarlo.
        </p>
        <button
          type="button"
          onClick={openSupport}
          className="inline-flex flex-none items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-700"
        >
          Escríbenos por el chat
        </button>
      </div>
    </div>
  );
}

// Lee un archivo como base64 (sin el prefijo data:...;base64,).
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || '');
      resolve(res.includes(',') ? res.split(',')[1] : res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function CertModal({ onClose, onSaved, onError }) {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!file) return onError('Selecciona el archivo .p12.');
    if (!password) return onError('Escribe la clave del certificado.');
    setSaving(true);
    try {
      const p12Base64 = await fileToBase64(file);
      await uploadFiscalCertificate({
        p12Base64,
        password,
        expiresAt: expiresAt || undefined,
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
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Certificado digital (.p12)
            </h3>
            <p className="text-xs text-gray-500">
              Se guarda cifrado; nunca se expone ni se descarga.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3 p-5">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Archivo .p12 / .pfx
            </span>
            <input
              type="file"
              accept=".p12,.pfx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-orange-50 file:px-3 file:py-1 file:text-orange-600"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Clave del certificado
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Vence el (opcional)
            </span>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <Button variant="clear" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" loading={saving} onClick={submit}>
            Guardar certificado
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConfigModal({ status, onClose, onSaved, onError }) {
  const [form, setForm] = useState({
    softwareId: status?.softwareId || '',
    softwarePin: '',
    testSetId: '',
    env: status?.env || 'HABILITACION',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setSaving(true);
    try {
      await updateFiscalConfig({
        softwareId: form.softwareId || undefined,
        softwarePin: form.softwarePin || undefined,
        testSetId: form.testSetId || undefined,
        env: form.env,
        habilitacion: form.env === 'PRODUCCION' ? 'HABILITADO' : undefined,
      });
      onSaved();
    } catch (e) {
      onError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const field =
    'rounded-lg border border-gray-200 px-3 py-2 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Datos de la DIAN
            </h3>
            <p className="text-xs text-gray-500">
              Los entrega el portal DIAN al registrar tu software.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3 p-5">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              ID de software
            </span>
            <input
              value={form.softwareId}
              onChange={(e) => set('softwareId', e.target.value)}
              className={field}
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              PIN del software
            </span>
            <input
              value={form.softwarePin}
              onChange={(e) => set('softwarePin', e.target.value)}
              placeholder="(se guarda cifrado)"
              className={field}
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              TestSetId (set de pruebas)
            </span>
            <input
              value={form.testSetId}
              onChange={(e) => set('testSetId', e.target.value)}
              placeholder="(solo en habilitación)"
              className={field}
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Ambiente
            </span>
            <select
              value={form.env}
              onChange={(e) => set('env', e.target.value)}
              className={field}
            >
              <option value="HABILITACION">Pruebas (habilitación)</option>
              <option value="PRODUCCION">Producción (facturas reales)</option>
            </select>
          </label>
          {form.env === 'PRODUCCION' && (
            <p className="rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-700 ring-1 ring-amber-200">
              En producción las facturas son reales y se reportan a la DIAN.
              Actívalo solo cuando la DIAN ya te haya habilitado.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <Button variant="clear" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" loading={saving} onClick={submit}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
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
