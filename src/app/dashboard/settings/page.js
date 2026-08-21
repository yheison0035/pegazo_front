'use client';

import { useEffect, useState } from 'react';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import {
  GiftIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  SwatchIcon,
  CheckIcon,
  LockClosedIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';
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
  updateCrmTheme,
  updateCashPolicy,
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

const THEMES = [
  {
    id: 'orange',
    name: 'Naranja',
    desc: 'El tema clásico de Pegazo.',
    colors: ['#fe6e00', '#fb923c', '#fbbf24'],
  },
  {
    id: 'blue',
    name: 'Azul',
    desc: 'Sobrio y corporativo.',
    colors: ['#3b82f6', '#60a5fa', '#38bdf8'],
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    desc: 'Fresco y natural.',
    colors: ['#10b981', '#34d399', '#2dd4bf'],
  },
];

function ThemeSettings() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const setUsuario = auth?.setUsuario;
  const [current, setCurrent] = useState(usuario?.company?.crmTheme || 'orange');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({});

  // Actualiza la sesión (empresa) para que el panel cambie al instante; el
  // contenedor del dashboard lee company.crmTheme y aplica el tema en su
  // subárbol (no toca el <html>, así el login no se ve afectado).
  const setSessionTheme = (themeId) => {
    if (setUsuario && usuario) {
      const merged = {
        ...usuario,
        company: { ...usuario.company, crmTheme: themeId },
      };
      setUsuario(merged);
      localStorage.setItem('usuario', JSON.stringify(merged));
    }
  };

  const apply = async (themeId) => {
    const prev = current;
    setCurrent(themeId);
    setSessionTheme(themeId); // aplica en vivo (optimista)
    setSaving(true);
    try {
      await updateCrmTheme(themeId);
      setAlert({ type: 'success', message: 'Tema actualizado.' });
    } catch (e) {
      // revierte si falla
      setCurrent(prev);
      setSessionTheme(prev);
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <SwatchIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800">Tema de diseño</h2>
          <p className="text-sm text-gray-500">
            Elige los colores de tu panel. El cambio se aplica al instante para
            toda tu empresa.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {THEMES.map((t) => {
          const active = current === t.id;
          return (
            <button
              key={t.id}
              onClick={() => apply(t.id)}
              disabled={saving}
              className={`relative rounded-xl border p-3 text-left transition ${
                active
                  ? 'border-orange-400 ring-2 ring-orange-500/30'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {active && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
              )}
              <div className="flex gap-1.5">
                {t.colors.map((c) => (
                  <span
                    key={c}
                    className="h-8 w-8 rounded-lg"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm font-semibold text-gray-800">{t.name}</p>
              <p className="text-xs text-gray-500">{t.desc}</p>
            </button>
          );
        })}
      </div>

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({})}
      />
    </div>
  );
}

function CashPolicyCard({ initial }) {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const setUsuario = auth?.setUsuario;
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({});

  useEffect(() => {
    if (initial) setEnabled(!!initial.requireCashOpen);
  }, [initial]);

  const toggle = async (val) => {
    const prev = enabled;
    setEnabled(val);
    setSaving(true);
    try {
      await updateCashPolicy(val);
      // Refleja el cambio en la sesión para que el POS/aviso reaccionen.
      if (setUsuario && usuario) {
        const merged = {
          ...usuario,
          company: { ...usuario.company, requireCashOpen: val },
        };
        setUsuario(merged);
        localStorage.setItem('usuario', JSON.stringify(merged));
      }
      setAlert({ type: 'success', message: 'Preferencia guardada.' });
    } catch (e) {
      setEnabled(prev);
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <CalculatorIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800">
            Abrir el día para vender
          </h2>
          <p className="text-sm text-gray-500">
            Si lo activas, no se podrá facturar sin haber <b>abierto la caja del
            día</b> en la sede. Además, obliga a <b>cerrar el día anterior</b>{' '}
            antes de vender. Ideal para llevar el control diario del efectivo y
            que el arqueo siempre cuadre.
          </p>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <span className="text-sm font-medium text-gray-700">
          Exigir apertura de caja para vender
        </span>
        <input
          type="checkbox"
          checked={enabled}
          disabled={saving}
          onChange={(e) => toggle(e.target.checked)}
          className="h-5 w-5 accent-orange-500"
        />
      </label>

      <p className="mt-2 text-xs text-gray-400">
        {enabled
          ? 'Activado: el cajero debe “Abrir el día” en Caja antes de poder facturar.'
          : 'Desactivado: se puede vender en cualquier momento, sin abrir caja.'}
      </p>

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({})}
      />
    </div>
  );
}

function LoyaltySettings() {
  const [form, setForm] = useState({
    loyaltyEnabled: false,
    loyaltyTier1Visits: 4,
    loyaltyTier1Percent: 50,
    loyaltyTier2Visits: 8,
    loyaltyTier2Percent: 100,
    loyaltyMaxDays: 25,
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
            loyaltyTier1Visits: d.loyaltyTier1Visits ?? 4,
            loyaltyTier1Percent: d.loyaltyTier1Percent ?? 50,
            loyaltyTier2Visits: d.loyaltyTier2Visits ?? 8,
            loyaltyTier2Percent: d.loyaltyTier2Percent ?? 100,
            loyaltyMaxDays: d.loyaltyMaxDays ?? 25,
          });
        }
      } catch {
        /* ignora */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await updateLoyalty({
        loyaltyEnabled: form.loyaltyEnabled,
        loyaltyTier1Visits: Number(form.loyaltyTier1Visits) || 4,
        loyaltyTier1Percent: Number(form.loyaltyTier1Percent) || 0,
        loyaltyTier2Visits: Number(form.loyaltyTier2Visits) || 8,
        loyaltyTier2Percent: Number(form.loyaltyTier2Percent) || 0,
        loyaltyMaxDays: Number(form.loyaltyMaxDays) || 25,
      });
      setAlert({ type: 'success', message: 'Fidelización actualizada.' });
    } catch (e) {
      setAlert({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-400">Cargando configuración…</p>;
  }

  const numCls =
    'w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

  return (
    <div className="max-w-xl rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <GiftIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800">Fidelización</h2>
          <p className="text-sm text-gray-500">
            Premia a tus clientes frecuentes con descuentos en dos escalones de
            visitas.
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
        className={`mt-4 space-y-4 transition ${
          form.loyaltyEnabled ? 'opacity-100' : 'pointer-events-none opacity-50'
        }`}
      >
        {/* Escalón 1 */}
        <div className="rounded-xl border border-gray-100 p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
            Primer escalón
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                En la visita #
              </label>
              <input type="number" min={1} value={form.loyaltyTier1Visits} onChange={set('loyaltyTier1Visits')} className={numCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Descuento (%)
              </label>
              <input type="number" min={0} max={100} value={form.loyaltyTier1Percent} onChange={set('loyaltyTier1Percent')} className={numCls} />
            </div>
          </div>
        </div>

        {/* Escalón 2 */}
        <div className="rounded-xl border border-gray-100 p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
            Segundo escalón (reinicia el ciclo)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                En la visita #
              </label>
              <input type="number" min={1} value={form.loyaltyTier2Visits} onChange={set('loyaltyTier2Visits')} className={numCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Descuento (%)
              </label>
              <input type="number" min={0} max={100} value={form.loyaltyTier2Percent} onChange={set('loyaltyTier2Percent')} className={numCls} />
            </div>
          </div>
        </div>

        {/* Ventana de días */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Máximo de días entre visitas
          </label>
          <input type="number" min={1} value={form.loyaltyMaxDays} onChange={set('loyaltyMaxDays')} className={numCls} />
          <p className="mt-1 text-xs text-gray-400">
            Si el cliente se demora más de estos días en volver, la racha se
            reinicia y empieza de cero.
          </p>
        </div>

        <p className="rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-700">
          En la visita <b>#{form.loyaltyTier1Visits}</b> el cliente recibe{' '}
          <b>{form.loyaltyTier1Percent}%</b> de descuento; en la visita{' '}
          <b>#{form.loyaltyTier2Visits}</b>, <b>{form.loyaltyTier2Percent}%</b>{' '}
          (y el ciclo vuelve a empezar). Debe volver dentro de{' '}
          <b>{form.loyaltyMaxDays} días</b> para no perder la racha.
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
  // La configuración del CRM solo la maneja el dueño o el administrador.
  const canConfig = ['SUPER_ADMIN', 'ADMIN'].includes(usuario?.role);

  useEffect(() => {
    if (!canConfig) return;
    getCompanySettings()
      .then((r) => setSettings(r?.data || null))
      .catch(() => setSettings(null));
  }, [canConfig]);

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-xl font-semibold text-gray-800 md:text-2xl">
            Configuraciones
          </h1>
        </div>

        {!canConfig ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <LockClosedIcon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">
              No tienes acceso a la configuración
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              La configuración del negocio solo la puede modificar el dueño o el
              administrador. Si necesitas un cambio, <b>solicítalo al
              administrador</b>.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <ThemeSettings />
            <CompanyProfileCard initial={settings} />
            <CashPolicyCard initial={settings} />
            {isServices && <HoursCard initial={settings} />}
            {isServices && <LoyaltySettings />}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
