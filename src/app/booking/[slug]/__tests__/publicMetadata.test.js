import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildPublicMetadata } from '../publicMetadata';

// La vista previa al compartir (WhatsApp/redes) debe cambiar según el tipo de
// página pública: booking → citas, catalog → catálogo/pedido, menu → carta.
describe('buildPublicMetadata · mensaje y URL según el tipo', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { name: 'Barbería Prueba', logo: 'https://x/logo.png' } }),
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('booking: habla de reservar la cita y usa /booking/', async () => {
    const m = await buildPublicMetadata('barberia-prueba', 'booking');
    expect(m.description).toBe('Reserva tu cita en Barbería Prueba fácil y rápido.');
    expect(m.openGraph.url).toBe('https://pegazo.co/booking/barberia-prueba');
    expect(m.twitter.description).toBe('Reserva tu cita ahora mismo');
    expect(m.openGraph.title).toBe('Barbería Prueba');
  });

  it('catalog: habla del catálogo/pedido (NO "reserva tu cita") y usa /catalog/', async () => {
    const m = await buildPublicMetadata('mi-tienda', 'catalog');
    expect(m.description).toBe('Explora el catálogo de Barbería Prueba y haz tu pedido fácil y rápido.');
    expect(m.description).not.toMatch(/reserva tu cita/i);
    expect(m.openGraph.url).toBe('https://pegazo.co/catalog/mi-tienda');
    expect(m.twitter.description).toBe('Mira nuestro catálogo');
  });

  it('menu: habla de la carta/pedido y usa /menu/', async () => {
    const m = await buildPublicMetadata('mi-restaurante', 'menu');
    expect(m.description).toBe('Mira la carta de Barbería Prueba y haz tu pedido fácil y rápido.');
    expect(m.description).not.toMatch(/reserva tu cita/i);
    expect(m.openGraph.url).toBe('https://pegazo.co/menu/mi-restaurante');
    expect(m.twitter.description).toBe('Mira nuestra carta');
  });

  it('sin config del negocio, cae a un nombre neutro por tipo (no "Agenda tu cita" en catálogo)', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    const booking = await buildPublicMetadata('x', 'booking');
    const catalog = await buildPublicMetadata('x', 'catalog');
    expect(booking.openGraph.title).toBe('Agenda tu cita');
    expect(catalog.openGraph.title).toBe('Catálogo');
  });
});
