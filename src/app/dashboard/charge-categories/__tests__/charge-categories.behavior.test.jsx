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
  title: 'Tipos de cargo a empleado',
  Page,
  base: '/charge-categories',
  rows: [
    { id: 1, name: 'PRÉSTAMO', isBase: false, usageCount: 2 },
    { id: 2, name: 'UNIFORME', isBase: false, usageCount: 0 },
  ],
  heading: 'Tipos de cargo a empleado',
  addText: 'Nuevo tipo',
  placeholder: 'EJ: MEMBRESÍA, PRÉSTAMO, UNIFORME…',
  deleteTitle: 'Eliminar tipo',
  user: { type: 'BARBERIA' },
  blockedRoles: ['BARBERO', 'RECEPCIONISTA'],
});
