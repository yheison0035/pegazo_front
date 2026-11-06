import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  authState,
  fakeUser,
  installFetchMock,
  installBrowserStubs,
} from '@/test/pageHarness';

// En el Inicio, debajo del "Hola, <nombre>" debe aparecer el nombre del LOCAL
// asignado al usuario (no la empresa), cayendo a la empresa si no tiene local.
vi.mock('@/context/authContext', () => ({
  useAuth: () => ({ usuario: authState.usuario, loading: false, setUsuario: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }) => children,
}));
const stableToast = { show: () => {}, success: () => {}, error: () => {}, info: () => {}, warning: () => {} };
vi.mock('@/context/toastContext', () => ({
  useToast: () => stableToast,
  ToastProvider: ({ children }) => children,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }) => <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a> }));
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

import DashboardHome from '../page';

async function renderHome() {
  await act(async () => {
    render(<DashboardHome />);
  });
  // Deja resolver las cargas iniciales simuladas.
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe('Inicio · saludo con el local asignado', () => {
  beforeAll(() => installBrowserStubs());
  beforeEach(() => {
    installFetchMock();
    localStorage.setItem('token', 'test-token');
  });
  afterEach(() => vi.restoreAllMocks());

  it('muestra el nombre del local asignado debajo del saludo', async () => {
    authState.usuario = { ...fakeUser('BARBERIA', 'BARBERO'), local: { id: 1, name: 'Sede Centro' } };
    await renderHome();
    expect(await screen.findByText(/Hola/)).toBeInTheDocument();
    expect(screen.getByText(/Sede Centro/)).toBeInTheDocument();
    // Ya no muestra la empresa en esa línea.
    expect(screen.queryByText(/Negocio Prueba · Este es tu panel/)).toBeNull();
  });

  it('si el usuario no tiene local asignado, cae al nombre de la empresa', async () => {
    const u = fakeUser('COMERCIO', 'SUPER_ADMIN');
    delete u.local;
    authState.usuario = u;
    await renderHome();
    // Acotado a la línea del saludo (la empresa también sale en el asistente).
    expect(
      await screen.findByText(/Negocio Prueba · Este/),
    ).toBeInTheDocument();
  });
});
