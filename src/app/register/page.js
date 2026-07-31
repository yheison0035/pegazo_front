'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/context/authContext';
import { validateCoupon } from '@/lib/api/auth/auth';
import { PLANS } from '@/lib/plans';

const BUSINESS_TYPES = [
  { id: 'COMERCIO', name: 'Tienda / Comercio' },
  { id: 'RESTAURANTE', name: 'Restaurante / Bar' },
  { id: 'SERVICIOS', name: 'Servicios (barbería, spa, salón)' },
  { id: 'ECOMMERCE', name: 'Tienda online' },
  { id: 'DISTRIBUCION', name: 'Distribución / Mayorista' },
];

const PLAN_IDS = PLANS.map((p) => p.id);

function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function Register() {
  const router = useRouter();
  const { registerBusiness } = useAuth();

  const [form, setForm] = useState({
    companyName: '',
    type: 'COMERCIO',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [plan, setPlan] = useState('');
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Preselecciona el plan si viene desde la landing (?plan=IMPULSO).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = (params.get('plan') || '').toUpperCase();
    if (PLAN_IDS.includes(p)) setPlan(p);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const selectPlan = (id) => {
    setPlan(id);
    // Un cambio de plan invalida el cupón aplicado (puede no aplicar).
    setAppliedCoupon(null);
    setCouponMsg(null);
  };

  const applyCoupon = async () => {
    setCouponMsg(null);
    if (!plan) {
      setCouponMsg({ type: 'error', text: 'Primero elige un plan.' });
      return;
    }
    if (!coupon.trim()) return;
    setCheckingCoupon(true);
    try {
      const res = await validateCoupon(coupon.trim(), plan);
      setAppliedCoupon(res.data);
      setCouponMsg({ type: 'success', text: '¡Cupón aplicado!' });
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMsg({ type: 'error', text: err.message || 'Cupón no válido.' });
    } finally {
      setCheckingCoupon(false);
    }
  };

  const selected = PLANS.find((p) => p.id === plan);
  const base = selected?.priceMonthly ?? 0;
  let finalPrice = base;
  if (appliedCoupon && base > 0) {
    finalPrice =
      appliedCoupon.discountType === 'PERCENT'
        ? Math.max(0, Math.round(base * (1 - appliedCoupon.discountValue / 100)))
        : Math.max(0, base - appliedCoupon.discountValue);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!plan) {
      setError('Debes seleccionar un plan para continuar.');
      return;
    }

    setLoading(true);
    try {
      await registerBusiness({
        companyName: form.companyName,
        type: form.type,
        ownerName: form.ownerName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        plan,
        couponCode: appliedCoupon?.code || undefined,
      });
      router.push('/dashboard/sales');
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 py-10 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Encabezado */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-6 text-center text-white shadow-lg">
          <img
            src="/images/logo_pegazo.png"
            alt="Pegazo"
            className="mx-auto w-48 max-w-full"
          />
          <h1 className="mt-2 text-2xl font-bold">Crea tu cuenta y empieza hoy</h1>
          <p className="mt-1 text-sm text-neutral-300">
            Registra tu negocio en minutos. Todo tu negocio, en un solo lugar.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {/* 1. Plan (obligatorio) */}
          <section>
            <h2 className="text-lg font-bold text-neutral-900">
              1. Elige tu plan <span className="text-orange-600">*</span>
            </h2>
            <p className="mb-4 text-sm text-neutral-500">
              Puedes empezar gratis y cambiar de plan cuando quieras.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {PLANS.map((p) => {
                const active = plan === p.id;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => selectPlan(p.id)}
                    className={`relative flex flex-col rounded-xl border p-4 text-left transition ${
                      active
                        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500'
                        : 'border-neutral-200 hover:border-orange-300'
                    }`}
                  >
                    {active && (
                      <CheckCircleIcon className="absolute right-3 top-3 h-5 w-5 text-orange-600" />
                    )}
                    <span className="text-sm font-bold text-neutral-900">
                      {p.emoji} {p.name}
                    </span>
                    <span className="text-xs text-neutral-500">{p.tagline}</span>
                    <span className="mt-2 text-lg font-extrabold text-neutral-900">
                      {p.priceLabel}
                      <span className="text-xs font-normal text-neutral-500">
                        {p.priceSuffix}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Datos del negocio */}
          <section className="grid gap-4 sm:grid-cols-2">
            <h2 className="col-span-full text-lg font-bold text-neutral-900">
              2. Datos de tu negocio
            </h2>

            <Field
              label="Nombre del negocio *"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              required
            />

            <div className="flex flex-col">
              <label className="mb-1 text-xs font-semibold text-neutral-600">
                Tipo de negocio
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <Field
              label="Tu nombre (administrador) *"
              name="ownerName"
              value={form.ownerName}
              onChange={handleChange}
              required
            />
            <Field
              label="Celular"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </section>

          {/* 3. Acceso */}
          <section className="grid gap-4 sm:grid-cols-2">
            <h2 className="col-span-full text-lg font-bold text-neutral-900">
              3. Tus datos de acceso
            </h2>
            <Field
              label="Correo electrónico *"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Field
              label="Contraseña *"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </section>

          {/* 4. Cupón */}
          <section>
            <h2 className="text-lg font-bold text-neutral-900">
              4. ¿Tienes un cupón?
            </h2>
            <p className="mb-3 text-sm text-neutral-500">
              Ingresa tu código de descuento (opcional).
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="CÓDIGO"
                className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm uppercase focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={checkingCoupon}
                className="whitespace-nowrap rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 disabled:opacity-50"
              >
                {checkingCoupon ? 'Validando...' : 'Aplicar'}
              </button>
            </div>
            {couponMsg && (
              <p
                className={`mt-2 text-sm font-medium ${
                  couponMsg.type === 'success'
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}
              >
                {couponMsg.text}
              </p>
            )}
          </section>

          {/* Resumen */}
          {selected && (
            <div className="rounded-xl bg-neutral-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">
                  Plan {selected.name}
                </span>
                <span className="font-semibold text-neutral-900">
                  {base > 0 ? formatCOP(base) + '/mes' : 'Gratis'}
                </span>
              </div>
              {appliedCoupon && base > 0 && (
                <>
                  <div className="mt-1 flex items-center justify-between text-sm text-emerald-600">
                    <span>Cupón {appliedCoupon.code}</span>
                    <span>
                      -
                      {appliedCoupon.discountType === 'PERCENT'
                        ? `${appliedCoupon.discountValue}%`
                        : formatCOP(appliedCoupon.discountValue)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-2 text-base font-bold text-neutral-900">
                    <span>Total</span>
                    <span>{formatCOP(finalPrice)}/mes</span>
                  </div>
                </>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 py-3 font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creando tu cuenta...' : 'Crear cuenta y empezar'}
          </button>

          <p className="text-center text-sm text-neutral-500">
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="font-semibold text-orange-600 hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-xs font-semibold text-neutral-600">
        {label}
      </label>
      <input
        {...props}
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}
