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
  title: 'Segmentos de cliente',
  Page,
  base: '/customer-segments',
  rows: [
    { id: 1, name: 'MAYORISTA', isBase: false, usageCount: 3 },
    { id: 2, name: 'VIP', isBase: false, usageCount: 0 },
  ],
  heading: 'Segmentos de cliente',
  addText: 'Nuevo segmento',
  placeholder: 'EJ: MAYORISTA, VIP, FRECUENTE…',
  deleteTitle: 'Eliminar segmento',
  blockedRoles: ['ASESOR', 'BARBERO'],
});
