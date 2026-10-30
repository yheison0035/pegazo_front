import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
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
import WebsitePage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

// El backend devuelve la configuración SIN envoltorio {data}.
const CONFIG = {
  websiteEnabled: true,
  domain: 'tienda.negocio.co',
  name: 'Negocio Prueba',
  // Identidad y diseño van en la raíz; el contacto en websiteSetting.
  websiteName: 'Mi Tienda Online',
  favicon: '',
  theme: 'classic',
  fontFamily: 'Inter',
  primaryColor: '#111827',
  secondaryColor: '#f97316',
  accentColor: '#f97316',
  ctaColor: '#f97316',
  heroTitle: 'Bienvenido',
  heroSubtitle: 'Lo mejor para ti',
  websiteSetting: {
    whatsapp: '3001112233',
    schedule: '8:00 AM - 6:00 PM',
    instagram: '',
    facebook: '',
    tiktok: '',
    ecommerceLocalId: 1,
  },
  websiteBanners: [
    { id: 1, image: 'https://img/banner1.jpg', title: 'Promo', subtitle: 'Hasta 30%', ctaText: 'Ver', link: '/ofertas', active: true, order: 1 },
    { id: 2, image: 'https://img/banner2.jpg', title: 'Nuevo', subtitle: '', ctaText: '', link: '', active: false, order: 2 },
  ],
};

function websiteApi(config = CONFIG) {
  return installApi([
    on('GET', /^\/website\/admin\/config$/, config),
    on('PUT', /^\/website\/admin\/config$/, ok({})),
    on('POST', /^\/website\/admin\/banners$/, ok({ id: 3 })),
    on('PUT', /^\/website\/admin\/banners\/\d+$/, ok({})),
    on('DELETE', /^\/website\/admin\/banners\/\d+$/, ok()),
    on('GET', /^\/website\/edit-token$/, ok({ url: 'https://tienda.negocio.co/?edit=tok' })),
    on('GET', /^\/company\/store-payments$/, ok({ storePaymentMethods: ['COD'], wompiReady: false })),
    on('PATCH', /^\/company\/store-payments$/, (c) => ok({ storePaymentMethods: c.body.storePaymentMethods })),
    on('GET', /^\/company\/store-shipping$/, ok({ storeShipping: { shipping: { enabled: true, fee: 15000, freeFrom: 150000 }, local_delivery: { enabled: false, fee: 0, freeFrom: '' }, pickup: { enabled: true }, dine_in: { enabled: false }, freeFrom: 150000, carriers: [] } })),
    on('PATCH', /^\/company\/store-shipping$/, ok({})),
    on('GET', /^\/company\/wompi$/, ok({ wompiPublicKey: 'pub_prod_123', hasIntegrity: false, hasEvents: false, hasPrivate: false })),
    on('PATCH', /^\/company\/wompi$/, ok({ wompiPublicKey: 'pub_prod_NEW', hasIntegrity: true })),
    ...baseRoutes(),
  ]);
}

async function openWebsite(api, tab) {
  await renderPage(<WebsitePage />);
  await waitForCall(api, 'GET', /^\/website\/admin\/config$/);
  await settle();
  if (tab) await click(button(tab));
  await settle();
}

