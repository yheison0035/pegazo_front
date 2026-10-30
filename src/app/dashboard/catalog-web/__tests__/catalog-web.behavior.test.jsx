import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  ok,
  fail,
  baseRoutes,
  resetBehavior,
  renderPage,
  settle,
  screen,
  waitFor,
  click,
  typeInto,
  button,
  placeholder,
  waitForCall,
  expectToast,
  router,
} from '@/test/behaviorHarness';
import CatalogWebPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const CONFIG = { slug: 'mi-negocio-x', publicPath: 'catalog', tagline: 'Lo mejor en cascos', subtitle: 'Desde 2010', accent: '#16a34a', whatsapp: '3001112233', catalogTheme: 'clean', heroImage: '' };

function catalogApi() {
  return installApi([
    on('GET', /^\/company\/booking-config$/, ok(CONFIG)),
    on('PATCH', /^\/company\/booking-config$/, (c) => ok({ ...CONFIG, ...c.body })),
    ...baseRoutes(),
  ]);
}

describe('Catálogo web', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = catalogApi();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue() }, configurable: true });
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga la configuración, muestra la URL pública y la copia al portapapeles', async () => {
    await renderPage(<CatalogWebPage />);
    await waitForCall(api, 'GET', /^\/company\/booking-config$/);
    expect((await screen.findByPlaceholderText('mi-negocio')).value).toBe('mi-negocio-x');
    await click(button(/Copiar/));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://pegazo.co/catalog/mi-negocio-x');
  });

  it('cambiar el slug y el tema guarda toda la configuración con PATCH', async () => {
    await renderPage(<CatalogWebPage />);
    const slug = await screen.findByPlaceholderText('mi-negocio');
    await typeInto(slug, 'mi-negocio-nuevo');
    await click(screen.getByText('Elegante oscuro'));
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PATCH', /^\/company\/booking-config$/);
    expect(call.body).toEqual({
      slug: 'mi-negocio-nuevo',
      tagline: 'Lo mejor en cascos',
      subtitle: 'Desde 2010',
      accent: '#16a34a',
      whatsapp: '3001112233',
      catalogTheme: 'dark',
      heroImage: '',
    });
    await expectToast('success', 'Catálogo web actualizado');
  });

  it('un error del backend al guardar se avisa', async () => {
    api.set('PATCH', /^\/company\/booking-config$/, fail(409, 'Ese enlace ya está en uso'));
    await renderPage(<CatalogWebPage />);
    await screen.findByPlaceholderText('mi-negocio');
    await click(button('Guardar'));
    await waitForCall(api, 'PATCH', /^\/company\/booking-config$/);
    await expectToast('error', 'ya está en uso');
  });

  it('solo dueño y administrador entran', async () => {
    resetBehavior({ role: 'CAJA' });
    catalogApi();
    await renderPage(<CatalogWebPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
