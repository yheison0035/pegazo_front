import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { installFetchMock, installBrowserStubs, RenderErrorBoundary, BREAKING } from '@/test/pageHarness';

// Portal del contador: la portada (portafolio, llave, nueva empresa) se
// renderiza con el backend simulado por ruta.

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/contador',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }) => <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a> }));
vi.mock('@/context/authContext', () => ({
  useAuth: () => ({ usuario: null, loading: false, setUsuario: vi.fn(), logout: vi.fn() }),
}));

describe('Portal del contador · portada (humo)', () => {
  let errors;
  beforeAll(() => installBrowserStubs());
  beforeEach(() => {
    errors = [];
    installFetchMock();
    vi.spyOn(console, 'error').mockImplementation((...a) => errors.push(a.map(String).join(' ')));
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('sessionType', 'accountant');
    localStorage.setItem('contador', JSON.stringify({ id: 5, name: 'Contador Prueba', email: 'c@p.test', key: 'PZ-ABCD1234' }));
  });
  afterEach(() => vi.restoreAllMocks());

  it('/contador se renderiza', async () => {
    const Page = (await import('../page')).default;
    let boundaryError = null;
    await act(async () => {
      render(<RenderErrorBoundary onError={(e) => (boundaryError = e)}><Page /></RenderErrorBoundary>);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });
    const broken = [
      ...(boundaryError ? [`RENDER: ${boundaryError.message}`] : []),
      ...(screen.queryByTestId('render-error') ? ['RENDER'] : []),
      ...errors.filter((e) => BREAKING.test(e)),
    ];
    expect(broken).toEqual([]);
  });
});