describe('Tienda online · configuración', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ company: { websiteEnabled: true, domain: 'tienda.negocio.co' } });
    api = websiteApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('si la tienda no está habilitada lo explica y no muestra el formulario', async () => {
    api = websiteApi({ ...CONFIG, websiteEnabled: false });
    await openWebsite(api);
    expect(screen.getByText('Tu tienda online todavía no está habilitada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Guardar cambios/ })).toBeNull();
  });

  it('carga la configuración en el formulario y guarda con PUT (sede como número)', async () => {
    await openWebsite(api, 'Identidad');
    const name = await screen.findByDisplayValue('Mi Tienda Online');
    await typeInto(name, 'Mi Tienda Renovada');
    await click(button(/Guardar cambios/));
    const call = await waitForCall(api, 'PUT', /^\/website\/admin\/config$/);
    expect(call.body).toMatchObject({ websiteName: 'Mi Tienda Renovada', theme: 'classic', ecommerceLocalId: 1 });
    await expectToast('success', 'Tienda actualizada');
  });

  it('la pestaña Contacto guarda WhatsApp, horario y redes', async () => {
    await openWebsite(api, 'Contacto');
    await typeInto(placeholder('8:00 AM - 6:00 PM'), '9:00 AM - 7:00 PM');
    await typeInto(placeholder('https://instagram.com/tu-tienda'), 'https://instagram.com/mitienda');
    await click(button(/Guardar cambios/));
    const call = await waitForCall(api, 'PUT', /^\/website\/admin\/config$/);
    expect(call.body).toMatchObject({ schedule: '9:00 AM - 7:00 PM', instagram: 'https://instagram.com/mitienda', whatsapp: '3001112233' });
  });

  it('un error del backend al guardar se avisa', async () => {
    api.set('PUT', /^\/website\/admin\/config$/, fail(400, 'El dominio ya está en uso'));
    await openWebsite(api);
    await click(button(/Guardar cambios/));
    await waitForCall(api, 'PUT', /^\/website\/admin\/config$/);
    await expectToast('error', 'dominio ya está en uso');
  });

  it('el barbero no entra a la tienda online', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    websiteApi();
    await renderPage(<WebsitePage />);
    await settle();
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});

describe('Tienda online · banners de portada', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ company: { websiteEnabled: true, domain: 'tienda.negocio.co' } });
    api = websiteApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista los banners y permite mostrarlos u ocultarlos', async () => {
    await openWebsite(api, 'Portada');
    expect(await screen.findByText('Promo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Visible' })).toBeInTheDocument();
    await click(screen.getByRole('button', { name: 'Oculto' }));
    const call = await waitForCall(api, 'PUT', /^\/website\/admin\/banners\/2$/);
    expect(call.body).toEqual({ active: true });
    await waitForCall(api, 'GET', /^\/website\/admin\/config$/, { count: 2 });
  });

  it('editar un banner guarda sus textos y enlace', async () => {
    await openWebsite(api, 'Portada');
    await screen.findByText('Promo');
    await click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    const title = await screen.findByDisplayValue('Promo');
    await typeInto(title, 'Promo de marzo');
    const card = title.closest('div.rounded-2xl') || title.parentElement.parentElement.parentElement.parentElement;
    await click(within(card).getByRole('button', { name: /Guardar/ }));
    const call = await waitForCall(api, 'PUT', /^\/website\/admin\/banners\/1$/);
    expect(call.body).toMatchObject({ title: 'Promo de marzo' });
    await expectToast('success', 'Banner actualizado');
  });

  it('agregar un banner exige la imagen primero', async () => {
    await openWebsite(api, 'Portada');
    await screen.findByText('Promo');
    await click(button(/Agregar banner/));
    await expectToast('warning', 'Sube primero la imagen del banner');
    expect(api.count('POST', /^\/website\/admin\/banners$/)).toBe(0);
  });

  it('eliminar un banner pide confirmación y llama DELETE', async () => {
    await openWebsite(api, 'Portada');
    await screen.findByText('Promo');
    await click(screen.getAllByLabelText('Eliminar banner')[0]);
    const confirm = screen.getAllByRole('button', { name: 'Eliminar' }).pop();
    await click(confirm);
    await waitForCall(api, 'DELETE', /^\/website\/admin\/banners\/1$/);
    await expectToast('success', 'Banner eliminado');
  });
});

describe('Tienda online · pagos y envíos', () => {
  let api;
  beforeEach(() => {
    resetBehavior({ company: { websiteEnabled: true, domain: 'tienda.negocio.co' } });
    api = websiteApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('activar o desactivar un medio de pago de la tienda guarda la lista completa', async () => {
    await openWebsite(api, 'Pagos');
    await waitForCall(api, 'GET', /^\/company\/store-payments$/);
    const switches = await screen.findAllByRole('switch');
    expect(switches.length).toBeGreaterThanOrEqual(2);
    // El primero es "Pago contra entrega" (activo): al apagarlo queda vacío.
    await click(switches[0]);
    const call = await waitForCall(api, 'PATCH', /^\/company\/store-payments$/);
    expect(call.body).toEqual({ storePaymentMethods: [] });
  });

  it('guardar llaves de Wompi manda la pública y solo los secretos escritos', async () => {
    await openWebsite(api, 'Pagos');
    await waitForCall(api, 'GET', /^\/company\/wompi$/);
    const pub = await screen.findByPlaceholderText('pub_prod_xxx');
    await typeInto(pub, 'pub_prod_NEW');
    await click(button(/Guardar pagos/));
    const call = await waitForCall(api, 'PATCH', /^\/company\/wompi$/);
    expect(call.body).toEqual({ wompiPublicKey: 'pub_prod_NEW' });
  });

  it('la configuración de envíos precarga y guarda tarifas, recogida y transportadoras', async () => {
    await openWebsite(api, 'Envíos');
    await waitForCall(api, 'GET', /^\/company\/store-shipping$/);
    const btn = await screen.findByRole('button', { name: /Guardar envíos/ });
    await click(btn);
    const call = await waitForCall(api, 'PATCH', /^\/company\/store-shipping$/);
    expect(call.body.storeShipping).toMatchObject({
      shipping: { enabled: true, fee: 15000, freeFrom: 150000 },
      local_delivery: { enabled: false, fee: 0, freeFrom: null },
      pickup: { enabled: true },
      freeFrom: 150000,
    });
    expect(Array.isArray(call.body.storeShipping.carriers)).toBe(true);
  });
});
