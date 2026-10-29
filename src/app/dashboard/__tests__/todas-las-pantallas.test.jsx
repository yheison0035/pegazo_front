import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  authState,
  fakeUser,
  installFetchMock,
  installBrowserStubs,
  RenderErrorBoundary,
  BREAKING,
  BUSINESS_TYPES_SMOKE,
} from '@/test/pageHarness';

// Prueba de humo de TODAS las pantallas del dashboard para varios tipos de
// negocio: cada página se renderiza con el dueño del tipo indicado y el
// backend simulado por ruta. Falla si la pantalla lanza un error de render o
// si una carga asíncrona revienta (datos no coordinados entre módulos).

vi.mock('@/context/authContext', () => ({
  useAuth: () => ({ usuario: authState.usuario, loading: false, setUsuario: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }) => children,
}));
// El toast debe ser un objeto ESTABLE (como en el provider real): varias
// páginas lo ponen como dependencia de useCallback/useEffect.
const stableToast = { show: () => {}, success: () => {}, error: () => {}, info: () => {}, warning: () => {} };
vi.mock('@/context/toastContext', () => ({
  useToast: () => stableToast,
  ToastProvider: ({ children }) => children,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useParams: () => authState.params,
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }) => <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a> }));
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
vi.mock('@/lib/accounting/xlsxIO', () => ({ downloadWorkbook: vi.fn(), readAllSheets: vi.fn(), readSheetRows: vi.fn() }));

const pages = import.meta.glob('../**/page.js');
const PAGE_PATHS = Object.keys(pages).sort();
const TYPES = process.env.SMOKE_TYPES ? process.env.SMOKE_TYPES.split(',') : BUSINESS_TYPES_SMOKE;
// Dueño en cada tipo + roles acotados (el barbero/profesional solo ve lo suyo;
// los guards deben devolver null sin romper, nunca un error).
const MATRIX = [
  ...TYPES.map((t) => [t, 'SUPER_ADMIN']),
  ...(process.env.SMOKE_TYPES
    ? []
    : [
        ['BARBERIA', 'BARBERO'],
        ['SERVICIOS', 'PROFESIONAL'],
        ['COMERCIO', 'ADMIN'],
        ['RESTAURANTE', 'MESERO'],
        ['COMERCIO', 'CAJA'],
      ]),
];

describe('Todas las pantallas del dashboard por tipo de negocio (humo)', () => {
  let errors;
  let rejections;
  const onRejection = (reason) => rejections.push(String(reason?.stack || reason));

  beforeAll(() => {
    installBrowserStubs();
  });

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

  for (const [type, role] of MATRIX) {
    describe(`${type} · ${role}`, () => {
      for (const p of PAGE_PATHS) {
        const route = p.replace(/^\.\.\//, '/dashboard/').replace(/\/page\.js$/, '').replace('/dashboard/page.js', '/dashboard');
        it(`${route}`, async () => {
          authState.usuario = fakeUser(type, role);
          localStorage.setItem('token', 'test-token');
          localStorage.setItem('usuario', JSON.stringify(authState.usuario));
          const mod = await pages[p]();
          const Page = mod.default;
          let boundaryError = null;
          await act(async () => {
            render(
              <RenderErrorBoundary onError={(e) => (boundaryError = e)}>
                <Page />
              </RenderErrorBoundary>,
            );
          });
          // Deja resolver las cargas iniciales (fetch simulado) y sus efectos.
          await act(async () => {
            await new Promise((r) => setTimeout(r, 60));
          });
          const broken = [
            ...(boundaryError
              ? [`RENDER: ${boundaryError.message} @ ${String(boundaryError.stack || '').split('\n').slice(1, 4).map((l) => l.trim()).join(' | ')}`]
              : []),
            ...(screen.queryByTestId('render-error') ? [`RENDER: ${screen.getByTestId('render-error').textContent}`] : []),
            ...errors.filter((e) => BREAKING.test(e)).map((e) => e.split('\n').slice(0, 4).join(' | ')),
            ...rejections.map((r) => `REJECTION: ${r.split('\n').slice(0, 3).join(' | ')}`),
          ];
          expect(broken).toEqual([]);
        });
      }
    });
  }
});
