import { useAuth } from '@/context/authContext';
import { ROLE_PERMISSIONS } from '@/config/permissions';

export default function usePermissions() {
  const { usuario } = useAuth();
  const role = usuario?.role?.toUpperCase() || 'ASESOR';

  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.ASESOR;
}
