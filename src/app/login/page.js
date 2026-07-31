'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';

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

      router.push('/dashboard/sales');
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
            className="w-[28rem] max-w-full"
          />
        </div>

        <div className="relative z-10 text-sm text-neutral-400">
          © {new Date().getFullYear()} Pegazo. Todos los derechos reservados.
        </div>
      </div>

      <div className="flex w-full md:w-1/2 items-center justify-center px-6">
        <div className="w-full max-w-md">
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

              <button
                type="submit"
                className="w-full bg-gradient-to-r cursor-pointer from-orange-600 to-amber-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition duration-200 shadow-md"
              >
                Iniciar sesión
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-6">
              Plataforma segura · Pegazo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
