'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useToast } from '@/context/toastContext';
import { TOGGLEABLE_MODULES } from '@/config/modules';
import {
  getPlatformPlans,
  updatePlatformPlan,
  setPlatformPlanGates,
} from '@/lib/api/routes/platformPlans';

// Etiquetas legibles para claves de gate que no están en TOGGLEABLE_MODULES.
const EXTRA_LABELS = {
  'facturacion-electronica': 'Facturación electrónica DIAN',
  fiado: 'Fiado / crédito',
  payroll: 'Nómina electrónica',
  loyalty: 'Fidelización',
  clinical: 'Historia clínica',
  bank: 'Consignaciones (banco)',
  website: 'Tienda online',
  shipping: 'Envíos',
  statistics: 'Estadísticas',
  appointments: 'Citas',
  services: 'Servicios',
  expenses: 'Gastos',
  users: 'Usuarios / roles',
};

export default function PlatformPlansPage() {
  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <PlatformPlans />
    </RoleGuard>
  );
}

function PlatformPlans() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState([]);
  const [gates, setGates] = useState({});
  const [dirtyGates, setDirtyGates] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPlatformPlans();
      const data = res?.data || res || {};
      setPlans((data.plans || []).sort((a, b) => a.order - b.order));
      setGates(data.gates || {});
      setDirtyGates(false);
    } catch (e) {
      toast.show({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Opciones del select "disponible desde": Base + los planes por orden.
  const planOptions = useMemo(
    () => [
      { id: 'BASE', label: 'Base (todos)' },
      ...plans.map((p) => ({ id: p.id, label: p.name })),
    ],
    [plans],
  );

  // Lista de módulos a mostrar: registro + cualquier gate que no esté en él.
  const moduleRows = useMemo(() => {
    const seen = new Set();
    const rows = TOGGLEABLE_MODULES.map((m) => {
      seen.add(m.key);
      return { key: m.key, label: m.label, group: m.group };
    });
    Object.keys(gates).forEach((k) => {
      if (!seen.has(k)) {
        rows.push({ key: k, label: EXTRA_LABELS[k] || k, group: 'Otros' });
      }
    });
    return rows;
  }, [gates]);

  const grouped = useMemo(() => {
    const g = {};
    moduleRows.forEach((m) => {
      (g[m.group] = g[m.group] || []).push(m);
    });
    return g;
  }, [moduleRows]);

  const setGate = (key, minPlan) => {
    setGates((prev) => ({ ...prev, [key]: minPlan }));
    setDirtyGates(true);
  };

  const saveGates = async () => {
    setSaving(true);
    try {
      await setPlatformPlanGates(gates);
      toast.show({ type: 'success', message: 'Módulos por plan guardados.' });
      setDirtyGates(false);
    } catch (e) {
      toast.show({ type: 'error', message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const savePlan = async (plan) => {
    try {
      await updatePlatformPlan(plan.id, {
        name: plan.name,
        emoji: plan.emoji,
        tagline: plan.tagline,
        priceMonthly: plan.priceMonthly,
        maxUsers: plan.maxUsers,
        maxLocals: plan.maxLocals,
        maxProducts: plan.maxProducts,
        maxCustomers: plan.maxCustomers,
      });
      toast.show({ type: 'success', message: `Plan ${plan.name} guardado.` });
    } catch (e) {
      toast.show({ type: 'error', message: e.message });
    }
  };

  const setPlanField = (id, field, value) =>
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );

  if (loading) {
    return (
      <div className="relative min-h-[60vh] w-full">
        <LoadingOverlay show text="Cargando planes..." />
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Planes y funciones
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Define los precios y límites de cada plan, y qué módulo se desbloquea
            en cuál. Los cambios se aplican al instante en todo el CRM.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={ArrowPathIcon}
          onClick={load}
        >
          Recargar
        </Button>
      </div>

      {/* PLANES */}
      <div className="grid gap-4 lg:grid-cols-4">
        {plans.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <input
                value={p.emoji || ''}
                onChange={(e) => setPlanField(p.id, 'emoji', e.target.value)}
                className="w-10 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-lg"
                maxLength={2}
              />
              <input
                value={p.name}
                onChange={(e) => setPlanField(p.id, 'name', e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-semibold focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <p className="mt-1 font-mono text-[10px] text-gray-400">{p.id}</p>

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Precio mensual (COP)
            </label>
            <input
              type="number"
              value={p.priceMonthly ?? 0}
              onChange={(e) =>
                setPlanField(p.id, 'priceMonthly', Number(e.target.value))
              }
              className="mt-0.5 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />

            <div className="mt-3 grid grid-cols-2 gap-2">
              <LimitInput
                label="Usuarios"
                value={p.maxUsers}
                onChange={(v) => setPlanField(p.id, 'maxUsers', v)}
              />
              <LimitInput
                label="Sedes"
                value={p.maxLocals}
                onChange={(v) => setPlanField(p.id, 'maxLocals', v)}
              />
              <LimitInput
                label="Productos"
                value={p.maxProducts}
                onChange={(v) => setPlanField(p.id, 'maxProducts', v)}
              />
              <LimitInput
                label="Clientes"
                value={p.maxCustomers}
                onChange={(v) => setPlanField(p.id, 'maxCustomers', v)}
              />
            </div>
            <p className="mt-1 text-[10px] text-gray-400">
              Vacío = ilimitado
            </p>

            <Button
              variant="primary"
              size="sm"
              fullWidth
              icon={CheckIcon}
              className="mt-3"
              onClick={() => savePlan(p)}
            >
              Guardar plan
            </Button>
          </div>
        ))}
      </div>

      {/* MÓDULOS POR PLAN */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 p-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              ¿Qué desbloquea cada plan?
            </h2>
            <p className="text-xs text-gray-500">
              Para cada módulo, elige desde qué plan está disponible. "Base" = en
              todos los planes. Los planes superiores incluyen lo de los inferiores.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={CheckIcon}
            loading={saving}
            disabled={!dirtyGates}
            onClick={saveGates}
          >
            Guardar cambios
          </Button>
        </div>

        <div className="divide-y divide-gray-100">
          {Object.entries(grouped).map(([group, mods]) => (
            <div key={group} className="p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {group}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {mods.map((m) => (
                  <div
                    key={m.key}
                    className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-sm text-gray-700">
                      {m.label}
                    </span>
                    <select
                      value={gates[m.key] || 'BASE'}
                      onChange={(e) => setGate(m.key, e.target.value)}
                      className="flex-none rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                      {planOptions.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        Nota: las empresas sin plan asignado no se ven afectadas por estos límites.
      </p>
    </div>
  );
}

function LimitInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase text-gray-400">{label}</span>
      <input
        type="number"
        value={value ?? ''}
        placeholder="∞"
        onChange={(e) =>
          onChange(e.target.value === '' ? null : Number(e.target.value))
        }
        className="mt-0.5 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      />
    </label>
  );
}
