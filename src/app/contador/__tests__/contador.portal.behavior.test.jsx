import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  installApi,
  on,
  ok,
  fail,
  baseRoutes,
  resetBehavior,
  renderPage,
  screen,
  waitFor,
  click,
  typeInto,
  button,
  placeholder,
  waitForCall,
} from '@/test/behaviorHarness';
import ContadorPortal from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,QR')) } }));

const ME = { id: 5, name: 'Contador Prueba', email: 'c@p.test', accountantKey: 'PZ-ABCD1234' };
const PORTFOLIO = [
  { companyId: 10, name: 'NEGOCIO PEGAZO', nit: '901222333', type: 'COMERCIO', logo: '', accountingOnly: false },
  { companyId: 11, name: 'CLIENTE EXTERNO', nit: '800111222', type: 'SERVICIOS', logo: '', accountingOnly: true },
];

function portalApi(portfolio = PORTFOLIO) {
  return installApi([
    on('GET', /^\/accountant\/me$/, ok(ME)),
    on('GET', /^\/accountant\/portfolio$/, ok(portfolio)),
    on('POST', /^\/accountant\/companies$/, ok({ companyId: 12 })),
    ...baseRoutes(),
  ]);
}

describe('Portal del contador · portafolio', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'CONTADOR' });
    api = portalApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('saluda al contador, muestra su llave y el portafolio con enlaces y conteos', async () => {
    await renderPage(<ContadorPortal />);
    await waitForCall(api, 'GET', /^\/accountant\/me$/);
    await waitForCall(api, 'GET', /^\/accountant\/portfolio$/);
    expect(await screen.findByText(/Hola, Contador Prueba/)).toBeInTheDocument();
    expect(screen.getByText('PZ-ABCD1234')).toBeInTheDocument();
    expect(screen.getByText('2 empresas')).toBeInTheDocument();
    expect(screen.getByText('1 Pegazo')).toBeInTheDocument();
    expect(screen.getByText('1 externas')).toBeInTheDocument();
    expect(screen.getByText('NEGOCIO PEGAZO').closest('a')).toHaveAttribute('href', '/contador/empresa/10');
    expect(screen.getByText('CLIENTE EXTERNO').closest('a')).toHaveAttribute('href', '/contador/empresa/11');
    expect(screen.getByText('Solo contabilidad')).toBeInTheDocument();
  });

  it('el buscador filtra por nombre o NIT en el cliente', async () => {
    await renderPage(<ContadorPortal />);
    await screen.findByText('NEGOCIO PEGAZO');
    await typeInto(placeholder('Buscar empresa o NIT…'), 'externo');
    await waitFor(() => expect(screen.queryByText('NEGOCIO PEGAZO')).toBeNull());
    expect(screen.getByText('CLIENTE EXTERNO')).toBeInTheDocument();
    await typeInto(placeholder('Buscar empresa o NIT…'), '901222');
    await waitFor(() => expect(screen.getByText('NEGOCIO PEGAZO')).toBeInTheDocument());
    expect(screen.queryByText('CLIENTE EXTERNO')).toBeNull();
  });

  it('crear una empresa externa envía el nombre en mayúsculas y recarga', async () => {
    await renderPage(<ContadorPortal />);
    await screen.findByText('NEGOCIO PEGAZO');
    await click(button(/Nueva empresa/));
    expect(await screen.findByText('Nueva empresa', { selector: 'h2' })).toBeInTheDocument();
    await typeInto(placeholder('EJ: FERRETERÍA EL TORNILLO'), 'ferretería el tornillo');
    expect(placeholder('EJ: FERRETERÍA EL TORNILLO').value).toBe('FERRETERÍA EL TORNILLO');
    await typeInto(placeholder('Opcional'), '901999888');
    await typeInto(screen.getByRole('combobox'), 'SIMPLE');
    await click(button('Crear empresa'));
    const call = await waitForCall(api, 'POST', /^\/accountant\/companies$/);
    expect(call.body).toEqual({ name: 'FERRETERÍA EL TORNILLO', nit: '901999888', taxRegime: 'SIMPLE' });
    await waitForCall(api, 'GET', /^\/accountant\/portfolio$/, { count: 2 });
    expect(screen.queryByText('Nueva empresa', { selector: 'h2' })).toBeNull();
  });

  it('el botón de crear queda deshabilitado sin nombre', async () => {
    await renderPage(<ContadorPortal />);
    await screen.findByText('NEGOCIO PEGAZO');
    await click(button(/Nueva empresa/));
    await screen.findByText('Nueva empresa', { selector: 'h2' });
    expect(button('Crear empresa')).toBeDisabled();
    expect(api.count('POST', /^\/accountant\/companies$/)).toBe(0);
  });

  it('sin empresas invita a crear o compartir la llave', async () => {
    api = portalApi([]);
    await renderPage(<ContadorPortal />);
    await waitForCall(api, 'GET', /^\/accountant\/portfolio$/);
    expect(await screen.findByText(/Aún no tienes empresas/)).toBeInTheDocument();
    expect(screen.getByText('0 empresas')).toBeInTheDocument();
  });
});
