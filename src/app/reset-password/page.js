'use client';

import { useEffect, useState } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { resetPassword } from '@/lib/api/auth/auth';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') || '');
  }, []);

  const tooShort = password.length > 0 && password.length < 6;
  const mismatch = confirm.length > 0 && password !== confirm;
  const match = confirm.length > 0 && password === confirm && !tooShort;
  const canSubmit = password.length >= 6 && password === confirm && !!token;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6)
      return setError('La contraseña debe tener al menos 6 caracteres');
    if (password !== confirm)
      return setError('Las contraseñas no coinciden');
    if (!token) return setError('Enlace inválido. Solicita uno nuevo.');
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-sm text-white placeholder-white/30 outline-none transition focus:border-orange-400/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-orange-500/25';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08080a] p-5 text-white">
      {/* Fondo inmersivo */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b0b0e] via-[#0a0a0c] to-black" />
        <div className="blob absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-orange-600/30 blur-[110px]" />
        <div className="blob blob2 absolute -bottom-32 -right-16 h-[30rem] w-[30rem] rounded-full bg-amber-400/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <img
          src="/images/logo_pegazo.png"
          alt="Pegazo"
          className="mx-auto mb-6 w-40 drop-shadow-[0_8px_30px_rgba(249,115,22,0.25)]"
        />

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />

          <div className="relative">
            {done ? (
              <div className="text-center">
                <span className="mx-auto mb-4 inline-flex rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 shadow-lg shadow-emerald-500/30">
                  <CheckCircleIcon className="h-7 w-7 text-white" />
                </span>
                <h2 className="text-xl font-bold">¡Contraseña actualizada!</h2>
                <p className="mt-2 text-sm text-white/60">
                  Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
                <a
                  href="/login"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-400 hover:to-amber-400"
                >
                  Iniciar sesión
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-3">
                  <span className="inline-flex flex-none rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 shadow-lg shadow-orange-500/30">
                    <LockClosedIcon className="h-6 w-6 text-white" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold">Nueva contraseña</h2>
                    <p className="text-xs text-white/50">
                      Crea una contraseña segura para tu cuenta
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-white/60">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        aria-label={showPass ? 'Ocultar' : 'Mostrar'}
                        className="absolute inset-y-0 right-3 flex items-center text-white/40 transition hover:text-white/80"
                      >
                        {showPass ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {tooShort && (
                      <p className="mt-1.5 text-xs text-red-300">
                        Debe tener al menos 6 caracteres.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-white/60">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={`${inputCls} ${
                          mismatch
                            ? 'border-red-400/50 focus:ring-red-500/25'
                            : match
                              ? 'border-emerald-400/50 focus:ring-emerald-500/25'
                              : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
                        className="absolute inset-y-0 right-3 flex items-center text-white/40 transition hover:text-white/80"
                      >
                        {showConfirm ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {mismatch && (
                      <p className="mt-1.5 text-xs text-red-300">
                        Las contraseñas no coinciden.
                      </p>
                    )}
                    {match && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-300">
                        <CheckCircleIcon className="h-4 w-4" /> Las contraseñas
                        coinciden.
                      </p>
                    )}
                  </div>

                  {error && (
                    <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !canSubmit}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-400 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Guardando…
                      </>
                    ) : (
                      <>
                        Restablecer contraseña
                        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <a
                      href="/login"
                      className="text-xs font-medium text-white/50 transition hover:text-white/80"
                    >
                      Volver a iniciar sesión
                    </a>
                  </div>
                </form>
              </>
            )}

            <div className="mt-5 flex items-center justify-center gap-4 border-t border-white/10 pt-4 text-[11px] text-white/40">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                Conexión segura
              </span>
              <span className="h-3 w-px bg-white/10" />
              <span>Pegazo</span>
            </div>
          </div>
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
