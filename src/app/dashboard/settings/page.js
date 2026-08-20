'use client';

import { useEffect, useState } from 'react';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import { GiftIcon, BuildingStorefrontIcon, ClockIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LogoUploader from '@/components/ui/LogoUploader';
import { useAuth } from '@/context/authContext';
import { isServicesBusiness } from '@/lib/appointmentsAccess';
import {
  getCompanySettings,
  updateLoyalty,
  updateCompanyProfile,
  updateCompanyHours,
} from '@/lib/api/routes/company';

function CompanyProfileCard({ initial }) {
  const [form, setForm] = useState({
    name: '',
    logo: '',
    phone: '',
    email: '',
    nit: '',
  });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        logo: initial.logo || '',
        phone: initial.phone || '',
        email: initial.email || '',
        nit: initial.nit || '',
      });
    }
  }, [initial]);

  const save = async () => {
    setSaving(true);
    try {
      await updateCompanyProfile(form);
      setAlert({ type: 'success', message: 'Datos de la empresa actualizados.' });
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <BuildingStorefrontIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800">Datos de la empresa</h2>
          <p className="text-sm text-gray-500">
            Nombre, logo y contacto (aparecen en facturas y en el panel).
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <LogoUploader
          value={form.logo}
          onChange={(url) => setForm((f) => ({ ...f, logo: url }))}
          label="Logo del negocio"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nombre del negocio
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Correo
            </label>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              NIT / documento fiscal
            </label>
            <input
              value={form.nit}
              onChange={(e) => setForm((f) => ({ ...f, nit: e.target.value }))}
              placeholder="Aparece en las facturas"
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Button variant="primary" onClick={save} loading={saving}>
          Guardar
        </Button>
      </div>
      <AlertModal type={alert.type} message={alert.message} onClose={() => setAlert({})} />
    </div>
  );
}

function HoursCard({ initial }) {
  const [openH, setOpenH] = useState(9);
  const [closeH, setCloseH] = useState(20);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({});

  useEffect(() => {
    if (initial) {
      setOpenH(initial.openHour ?? 9);
      setCloseH(initial.closeHour ?? 20);
    }
  }, [initial]);

  const save = async () => {
    setSaving(true);
    try {
      await updateCompanyHours({ openHour: Number(openH), closeHour: Number(closeH) });
      setAlert({ type: 'success', message: 'Horario actualizado.' });
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="max-w-xl rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <ClockIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800">Horario de atención</h2>
          <p className="text-sm text-gray-500">
            Define el rango de horas disponible para agendar citas.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Abre</label>
          <select
            value={openH}
            onChange={(e) => setOpenH(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
          >
            {hours.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Cierra</label>
          <select
            value={closeH}
            onChange={(e) => setCloseH(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
          >
            {hours.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <Button variant="primary" onClick={save} loading={saving}>
          Guardar
        </Button>
      </div>
      <AlertModal type={alert.type} message={alert.message} onClose={() => setAlert({})} />
    </div>
  );
}

function LoyaltySettings() {
  const [form, setForm] = useState({
    loyaltyEnabled: false,
    loyaltyStampsRequired: 10,
    loyaltyReward: '1 servicio gratis',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await getCompanySettings();
        const d = res?.data;
        if (d) {
          setForm({
            loyaltyEnabled: !!d.loyaltyEnabled,
            loyaltyStampsRequired: d.loyaltyStampsRequired ?? 10,
            loyaltyReward: d.loyaltyReward ?? '1 servicio gratis',
          });
        }
      } catch {
        /* ignora */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await updateLoyalty({
        loyaltyEnabled: form.loyaltyEnabled,
        loyaltyStampsRequired: Number(form.loyaltyStampsRequired) || 10,
        loyaltyReward: form.loyaltyReward,
      });
      setAlert({ type: 'success', message: 'Fidelización actualizada.' });
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-gray-400">Cargando configuración…</p>
    );
  }

  return (
    <div className="max-w-xl rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <GiftIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800">
            Fidelización (tarjeta de sellos)
          </h2>
          <p className="text-sm text-gray-500">
            Premia a tus clientes: cada visita suma un sello y al completarlos
            ganan un premio.
          </p>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <span className="text-sm font-medium text-gray-700">
          Activar fidelización
        </span>
        <input
          type="checkbox"
          checked={form.loyaltyEnabled}
          onChange={(e) =>
            setForm((f) => ({ ...f, loyaltyEnabled: e.target.checked }))
          }
          className="h-5 w-5 accent-orange-500"
        />
      </label>

      <div
        className={`mt-4 grid gap-4 transition ${
          form.loyaltyEnabled ? 'opacity-100' : 'pointer-events-none opacity-50'
        }`}
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Sellos para ganar el premio
          </label>
          <input
            type="number"
            min={1}
            value={form.loyaltyStampsRequired}
            onChange={(e) =>
              setForm((f) => ({ ...f, loyaltyStampsRequired: e.target.value }))
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Premio
          </label>
          <input
            type="text"
            value={form.loyaltyReward}
            onChange={(e) =>
              setForm((f) => ({ ...f, loyaltyReward: e.target.value }))
            }
            placeholder="Ej. 1 corte gratis"
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <p className="rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-700">
          Con esta configuración, tras{' '}
          <b>{form.loyaltyStampsRequired || 10} visitas</b> el cliente gana:{' '}
          <b>{form.loyaltyReward || '1 servicio gratis'}</b>.
        </p>
      </div>

      <div className="mt-5">
        <Button variant="primary" onClick={save} loading={saving}>
          Guardar
        </Button>
      </div>

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({})}
      />
    </div>
  );
}

export default function Settings() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const [settings, setSettings] = useState(null);
  const isServices = isServicesBusiness(usuario);

  useEffect(() => {
    getCompanySettings()
      .then((r) => setSettings(r?.data || null))
      .catch(() => setSettings(null));
  }, []);

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-xl font-semibold text-gray-800 md:text-2xl">
            Configuraciones
          </h1>
        </div>

        <div className="flex flex-col gap-5">
          <CompanyProfileCard initial={settings} />
          {isServices && <HoursCard initial={settings} />}
          <LoyaltySettings />
        </div>
      </div>
    </RoleGuard>
  );
}
