'use client';

import { useState } from 'react';
import {
  forgotPassword,
  requestPasswordOtp,
  resetPasswordWithOtp,
} from '@/lib/api/auth/auth';

export default function ForgotPasswordPage() {
  const [channel, setChannel] = useState('email'); // 'email' | 'whatsapp'
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado del flujo por correo
  const [emailSent, setEmailSent] = useState(false);

  // Estado del flujo por WhatsApp
  const [otpStep, setOtpStep] = useState(false); // ya se envió el código
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);

  const resetState = () => {
    setError('');
    setEmailSent(false);
    setOtpStep(false);
    setDone(false);
    setCode('');
    setPassword('');
    setConfirm('');
  };

  // --- Correo ---
  const handleEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(identifier.trim());
      setEmailSent(true);
    } catch (err) {
      setError(err.message || 'No se pudo enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  // --- WhatsApp: pedir código ---
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordOtp(identifier.trim());
      setOtpStep(true);
    } catch (err) {
      setError(err.message || 'No se pudo enviar el código');
    } finally {
      setLoading(false);
    }
  };

  // --- WhatsApp: validar código + nueva contraseña ---
  const handleResetOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithOtp(identifier.trim(), code.trim(), password);
      setDone(true);
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900';
  const btnClass =
    'w-full rounded-lg bg-gradient-to-r from-blue-950 to-blue-800 py-2 font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-gray-800">
          Restablecer contraseña
        </h1>

        {/* Selector de canal */}
        {!emailSent && !otpStep && !done && (
          <div className="mb-5 mt-3 flex gap-2 rounded-lg bg-gray-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => {
                setChannel('email');
                resetState();
              }}
              className={`flex-1 rounded-md py-1.5 font-medium ${
                channel === 'email'
                  ? 'bg-white text-blue-900 shadow'
                  : 'text-gray-500'
              }`}
            >
              Por correo
            </button>
            <button
              type="button"
              onClick={() => {
                setChannel('whatsapp');
                resetState();
              }}
              className={`flex-1 rounded-md py-1.5 font-medium ${
                channel === 'whatsapp'
                  ? 'bg-white text-green-700 shadow'
                  : 'text-gray-500'
              }`}
            >
              Por WhatsApp
            </button>
          </div>
        )}

        {/* Éxito final (WhatsApp) */}
        {done ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">
              ¡Listo! Tu contraseña fue actualizada. Ya puedes iniciar sesión.
            </p>
            <a href="/CRM" className={btnClass + ' inline-block text-center'}>
              Iniciar sesión
            </a>
          </div>
        ) : emailSent ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">
              Si el correo <b>{identifier}</b> está registrado, te enviamos un
              enlace para restablecer tu contraseña. Revisa tu bandeja (y spam).
              Vence en 30 minutos.
            </p>
            <a href="/CRM" className="text-sm text-blue-800 hover:underline">
              Volver a iniciar sesión
            </a>
          </div>
        ) : channel === 'email' ? (
          /* ---- FLUJO CORREO ---- */
          <form onSubmit={handleEmail} className="space-y-4">
            <p className="text-sm text-gray-500">
              Ingresa tu correo y te enviaremos un enlace.
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Correo electrónico
              </label>
              <input
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="tucorreo@ejemplo.com"
                className={inputClass}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        ) : !otpStep ? (
          /* ---- WHATSAPP: pedir código ---- */
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <p className="text-sm text-gray-500">
              Ingresa tu correo o celular. Te enviaremos un código por WhatsApp
              al número registrado en tu cuenta.
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Correo o celular
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="correo@ejemplo.com o 300 000 0000"
                className={inputClass}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        ) : (
          /* ---- WHATSAPP: validar código + nueva contraseña ---- */
          <form onSubmit={handleResetOtp} className="space-y-4">
            <p className="text-sm text-gray-500">
              Escribe el código que recibiste por WhatsApp y tu nueva
              contraseña.
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Código (6 dígitos)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="000000"
                className={inputClass + ' tracking-[0.4em]'}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpStep(false);
                setError('');
              }}
              className="w-full text-center text-xs text-gray-500 hover:underline"
            >
              Reenviar / cambiar número
            </button>
          </form>
        )}

        {!done && !emailSent && (
          <div className="mt-6 text-center">
            <a href="/CRM" className="text-xs text-gray-500 hover:underline">
              Volver a iniciar sesión
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
