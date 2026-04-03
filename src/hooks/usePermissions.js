import { useAuth } from '@/context/authContext';
import { ROLE_PERMISSIONS } from '@/config/permissions';

export default function usePermissions() {
  const { usuario } = useAuth();

  const role = usuario?.role;

  const permissions = ROLE_PERMISSIONS[role] || {};

  function can(module, action) {
    // acceso total
    if (permissions['*']?.includes('*')) return true;

    // acceso total por módulo
    if (permissions[module]?.includes('*')) return true;

    return permissions[module]?.includes(action);
  }

  return { can };
}
