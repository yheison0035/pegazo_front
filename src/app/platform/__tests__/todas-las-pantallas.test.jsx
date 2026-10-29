import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { authState, fakeUser, installFetchMock, installBrowserStubs, RenderErrorBoundary, BREAKING } from '@/test/pageHarness';

// Prueba de humo de las pantallas de la plataforma (administración de Pegazo)
// con el usuario SUPER_PLATFORM_ADMIN y el backend simulado por ruta.

const stableToast = { show: () => {}, success: () => {}, error: () => {}, info: () => {}, warning: () => {} };
vi.mock('@/context/authContext', () => ({
  useAuth: () => ({ usuario: authState.usuario, loading: false, setUsuario: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }) => children,
}));
vi.mock('@/context/toastContext', () => ({ useToast: () => stableToast, ToastProvider: ({ children }) => children }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useParams: () => authState.params,
  usePathname: () => '/platform',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }) => <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a> }));
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const pages = import.meta.glob('../**/page.js');
const PAGE_PATHS = Object.keys(pages).sort();

describe('Pantallas de la plataforma (humo)', () => {
  let errors;
  let rejections;
  const onRejection = (reason) => rejections.push(String(reason?.stack || reason));
  beforeAll(() => installBrowserStubs());
  beforeEach(() => {
    errors = [];
    rejections = [];
    installFetchMock();
    vi.spyOn(console, 'error').mockImplementation((...a) => errors.push(a.map((x) => (x?.stack ? x.stack : String(x))).join(' ')));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.on('unhandledRejection', onRejection);
  });
  afterEach(() => {
    process.off('unhandledRejection', onRejection);
    vi.restoreAllMocks();
  });

  for (const p of PAGE_PATHS) {
    const route = p.replace(/^\.\.\//, '/platform/').replace(/\/page\.js$/, '');
    it(route, async () => {
      authState.usuario = fakeUser('COMERCIO', 'SUPER_PLATFORM_ADMIN');
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('usuario', JSON.stringify(authState.usuario));
      const Page = (await pages[p]()).default;
      let boundaryError = null;
      await act(async () => {
        render(<RenderErrorBoundary onError={(e) => (boundaryError = e)}><Page /></RenderErrorBoundary>);
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 60));
      });
      const broken = [
        ...(boundaryError ? [`RENDER: ${boundaryError.message} @ ${String(boundaryError.stack || '').split('\n').slice(1, 3).map((l) => l.trim()).join(' | ')}`] : []),
        ...(screen.queryByTestId('render-error') ? [`RENDER: ${screen.getByTestId('render-error').textContent}`] : []),
        ...errors.filter((e) => BREAKING.test(e)).map((e) => e.split('\n').slice(0, 4).join(' | ')),
        ...rejections.map((r) => `REJECTION: ${r.split('\n').slice(0, 3).join(' | ')}`),
      ];
      expect(broken).toEqual([]);
    });
  }
});
