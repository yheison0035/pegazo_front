'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';

export default function RoleGuard({
  allowedRoles = [],
  children,
  redirectTo = '/CRM/dashboard',
}) {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!usuario) {
        router.push('/CRM');
      } else {
        const validAllowedRoles = Array.isArray(allowedRoles)
          ? allowedRoles
          : [];
        const hasAccess = validAllowedRoles.includes(usuario.role);

        if (!hasAccess) {
          router.push(redirectTo);
        }
      }
    }
  }, [usuario, loading, allowedRoles, redirectTo, router]);

  if (loading || !usuario) return null;

  const validAllowedRoles = Array.isArray(allowedRoles) ? allowedRoles : [];
  const hasAccess = validAllowedRoles.includes(usuario.role);

  if (!hasAccess) return null;

  return children;
}
