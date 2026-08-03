'use client';

import { useEffect, useState } from 'react';
import { resetPassword } from '@/lib/api/auth/auth';
import Button from '@/components/ui/Button';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // El token viene en la URL (?token=...). Se lee en cliente para evitar
  // dependencias de Suspense con useSearchParams.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') || '');
  }, []);

  const handleSubmit = async (e) => {
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
    if (!token) {
      setError('Enlace inválido. Solicita uno nuevo.');
      return;
    }

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-gray-800">
          Nueva contraseña
        </h1>

        {done ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">
              ¡Listo! Tu contraseña fue actualizada. Ya puedes iniciar sesión.
            </p>
            <a
              href="/login"
              className="inline-block rounded-lg bg-orange-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Iniciar sesión
            </a>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-gray-500">
              Escribe tu nueva contraseña.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-orange-900 focus:outline-none focus:ring-2 focus:ring-orange-900"
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
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-orange-900 focus:outline-none focus:ring-2 focus:ring-orange-900"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" variant="primary" fullWidth loading={loading}>
                Restablecer contraseña
              </Button>

              <div className="text-center">
                <a href="/login" className="text-xs text-gray-500 hover:underline">
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
