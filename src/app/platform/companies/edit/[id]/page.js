'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import { useAuth } from '@/context/authContext';
import useCompanies from '@/lib/api/hooks/useCompanies';
import { getFormFieldsCompanies } from '@/lib/api/utils/companies.config';
import { MODULE_GROUPS, MODULE_KEYS } from '@/config/modules';

// Panel de la plataforma: control MANUAL de módulos + precio por empresa.
function ModulesPricePanel({ company, updateCompany, onSaved }) {
  const [enabled, setEnabled] = useState([]);
  const [manual, setManual] = useState(false);
  const [price, setPrice] = useState({
    monthlyPrice: '',
    discountedPrice: '',
    discountUntil: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({});

  useEffect(() => {
    if (!company) return;
    const em = Array.isArray(company.enabledModules)
      ? company.enabledModules
      : [];
    setEnabled(em);
    setManual(em.length > 0);
    setPrice({
      monthlyPrice: company.monthlyPrice ?? '',
      discountedPrice: company.discountedPrice ?? '',
      discountUntil: company.discountUntil
        ? String(company.discountUntil).slice(0, 10)
        : '',
    });
  }, [company]);

  const toggle = (key) =>
    setEnabled((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  const activarManual = () => {
    setManual(true);
    setEnabled(MODULE_KEYS); // todos marcados; luego destildas los que no
  };
  const volverAutomatico = () => {
    setManual(false);
    setEnabled([]);
  };

  const save = async () => {
    setSaving(true);
    setMsg({});
    try {
      await updateCompany(company.id, {
        enabledModules: manual ? enabled : [],
        monthlyPrice:
          price.monthlyPrice === '' ? null : Number(price.monthlyPrice),
        discountedPrice:
          price.discountedPrice === '' ? null : Number(price.discountedPrice),
        discountUntil: price.discountUntil
          ? new Date(price.discountUntil).toISOString()
          : null,
      });
      setMsg({ type: 'success', text: 'Módulos y precio guardados.' });
      onSaved?.();
    } catch (e) {
      setMsg({ type: 'error', text: e.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const num =
    'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

  return (
    <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800">
        Módulos y precio (plataforma)
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Controla qué módulos ve el cliente en su CRM y el precio acordado. Lo que
        no habilites, no le aparece.
      </p>

      {/* Precio */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Precio mensual
          </label>
          <MoneyInput
            value={price.monthlyPrice}
            onChange={(v) => setPrice((p) => ({ ...p, monthlyPrice: v }))}
            className={num}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Precio con descuento
          </label>
          <MoneyInput
            value={price.discountedPrice}
            onChange={(v) => setPrice((p) => ({ ...p, discountedPrice: v }))}
            className={num}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Descuento hasta
          </label>
          <input
            type="date"
            value={price.discountUntil}
            onChange={(e) =>
              setPrice((p) => ({ ...p, discountUntil: e.target.value }))
            }
            className={num}
          />
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        El descuento es informativo: al vencer, cobras el precio mensual. (El
        cobro es manual por ahora.)
      </p>

      {/* Control de módulos */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
        <div>
          <p className="font-semibold text-gray-800">Módulos habilitados</p>
          <p className="text-xs text-gray-500">
            {manual
              ? 'Control manual: el cliente solo ve los módulos marcados.'
              : 'Automático: ve los módulos según su tipo de negocio y plan.'}
          </p>
        </div>
        {manual ? (
          <Button variant="secondary" onClick={volverAutomatico}>
            Volver a automático
          </Button>
        ) : (
          <Button variant="secondary" onClick={activarManual}>
            Activar control manual
          </Button>
        )}
      </div>

      {manual && (
        <div className="mt-4 space-y-4">
          {Object.entries(MODULE_GROUPS).map(([group, mods]) => (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {group}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {mods.map((m) => (
                  <label
                    key={m.key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={enabled.includes(m.key)}
                      onChange={() => toggle(m.key)}
                      className="h-4 w-4 cursor-pointer accent-orange-500"
                    />
                    <span className="text-gray-700">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400">
            Inicio y Configuración siempre están disponibles para el dueño.
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button variant="primary" onClick={save} loading={saving}>
          Guardar módulos y precio
        </Button>
        {msg.text && (
          <span
            className={`text-sm ${
              msg.type === 'error' ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}

export default function EditCompany() {
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { id } = useParams();
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { getCompanyById, updateCompany, loading } = useCompanies();

  const fetchCompany = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getCompanyById(Number(id));
      setFormData(data);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/platform/companies',
      });
    }
  }, [getCompanyById, id]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCompany(id, formData);
      setAlert({
        type: 'success',
        message: 'Empresa actualizada correctamente.',
        url: '/platform/companies',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear empresa',
      });
    }
  };

  return (
    <div className="mx-auto mt-6 max-w-full rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
      <h2 className="mb-2 text-3xl font-bold text-gray-800">Editar Empresa</h2>
      <p className="mb-6 text-sm text-gray-500">
        Modifica la información de la empresa según sea necesario.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsCompanies()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        loading={loading}
        mode="edit"
        usuario={usuario}
        module="locals"
      />

      {/* Panel de plataforma: módulos + precio */}
      {formData?.id && (
        <ModulesPricePanel
          company={formData}
          updateCompany={updateCompany}
          onSaved={fetchCompany}
        />
      )}

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '', url: '' })}
        url={alert.url}
      />
    </div>
  );
}
