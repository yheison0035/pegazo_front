'use client';

import { useState } from 'react';
import { forgotPassword } from '@/lib/api/auth/auth';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || 'No se pudo enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-orange-900 focus:outline-none focus:ring-2 focus:ring-orange-900';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-gray-800">
          Restablecer contraseña
        </h1>

        {sent ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">
              Si el correo <b>{email}</b> está registrado, te enviamos un enlace
              para restablecer tu contraseña. Revisa tu bandeja (y la carpeta de
              spam). El enlace vence en 30 minutos.
            </p>
            <a href="/login" className="text-sm text-orange-800 hover:underline">
              Volver a iniciar sesión
            </a>
          </div>
        ) : (
          <>
            <p className="mb-6 mt-2 text-sm text-gray-500">
              Ingresa tu correo y te enviaremos un enlace para crear una nueva
              contraseña.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tucorreo@ejemplo.com"
                  className={inputClass}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" variant="primary" fullWidth loading={loading}>
                Enviar enlace
              </Button>

              <div className="text-center">
                <a
                  href="/login"
                  className="text-xs text-gray-500 hover:underline"
                >
                  Volver a iniciar sesión
                </a>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
