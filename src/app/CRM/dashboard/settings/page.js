'use client';

import { useCallback, useEffect, useState } from 'react';
import RoleGuard from '@/auth/roleGuard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import AlertModal from '@/components/dashboard/modals/alertModal';
import {
  getCompanyConfig,
  updateCompanyConfig,
} from '@/lib/api/routes/companies';
import { calcularDV } from '@/lib/api/utils/utils';

const TEXT_FIELDS = [
  { name: 'businessName', label: 'Razón social' },
  { name: 'taxRegime', label: 'Régimen tributario' },
  { name: 'ciiu', label: 'Actividad económica (CIIU)' },
  { name: 'fiscalAddress', label: 'Dirección fiscal' },
  { name: 'fiscalCity', label: 'Ciudad fiscal' },
];

export default function Settings() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({});

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCompanyConfig();
      setForm(res?.data || {});
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error al cargar' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCompanyConfig({
        responsableIVA: !!form.responsableIVA,
        preciosIncluyenIVA: !!form.preciosIncluyenIVA,
        defaultTaxRate: Number(form.defaultTaxRate) || 0,
        personType: form.personType || null,
        businessName: form.businessName || null,
        nit: form.nit || null,
        dv: form.dv || null,
        taxRegime: form.taxRegime || null,
        ciiu: form.ciiu || null,
        fiscalAddress: form.fiscalAddress || null,
        fiscalCity: form.fiscalCity || null,
      });
      setAlert({ type: 'success', message: 'Configuración guardada' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo guardar' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'SUPER_PLATFORM_ADMIN']}>
      <div className="relative w-full p-4">
        <LoadingOverlay show={loading} text="Cargando configuración..." />

        <h1 className="mb-1 text-2xl font-semibold">Configuración</h1>
        <p className="mb-6 text-sm text-gray-500">
          Configura la información fiscal de tu empresa. El CRM se adapta a esto
          para calcular el IVA y emitir facturas.
        </p>

        <form onSubmit={handleSave} className="max-w-3xl space-y-6">
          {/* Impuestos */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-800">
              Impuestos (IVA)
            </h2>

            <label className="mb-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={!!form.responsableIVA}
                onChange={(e) => set('responsableIVA', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">
                Mi empresa es <b>responsable de IVA</b> (cobra IVA)
              </span>
            </label>

            <label className="mb-4 flex items-center gap-3">
              <input
                type="checkbox"
                checked={!!form.preciosIncluyenIVA}
                onChange={(e) => set('preciosIncluyenIVA', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">
                Los precios <b>ya incluyen IVA</b> (si no, el IVA se suma al
                total)
              </span>
            </label>

            <div className="max-w-xs">
              <label className="mb-1 block text-xs font-medium text-gray-500">
                IVA por defecto para productos nuevos (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.defaultTaxRate ?? 0}
                onChange={(e) => set('defaultTaxRate', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Datos fiscales */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-800">
              Datos fiscales (emisor)
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Tipo de persona
                </label>
                <select
                  value={form.personType || ''}
                  onChange={(e) => set('personType', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                >
                  <option value="">Seleccione...</option>
                  <option value="NATURAL">Persona natural</option>
                  <option value="JURIDICA">Persona jurídica</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  NIT
                </label>
                <input
                  type="text"
                  value={form.nit || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    // El DV se calcula solo a partir del NIT (algoritmo DIAN).
                    setForm((prev) => ({ ...prev, nit: v, dv: calcularDV(v) }));
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Dígito de verificación (DV)
                </label>
                <input
                  type="text"
                  value={form.dv || ''}
                  onChange={(e) => set('dv', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="Se calcula automáticamente"
                />
              </div>

              {TEXT_FIELDS.map((f) => (
                <div key={f.name}>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={form[f.name] || ''}
                    onChange={(e) => set(f.name, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </form>

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({})}
        />
      </div>
    </RoleGuard>
  );
}
