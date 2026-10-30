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
  title: 'Unidades de medida',
  Page,
  base: '/units-of-measure',
  rows: [
    { id: 1, name: 'CAJA X12', code: 'UNIDAD', isBase: false, usageCount: 2 },
    { id: 2, name: 'BULTO', code: 'KG', isBase: false, usageCount: 0 },
  ],
  heading: 'Unidades de medida',
  addText: 'Nueva unidad',
  placeholder: 'EJ: KILOGRAMO, LITRO, CAJA…',
  deleteTitle: 'Eliminar unidad',
  // Una unidad nueva nace con comportamiento "unidad" (conteo entero).
  extraCreate: { code: 'UNIDAD' },
  blockedRoles: ['BODEGUERO', 'ASESOR'],
});
