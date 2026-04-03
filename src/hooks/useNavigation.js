import { BUSINESS_TYPES } from '@/config/businessTypes';
import { NAVIGATION } from '@/config/navigation';
import { PLATFORM_NAVIGATION } from '@/config/platformNavigation';
import { useAuth } from '@/context/authContext';

export default function useNavigation() {
  const { usuario } = useAuth();

  if (!usuario) return [];

  const role = usuario.role;

  if (role === 'SUPER_PLATFORM_ADMIN') {
    return PLATFORM_NAVIGATION;
  }

  const businessType = usuario.company?.type || 'COMERCIO';

  const modules = BUSINESS_TYPES[businessType] || BUSINESS_TYPES.COMERCIO;

  return modules
    .map((key) => NAVIGATION[key])
    .filter((link) => link && link.roles.includes(role));
}
