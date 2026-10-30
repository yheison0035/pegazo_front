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
  title: 'Medios de pago en caja',
  Page,
  base: '/payment-methods',
  rows: [
    { id: 7, name: 'NEQUI', code: 'TRANSFERENCIA', isBase: false, usageCount: 5, active: true },
    { id: 8, name: 'QR BANCOLOMBIA', code: 'BANCOLOMBIA', isBase: false, usageCount: 0, active: true },
  ],
  heading: 'Medios de pago en caja',
  addText: 'Nuevo método',
  placeholder: 'EJ: NEQUI, DAVIPLATA, QR…',
  deleteTitle: 'Eliminar método',
  // Un método nuevo nace con comportamiento "Transferencia (banco)".
  extraCreate: { code: 'TRANSFERENCIA' },
  blockedRoles: ['CAJA', 'ASESOR'],
});
