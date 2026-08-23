'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '@/lib/api/routes/coupons';
import { PLANS } from '@/lib/plans';
import AlertModal from '@/components/dashboard/modals/alertModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Button from '@/components/ui/Button';

const EMPTY = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: 10,
  appliesToPlan: '',
  maxRedemptions: '',
  expiresAt: '',
  active: true,
};

function discountLabel(c) {
  return c.discountType === 'PERCENT'
    ? `${c.discountValue}%`
    : new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(c.discountValue || 0);
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // id o null (crear)
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({});
  const [couponToDelete, setCouponToDelete] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCoupons({ limit: 100 });
      setCoupons(res.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c.id);
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue: c.discountValue,
      appliesToPlan: c.appliesToPlan || '',
      maxRedemptions: c.maxRedemptions ?? '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      active: c.active,
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        appliesToPlan: form.appliesToPlan || undefined,
        maxRedemptions:
          form.maxRedemptions === '' ? undefined : Number(form.maxRedemptions),
        expiresAt: form.expiresAt || undefined,
        active: form.active,
      };
      if (editing) {
        await updateCoupon(editing, payload);
      } else {
        await createCoupon(payload);
      }
      setShowForm(false);
      setAlert({
        type: 'success',
        message: editing ? 'Cupón actualizado' : 'Cupón creado',
      });
      fetch();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo guardar' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const c = couponToDelete;
    try {
      await deleteCoupon(c.id);
      setCouponToDelete(null);
      setAlert({ type: 'success', message: 'Cupón eliminado' });
      fetch();
    } catch (err) {
      setCouponToDelete(null);
      setAlert({ type: 'error', message: err.message });
    }
  };

  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <div className="w-full">
        <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold">Cupones de descuento</h1>
            <p className="text-sm text-gray-500">
              Crea códigos que tus clientes pueden aplicar al registrarse.
            </p>
          </div>
          <Button variant="add" icon={PlusIcon} onClick={openCreate}>
            Crear cupón
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Descuento</th>
                <th className="px-4 py-3">Aplica a</th>
                <th className="px-4 py-3">Usos</th>
                <th className="px-4 py-3">Vence</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Cargando...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Aún no hay cupones. Crea el primero.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {c.code}
                      {c.description && (
                        <div className="text-xs font-normal text-gray-400">
                          {c.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{discountLabel(c)}</td>
                    <td className="px-4 py-3">
                      {c.appliesToPlan
                        ? PLANS.find((p) => p.id === c.appliesToPlan)?.name ||
                          c.appliesToPlan
                        : 'Todos los planes'}
                    </td>
                    <td className="px-4 py-3">
                      {c.timesRedeemed}
                      {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      {c.expiresAt ? c.expiresAt.slice(0, 10) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          c.active
                            ? 'bg-green-50 text-green-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {c.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-gray-400 hover:text-orange-600"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setCouponToDelete(c)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <form
              onSubmit={handleSave}
              className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h2 className="text-lg font-bold text-gray-800">
                {editing ? 'Editar cupón' : 'Nuevo cupón'}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <label className="col-span-2 flex flex-col text-sm">
                  <span className="mb-1 font-semibold text-gray-600">
                    Código *
                  </span>
                  <input
                    required
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 uppercase focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </label>

                <label className="col-span-2 flex flex-col text-sm">
                  <span className="mb-1 font-semibold text-gray-600">
                    Descripción
                  </span>
                  <input
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </label>

                <label className="flex flex-col text-sm">
                  <span className="mb-1 font-semibold text-gray-600">
                    Tipo de descuento
                  </span>
                  <select
                    value={form.discountType}
                    onChange={(e) =>
                      setForm({ ...form, discountType: e.target.value })
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="PERCENT">Porcentaje (%)</option>
                    <option value="FIXED">Monto fijo (COP)</option>
                  </select>
                </label>

                <label className="flex flex-col text-sm">
                  <span className="mb-1 font-semibold text-gray-600">
                    Valor {form.discountType === 'PERCENT' ? '(%)' : '(COP)'}
                  </span>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.discountValue}
                    onChange={(e) =>
                      setForm({ ...form, discountValue: e.target.value })
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </label>

                <label className="flex flex-col text-sm">
                  <span className="mb-1 font-semibold text-gray-600">
                    Aplica al plan
                  </span>
                  <select
                    value={form.appliesToPlan}
                    onChange={(e) =>
                      setForm({ ...form, appliesToPlan: e.target.value })
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Todos los planes</option>
                    {PLANS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col text-sm">
                  <span className="mb-1 font-semibold text-gray-600">
                    Máx. usos (vacío = ilimitado)
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={form.maxRedemptions}
                    onChange={(e) =>
                      setForm({ ...form, maxRedemptions: e.target.value })
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </label>

                <label className="flex flex-col text-sm">
                  <span className="mb-1 font-semibold text-gray-600">
                    Vence (opcional)
                  </span>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm({ ...form, expiresAt: e.target.value })
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </label>

                <label className="col-span-2 mt-1 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.checked })
                    }
                    className="h-4 w-4 accent-orange-600"
                  />
                  <span className="font-medium text-gray-700">Activo</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" loading={saving}>
                  {saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear cupón'}
                </Button>
              </div>
            </form>
          </div>
        )}

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({})}
        />

        <ConfirmModal
          open={!!couponToDelete}
          title="¿Eliminar cupón?"
          message={
            couponToDelete ? `Se eliminará el cupón ${couponToDelete.code}.` : ''
          }
          confirmText="Eliminar"
          tone="danger"
          onConfirm={confirmDelete}
          onCancel={() => setCouponToDelete(null)}
        />
      </div>
    </RoleGuard>
  );
}
