'use client';

import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RoleGuard({ allowedRoles, children }) {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!usuario) {
      router.replace('/CRM');
    } else if (!allowedRoles.includes(usuario.rol)) {
      router.replace('/CRM/dashboard/customers');
    }
  }, [usuario, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-sm text-gray-600">Validando sesión...</p>
      </div>
    );
  }

  if (!usuario || !allowedRoles.includes(usuario.rol)) {
    return null;
  }

  return children;
}
