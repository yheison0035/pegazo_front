'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  PhoneIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';
import { accountantRegister } from '@/lib/api/routes/accountant';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterContador() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 2) return setError('Escribe tu nombre.');
    if (!EMAIL_RE.test(form.email)) return setError('Correo no válido.');
    if (form.password.length < 6)
      return setError('La contraseña debe tener al menos 6 caracteres.');
    if (form.password !== form.confirm)
      return setError('Las contraseñas no coinciden.');

    setLoading(true);
    try {
      const res = await accountantRegister({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      const data = res?.data;
      if (!data?.access_token) throw new Error('No se recibió token.');
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('sessionType', 'accountant');
      localStorage.setItem('contador', JSON.stringify(data.accountant));
      localStorage.removeItem('usuario');
      router.push('/contador');
    } catch (err) {
      setError(err.message || 'No pudimos crear tu cuenta.');
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none transition focus:border-orange-400/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-orange-500/25';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08080a] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b0b0e] via-[#0a0a0c] to-black" />
        <div className="absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-orange-600/25 blur-[110px]" />
        <div className="absolute -bottom-32 -right-16 h-[30rem] w-[30rem] rounded-full bg-amber-400/15 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10">
        <img
          src="/images/logo_pegazo.png"
          alt="Pegazo"
          className="mb-6 w-40 drop-shadow-[0_8px_30px_rgba(249,115,22,0.25)]"
        />
        <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex flex-none rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 shadow-lg shadow-orange-500/30">
              <CalculatorIcon className="h-6 w-6 text-white" />
            </span>
            <div>
              <h2 className="text-xl font-bold">Crea tu cuenta de contador</h2>
              <p className="text-xs text-white/50">
                Maneja la contabilidad de varias empresas desde un solo lugar
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
              <input
                value={form.name}
                onChange={set('name')}
                placeholder="Nombre completo"
                className={inputCls}
              />
            </div>
            <div className="relative">
              <EnvelopeIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="Correo electrónico"
                className={inputCls}
              />
            </div>
            <div className="relative">
              <PhoneIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
              <input
                value={form.phone}
                onChange={set('phone')}
                placeholder="Teléfono (opcional)"
                className={inputCls}
              />
            </div>
            <div className="relative">
              <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Contraseña"
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-white/80"
              >
                {showPass ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="relative">
              <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
              <input
                type={showPass ? 'text' : 'password'}
                value={form.confirm}
                onChange={set('confirm')}
                placeholder="Confirmar contraseña"
                className={inputCls}
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-400 hover:to-amber-400 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creando…
                </>
              ) : (
                <>
                  Crear cuenta
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="font-semibold text-orange-300 hover:text-orange-200">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
