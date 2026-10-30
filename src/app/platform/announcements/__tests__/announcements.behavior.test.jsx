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
  router,
} from '@/test/behaviorHarness';
import AnnouncementsPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const ITEMS = [
  { id: 1, title: 'Nueva función', body: 'Ya puedes generar fichas con IA.', level: 'SUCCESS', audience: 'ALL', types: [], plans: [], ctaLabel: 'Ver más', ctaUrl: 'https://pegazo.co/novedades', active: true, startsAt: null, endsAt: null },
  { id: 2, title: 'Mantenimiento', body: 'El sábado habrá una ventana de mantenimiento.', level: 'WARNING', audience: 'PLAN', types: [], plans: ['ORBITA'], ctaLabel: null, ctaUrl: null, active: false, startsAt: null, endsAt: null },
];

function announcementsApi() {
  return installApi([
    on('GET', /^\/announcements$/, ok(ITEMS)),
    on('POST', /^\/announcements$/, ok({ id: 3 })),
    on('PUT', /^\/announcements\/\d+$/, ok({ id: 1 })),
    on('DELETE', /^\/announcements\/\d+$/, ok({ id: 1 })),
    ...baseRoutes(),
  ]);
}

describe('Plataforma · Comunicados', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ role: 'SUPER_PLATFORM_ADMIN' });
    api = announcementsApi();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista los comunicados con nivel, audiencia, botón y estado', async () => {
    await renderPage(<AnnouncementsPage />);
    await waitForCall(api, 'GET', /^\/announcements$/);
    expect(await screen.findByText('Nueva función')).toBeInTheDocument();
    expect(screen.getByText('Novedad')).toBeInTheDocument();
    expect(screen.getByText('Todos los negocios')).toBeInTheDocument();
    expect(screen.getByText(/Botón: Ver más → https:\/\/pegazo\.co\/novedades/)).toBeInTheDocument();
    expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    expect(screen.getByText('Aviso')).toBeInTheDocument();
    expect(screen.getByText('Planes: ORBITA')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('publicar exige título y mensaje; con audiencia por tipo envía los tipos marcados', async () => {
    await renderPage(<AnnouncementsPage />);
    await screen.findByText('Nueva función');
    await click(button(/Nuevo comunicado/));
    expect(await screen.findByText('Nuevo comunicado', { selector: 'h2' })).toBeInTheDocument();
    await click(button('Publicar comunicado'));
    expect(await screen.findByText('El título y el mensaje son obligatorios.')).toBeInTheDocument();
    expect(api.count('POST', /^\/announcements$/)).toBe(0);
    await typeInto(placeholder('Ej: Nueva función disponible'), '  Cierre de año  ');
    await typeInto(placeholder(/Escribe el comunicado/), 'Revisa tus inventarios antes del 31.');
    const [level, audience] = screen.getAllByRole('combobox');
    await typeInto(level, 'CRITICAL');
    await typeInto(audience, 'TYPE');
    await click(button('COMERCIO'));
    await click(button('ROPA'));
    await click(button('Publicar comunicado'));
    const call = await waitForCall(api, 'POST', /^\/announcements$/);
    expect(call.body).toEqual({ title: 'Cierre de año', body: 'Revisa tus inventarios antes del 31.', level: 'CRITICAL', audience: 'TYPE', types: ['COMERCIO', 'ROPA'], plans: [], active: true });
    await waitForCall(api, 'GET', /^\/announcements$/, { count: 2 });
    expect(screen.queryByText('Nuevo comunicado', { selector: 'h2' })).toBeNull();
  });

  it('editar precarga el comunicado y guarda los cambios', async () => {
    await renderPage(<AnnouncementsPage />);
    await screen.findByText('Nueva función');
    await click(screen.getAllByLabelText('Editar')[0]);
    expect(await screen.findByText('Editar comunicado')).toBeInTheDocument();
    const title = screen.getByDisplayValue('Nueva función');
    await typeInto(title, 'Nueva función de IA');
    await click(screen.getByLabelText(/Activo \(visible/));
    await click(button('Guardar cambios'));
    const call = await waitForCall(api, 'PUT', /^\/announcements\/1$/);
    expect(call.body).toMatchObject({ title: 'Nueva función de IA', level: 'SUCCESS', audience: 'ALL', types: [], plans: [], ctaLabel: 'Ver más', ctaUrl: 'https://pegazo.co/novedades', active: false });
    await waitForCall(api, 'GET', /^\/announcements$/, { count: 2 });
  });

  it('cancelar cierra el editor sin enviar', async () => {
    await renderPage(<AnnouncementsPage />);
    await screen.findByText('Nueva función');
    await click(button(/Nuevo comunicado/));
    await screen.findByText('Nuevo comunicado', { selector: 'h2' });
    await click(button('Cancelar'));
    expect(screen.queryByText('Nuevo comunicado', { selector: 'h2' })).toBeNull();
    expect(api.count('POST', /^\/announcements$/)).toBe(0);
  });

  it('eliminar pide confirmación y quita la tarjeta', async () => {
    window.confirm.mockReturnValueOnce(false);
    await renderPage(<AnnouncementsPage />);
    await screen.findByText('Nueva función');
    await click(screen.getAllByLabelText('Eliminar')[0]);
    expect(api.count('DELETE', /^\/announcements\/\d+$/)).toBe(0);
    await click(screen.getAllByLabelText('Eliminar')[0]);
    await waitForCall(api, 'DELETE', /^\/announcements\/1$/);
    await waitFor(() => expect(screen.queryByText('Nueva función')).toBeNull());
    expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
  });

  it('si el backend rechaza guardar o eliminar, se avisa', async () => {
    api.set('DELETE', /^\/announcements\/\d+$/, fail(400, 'No se puede eliminar'));
    api.set('POST', /^\/announcements$/, fail(400, 'Título repetido'));
    await renderPage(<AnnouncementsPage />);
    await screen.findByText('Nueva función');
    await click(screen.getAllByLabelText('Eliminar')[0]);
    await waitForCall(api, 'DELETE', /^\/announcements\/1$/);
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('No se puede eliminar'));
    expect(screen.getByText('Nueva función')).toBeInTheDocument();
    await click(button(/Nuevo comunicado/));
    await typeInto(placeholder('Ej: Nueva función disponible'), 'Nueva función');
    await typeInto(placeholder(/Escribe el comunicado/), 'Repetido');
    await click(button('Publicar comunicado'));
    expect(await screen.findByText('Título repetido')).toBeInTheDocument();
  });

  it('solo el administrador de plataforma entra', async () => {
    vi.restoreAllMocks();
    resetBehavior({ role: 'SUPER_ADMIN' });
    announcementsApi();
    await renderPage(<AnnouncementsPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
