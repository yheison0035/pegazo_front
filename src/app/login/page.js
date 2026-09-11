'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  ShoppingBagIcon,
  BellAlertIcon,
  GiftIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import { accountantLogin } from '@/lib/api/routes/accountant';

const HIGHLIGHTS = [
  {
    icon: SparklesIcon,
    text: 'Se adapta a cualquier tipo de negocio',
    short: 'Multi-negocio',
  },
  {
    icon: ShoppingBagIcon,
    text: 'Tienda online conectada a tu inventario',
    short: 'Tienda online',
  },
  {
    icon: BellAlertIcon,
    text: 'Aviso de consignaciones en tiempo real',
    short: 'Alertas de banco',
  },
  {
    icon: GiftIcon,
    text: 'Fidelización de clientes incluida',
    short: 'Fidelización',
  },
];

export default function Login() {
  const [mode, setMode] = useState('empresa'); // empresa | contador
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Si llegamos aquí por una empresa suspendida (impago) en medio de la sesión,
  // el cliente API dejó el motivo guardado. Lo mostramos y lo limpiamos.
  useEffect(() => {
    try {
      const notice = localStorage.getItem('pegazo_login_notice');
      if (notice) {
        setError(notice);
        localStorage.removeItem('pegazo_login_notice');
      }
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'contador') {
        // Sesión de contador (identidad independiente): guarda su token y va a
        // su portal. No pasa por el authContext de empresas.
        const res = await accountantLogin(email, password);
        const data = res?.data;
        if (!data?.access_token) throw new Error('No se recibió token.');
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('sessionType', 'accountant');
        localStorage.setItem('contador', JSON.stringify(data.accountant));
        localStorage.removeItem('usuario');
        router.push('/contador');
        return;
      }

      const user = await login(email, password);
      const role = user?.role;

      if (role === 'SUPER_PLATFORM_ADMIN') {
        router.push('/platform/companies');
        return;
      }
      // Cualquier otro rol entra al Inicio (su panel con atajos y su resumen).
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'No pudimos iniciar sesión. Revisa tus datos.');
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none transition focus:border-orange-400/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-orange-500/25';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08080a] text-white">
      {/* ===== Fondo inmersivo ===== */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b0b0e] via-[#0a0a0c] to-black" />
        {/* Auroras */}
        <div className="blob absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-orange-600/30 blur-[110px]" />
        <div className="blob blob2 absolute -bottom-32 -right-16 h-[30rem] w-[30rem] rounded-full bg-amber-400/20 blur-[120px]" />
        <div className="blob blob3 absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-500/10 blur-[100px]" />
        {/* Retícula sutil */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        {/* Viñeta */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-10 px-5 py-10 md:flex-row md:items-center md:justify-between md:gap-16 md:px-10">
        {/* ===== Lado de marca ===== */}
        <div className="w-full max-w-md text-center md:max-w-lg md:flex-1 md:text-left">
          <img
            src="/images/logo_pegazo.png"
            alt="Pegazo"
            className="mx-auto w-44 max-w-full drop-shadow-[0_8px_30px_rgba(249,115,22,0.25)] sm:w-52 md:mx-0 md:w-64"
          />

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-orange-300 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" />
            </span>
            El sistema que hace despegar tu negocio
          </div>

          <h1 className="mt-5 text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
            Todo tu negocio,
            <br className="hidden sm:block" />{' '}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              en un solo lugar
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60 md:mx-0 md:text-base">
            Ventas, inventario, clientes, citas, cartera, reportes y tu propia
            tienda online. Un solo sistema, hecho para vender más.
          </p>

          {/* Highlights (escritorio) */}
          <ul className="mt-8 hidden space-y-3 md:block">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="flex items-center gap-3">
                <span className="inline-flex flex-none rounded-xl border border-white/10 bg-white/5 p-2 text-orange-300">
                  <h.icon className="h-5 w-5" />
                </span>
                <span className="text-sm text-white/75">{h.text}</span>
              </li>
            ))}
          </ul>

          {/* Chips (móvil) */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 md:hidden">
            {HIGHLIGHTS.map((h) => (
              <span
                key={h.text}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/70"
              >
                <h.icon className="h-3.5 w-3.5 text-orange-300" />
                {h.short}
              </span>
            ))}
          </div>

          <a
            href="/"
            className="mt-7 hidden items-center gap-1.5 text-sm font-semibold text-orange-400 transition hover:text-orange-300 md:inline-flex"
          >
            Conoce todo lo que Pegazo hace por tu negocio
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>

        {/* ===== Tarjeta de acceso ===== */}
        <div className="w-full max-w-md md:flex-none">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
            {/* Brillo superior */}
            <div className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />

            <div className="relative">
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-flex flex-none rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 shadow-lg shadow-orange-500/30">
                  <ArrowRightOnRectangleIcon className="h-6 w-6 text-white" />
                </span>
                <div>
                  <h2 className="text-xl font-bold">Bienvenido de vuelta</h2>
                  <p className="text-xs text-white/50">
                    Ingresa a tu cuenta para continuar
                  </p>
                </div>
              </div>

              {/* Switch Empresa | Contador */}
              <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
                {[
                  ['empresa', 'Empresa'],
                  ['contador', 'Contador'],
                ].map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setMode(k);
                      setError('');
                    }}
                    className={`rounded-xl py-2 text-sm font-semibold transition ${
                      mode === k
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/60">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="ejemplo@empresa.com"
                      autoComplete="email"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/60">
                    Contraseña
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={`${inputCls} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-white/40 transition hover:text-white/80"
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
                    className="text-xs font-medium text-orange-300 transition hover:text-orange-200"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                {error && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-400 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Entrando…
                    </>
                  ) : (
                    <>
                      Iniciar sesión
                      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {mode === 'contador' ? (
                <p className="mt-6 text-center text-sm text-white/50">
                  ¿Eres contador y no tienes cuenta?{' '}
                  <a
                    href="/register-contador"
                    className="font-semibold text-orange-300 hover:text-orange-200"
                  >
                    Regístrate como contador
                  </a>
                </p>
              ) : (
                <p className="mt-6 text-center text-sm text-white/50">
                  ¿No tienes cuenta?{' '}
                  <a
                    href="https://wa.me/573186356609?text=Hola%2C%20quiero%20cotizar%20Pegazo%20para%20mi%20negocio."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-orange-300 hover:text-orange-200"
                  >
                    Cotiza tu plan por WhatsApp
                  </a>
                </p>
              )}

              <div className="mt-5 flex items-center justify-center gap-4 border-t border-white/10 pt-4 text-[11px] text-white/40">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                  Conexión segura
                </span>
                <span className="h-3 w-px bg-white/10" />
                <span>Datos en la nube</span>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-white/30">
            © {new Date().getFullYear()} Pegazo · Todos los derechos reservados
          </p>
        </div>
      </div>

      <style jsx>{`
        .blob {
          animation: floatBlob 14s ease-in-out infinite;
        }
        .blob2 {
          animation-duration: 18s;
          animation-delay: -4s;
        }
        .blob3 {
          animation-duration: 22s;
          animation-delay: -8s;
        }
        @keyframes floatBlob {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          33% {
            transform: translate3d(3%, -4%, 0) scale(1.08);
          }
          66% {
            transform: translate3d(-3%, 3%, 0) scale(0.95);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .blob {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
