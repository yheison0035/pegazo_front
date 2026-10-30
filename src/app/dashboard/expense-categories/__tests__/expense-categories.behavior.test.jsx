import { vi } from 'vitest';
import { describeSimpleCatalog } from '@/test/simpleCatalogBehavior';
import Page from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

describeSimpleCatalog({
  title: 'Tipos de gasto',
  Page,
  base: '/expense-categories',
  rows: [
    { id: 11, name: 'SERVICIOS PÚBLICOS', isBase: false, usageCount: 4 },
    { id: 12, name: 'PUBLICIDAD', isBase: false, usageCount: 0 },
  ],
  heading: 'Tipos de gasto',
  addText: 'Nuevo tipo',
  placeholder: 'EJ: PUBLICIDAD, NETFLIX, DOMICILIOS…',
  deleteTitle: 'Eliminar tipo',
  blockedRoles: ['ASESOR', 'CAJA'],
});
