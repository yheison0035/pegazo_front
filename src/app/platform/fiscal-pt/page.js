'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheckIcon,
  CheckBadgeIcon,
  DocumentArrowUpIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import AlertModal from '@/components/dashboard/modals/alertModal';
import {
  getPtConfig,
  savePtConfig,
  uploadPtCertificate,
} from '@/lib/api/routes/fiscalConsumers';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const res = String(r.result || '');
      resolve(res.includes(',') ? res.split(',')[1] : res);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const input =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';
const label = 'mb-1 block text-xs font-semibold text-gray-600';

function FiscalPt() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState(null);
  const [alert, setAlert] = useState({});
  const [form, setForm] = useState({
    legalName: '',
    nit: '',
    dv: '',
    softwareId: '',
    softwarePin: '',
    testSetId: '',
    env: 'HABILITACION',
  });

  // Certificado
  const [certFile, setCertFile] = useState(null);
  const [certPass, setCertPass] = useState('');
  const [certExp, setCertExp] = useState('');
  const [uploadingCert, setUploadingCert] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getPtConfig();
      const d = res?.data || {};
      setCfg(d);
      setForm({
        legalName: d.legalName || '',
        nit: d.nit || '',
        dv: d.dv || '',
        softwareId: d.softwareId || '',
        softwarePin: '',
        testSetId: d.testSetId || '',
        env: d.env || 'HABILITACION',
      });
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      // El PIN solo se envía si lo escribieron (vacío = no cambiar).
      const dto = { ...form };
      if (!dto.softwarePin) delete dto.softwarePin;
      await savePtConfig(dto);
      setAlert({ type: 'success', message: 'Configuración del PT guardada.' });
      await load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const submitCert = async () => {
    if (!certFile) return setAlert({ type: 'warning', message: 'Selecciona el .p12.' });
    if (!certPass) return setAlert({ type: 'warning', message: 'Escribe la clave del certificado.' });
    setUploadingCert(true);
    try {
      const p12Base64 = await fileToBase64(certFile);
      await uploadPtCertificate({
        p12Base64,
        password: certPass,
        expiresAt: certExp || undefined,
      });
      setAlert({ type: 'success', message: 'Certificado del PT cargado y cifrado.' });
      setCertFile(null);
      setCertPass('');
      setCertExp('');
      await load();
    } catch (e) {
      setAlert({ type: 'error', message: e.message });
    } finally {
      setUploadingCert(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-[60vh] w-full">
        <LoadingOverlay show text="Cargando configuración del PT..." />
      </div>
    );
  }

  const isProd = cfg?.env === 'PRODUCCION';

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      {/* Encabezado */}
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow">
          <ShieldCheckIcon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Proveedor Tecnológico (Pegazo)
          </h1>
          <p className="text-sm text-gray-500">
            Con esta configuración Pegazo firma por TODOS los clientes. Ninguno
            necesita certificado propio.
          </p>
        </div>
      </div>

      {/* Estado */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StateChip icon={BoltIcon} label="Ambiente" ok={isProd}>
          <span className={isProd ? 'text-emerald-600' : 'text-amber-600'}>
            {isProd ? 'Producción' : 'Pruebas'}
          </span>
        </StateChip>
        <StateChip icon={CheckBadgeIcon} label="Certificado" ok={cfg?.hasCertificate}>
          {cfg?.hasCertificate ? 'Cargado' : 'Falta'}
        </StateChip>
        <StateChip icon={DocumentArrowUpIcon} label="Software ID" ok={!!cfg?.softwareId}>
          {cfg?.softwareId ? 'OK' : 'Falta'}
        </StateChip>
        <StateChip icon={ShieldCheckIcon} label="PIN software" ok={cfg?.hasSoftwarePin}>
          {cfg?.hasSoftwarePin ? 'OK' : 'Falta'}
        </StateChip>
      </div>

      {/* Datos del PT */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-gray-800">Datos del PT</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Razón social del PT</label>
            <input value={form.legalName} onChange={set('legalName')} className={input} />
          </div>
          <div>
            <label className={label}>NIT</label>
            <input value={form.nit} onChange={set('nit')} className={input} />
          </div>
          <div>
            <label className={label}>DV</label>
            <input value={form.dv} onChange={set('dv')} className={input} />
          </div>
          <div>
            <label className={label}>ID de software (DIAN)</label>
            <input value={form.softwareId} onChange={set('softwareId')} className={input} />
          </div>
          <div>
            <label className={label}>PIN del software</label>
            <input
              value={form.softwarePin}
              onChange={set('softwarePin')}
              placeholder={cfg?.hasSoftwarePin ? '•••• (guardado)' : ''}
              className={input}
            />
          </div>
          <div>
            <label className={label}>TestSetId</label>
            <input value={form.testSetId} onChange={set('testSetId')} className={input} />
          </div>
          <div>
            <label className={label}>Ambiente</label>
            <select value={form.env} onChange={set('env')} className={input}>
              <option value="HABILITACION">Pruebas (habilitación)</option>
              <option value="PRODUCCION">Producción</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" loading={saving} onClick={save}>
            Guardar datos
          </Button>
        </div>
      </div>

      {/* Certificado del PT */}
      <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-bold text-gray-800">
          Certificado digital del PT (.p12)
        </h3>
        <p className="mb-3 text-xs text-gray-500">
          Se guarda cifrado. Con él se firman todos los documentos de los
          clientes.
          {cfg?.certExpiresAt
            ? ` Vence: ${String(cfg.certExpiresAt).slice(0, 10)}.`
            : ''}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={label}>Archivo .p12 / .pfx</label>
            <input
              type="file"
              accept=".p12,.pfx"
              onChange={(e) => setCertFile(e.target.files?.[0] || null)}
              className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-orange-50 file:px-3 file:py-1 file:text-orange-600"
            />
          </div>
          <div>
            <label className={label}>Clave del certificado</label>
            <input
              type="password"
              value={certPass}
              onChange={(e) => setCertPass(e.target.value)}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Vence (opcional)</label>
            <input
              type="date"
              value={certExp}
              onChange={(e) => setCertExp(e.target.value)}
              className={input}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" loading={uploadingCert} onClick={submitCert}>
            {cfg?.hasCertificate ? 'Reemplazar certificado' : 'Subir certificado'}
          </Button>
        </div>
      </div>

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({})}
      />
    </div>
  );
}

function StateChip({ icon: Icon, label: l, ok, children }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
      <span
        className={`grid h-8 w-8 place-items-center rounded-lg ${
          ok ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-gray-400">{l}</p>
        <p className="text-sm font-semibold text-gray-700">{children}</p>
      </div>
    </div>
  );
}

export default function FiscalPtPage() {
  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <FiscalPt />
    </RoleGuard>
  );
}
