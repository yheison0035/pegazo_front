'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  SparklesIcon,
  ShoppingBagIcon,
  BellAlertIcon,
  GiftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import Button from '@/components/ui/Button';

const HIGHLIGHTS = [
  { icon: SparklesIcon, text: 'Se adapta a cualquier negocio' },
  { icon: ShoppingBagIcon, text: 'Tu tienda online conectada al inventario' },
  { icon: BellAlertIcon, text: 'Aviso de consignaciones en tiempo real' },
  { icon: GiftIcon, text: 'Fidelización de clientes incluida' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      const role = user?.role;

      if (role === 'SUPER_PLATFORM_ADMIN') {
        router.push('/platform/companies');
        return;
      }
      // El profesional que presta el servicio (Barbero, Doctor, Estilista…)
      // entra directo a su agenda de citas.
      if (role === 'BARBERO' || role === 'PROFESIONAL') {
        router.push('/dashboard/appointments');
        return;
      }
      // Roles de restaurante: van directo a su módulo de trabajo.
      if (role === 'MESERO' || role === 'CAJA') {
        router.push('/dashboard/mesas');
        return;
      }
      if (role === 'COCINERO') {
        router.push('/dashboard/kitchen');
        return;
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'No pudimos iniciar sesión. Revisa tus datos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Panel de marca (escritorio) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-14 text-white md:flex">
        <div className="absolute left-16 top-16 h-72 w-72 rounded-full bg-orange-500 opacity-25 blur-3xl" />
        <div className="absolute bottom-16 right-16 h-72 w-72 rounded-full bg-amber-400 opacity-20 blur-3xl" />

        <div className="relative z-10 flex flex-1 flex-col justify-center">
          <img
            src="/images/logo_pegazo.png"
            alt="Pegazo"
            className="w-72 max-w-full"
          />
          <h1 className="mt-8 text-3xl font-bold leading-tight">
            Todo tu negocio,{' '}
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              en un solo lugar
            </span>
          </h1>
          <p className="mt-4 max-w-md text-neutral-300">
            Ventas, inventario, clientes, citas, cartera, reportes y tu propia
            tienda online. Un solo sistema para hacer despegar tu negocio.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="flex items-center gap-3">
                <span className="inline-flex flex-none rounded-lg bg-white/10 p-1.5 text-orange-400">
                  <h.icon className="h-5 w-5" />
                </span>
                <span className="text-sm text-neutral-200">{h.text}</span>
              </li>
            ))}
          </ul>

          <a
            href="/"
            className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-orange-400 transition hover:text-orange-300"
          >
            Conoce todo lo que Pegazo hace por tu negocio{' '}
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>

        <div className="relative z-10 text-sm text-neutral-500">
          © {new Date().getFullYear()} Pegazo. Todos los derechos reservados.
        </div>
      </div>

      {/* Formulario */}
      <div className="flex w-full items-center justify-center px-6 py-8 md:w-1/2">
        <div className="w-full max-w-md">
          {/* Banner solo móvil */}
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-6 text-center text-white shadow-lg md:hidden">
            <img
              src="/images/logo_pegazo.png"
              alt="Pegazo"
              className="mx-auto w-48 max-w-full"
            />
            <p className="mt-3 text-sm text-neutral-300">
              Todo tu negocio, en un solo lugar. Un sistema que se adapta a lo
              que vendes.
            </p>
            <a
              href="/"
              className="mt-3 inline-block text-xs font-semibold text-orange-400 hover:text-orange-300"
            >
              Conoce Pegazo →
            </a>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800">Bienvenido</h2>
            <p className="mb-6 mt-1 text-sm text-gray-500">
              Ingresa a tu cuenta para continuar
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ejemplo@empresa.com"
                  autoComplete="email"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Contraseña
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                    className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <a
                  href="/forgot-password"
                  className="text-xs font-medium text-orange-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" fullWidth loading={loading}>
                Iniciar sesión
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <a
                href="/register"
                className="font-semibold text-orange-600 hover:underline"
              >
                Crea tu negocio gratis
              </a>
            </p>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
              Plataforma segura · datos en la nube
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
