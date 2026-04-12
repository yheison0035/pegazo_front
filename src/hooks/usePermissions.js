import { useAuth } from '@/context/authContext';
import { ROLE_PERMISSIONS } from '@/config/permissions';

export default function usePermissions() {
  const { usuario } = useAuth();

  const role = usuario?.role;

  const permissions = ROLE_PERMISSIONS[role] || {};

  function can(module, action) {
    // acceso total absoluto
    if (permissions['*']?.includes('*')) return true;

    // acceso global por acción (SUPER_ADMIN)
    if (permissions['*']?.includes(action)) return true;

    // acceso total por módulo
    if (permissions[module]?.includes('*')) return true;

    // acceso normal
    return permissions[module]?.includes(action) || false;
  }

  return { can };
}
