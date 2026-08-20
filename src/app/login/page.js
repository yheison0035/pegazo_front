'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  EyeIcon,
  EyeSlashIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import Button from '@/components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      const user = await login(email, password);

      const role = user?.role;

      if (role === 'SUPER_PLATFORM_ADMIN') {
        router.push('/platform/companies');
        return;
      }

      if (role === 'BARBERO') {
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
      setError(err.message || 'Error en login');
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <div className="hidden md:flex w-1/2 relative bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-white p-16 flex-col justify-between overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500 opacity-25 blur-3xl rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-amber-400 opacity-20 blur-3xl rounded-full"></div>

        <div className="relative z-10 flex flex-1 flex-col justify-center">
          <img
            src="/images/logo_pegazo.png"
            alt="Pegazo"
            className="w-[24rem] max-w-full"
          />

          <h1 className="mt-8 text-3xl font-bold leading-tight">
            Todo tu negocio,{' '}
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              en un solo lugar
            </span>
          </h1>

          <p className="mt-4 max-w-md text-neutral-300">
            Ventas, inventario, clientes, gastos, citas y reportes. Gestiona y
            haz despegar tu negocio desde una sola plataforma, en la nube.
          </p>

          <p className="mt-4 flex max-w-md items-start gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-neutral-200">
            <BuildingStorefrontIcon className="mt-0.5 h-5 w-5 flex-none text-orange-400" />
            <span>
              <b className="text-white">Tienda online conectada a tu inventario:</b>{' '}
              vende por internet y tú eliges qué productos mostrar, sincronizados
              en tiempo real.
            </span>
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              'Ventas',
              'Inventario',
              'Clientes',
              'Citas',
              'Reportes',
              'Multi-sede',
              'Tienda online',
            ].map(
              (t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-neutral-200"
                >
                  {t}
                </span>
              )
            )}
          </div>

          <a
            href="/"
            className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-orange-400 transition hover:text-orange-300"
          >
            Conoce todo lo que Pegazo hace por tu negocio →
          </a>
        </div>

        <div className="relative z-10 text-sm text-neutral-400">
          © {new Date().getFullYear()} Pegazo. Todos los derechos reservados.
        </div>
      </div>

      <div className="flex w-full md:w-1/2 items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          {/* Banner solo en móvil: presenta Pegazo a quien llega desde redes.
              Fondo oscuro para que el logo (blanco/naranja) se vea bien. */}
          <div className="md:hidden mb-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-6 text-center text-white shadow-lg">
            <img
              src="/images/logo_pegazo.png"
              alt="Pegazo"
              className="mx-auto w-52 max-w-full"
            />
            <p className="mt-3 text-sm text-neutral-300">
              Todo tu negocio, en un solo lugar. Ventas, inventario, clientes,
              citas y reportes en la nube.
            </p>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-neutral-400">
              <BuildingStorefrontIcon className="mt-0.5 h-4 w-4 flex-none text-orange-400" />
              <span>
                Y tu propia tienda online conectada a tu inventario: tú eliges
                qué productos vender por internet.
              </span>
            </p>
            <a
              href="/"
              className="mt-3 inline-block text-xs font-semibold text-orange-400 hover:text-orange-300"
            >
              Conoce Pegazo →
            </a>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido</h2>

            <p className="text-sm text-gray-500 mb-6">
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
                  className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
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
                    className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
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

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <Button type="submit" variant="primary" fullWidth>
                Iniciar sesión
              </Button>
            </form>

            <p className="text-sm text-gray-500 text-center mt-6">
              ¿No tienes cuenta?{' '}
              <a
                href="/register"
                className="font-semibold text-orange-600 hover:underline"
              >
                Crea tu negocio gratis
              </a>
            </p>

            <p className="text-xs text-gray-400 text-center mt-3">
              Plataforma segura · Pegazo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
