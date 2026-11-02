import { describe, it, expect } from 'vitest';
import { validateBookingContact } from './bookingValidation';

describe('validateBookingContact · nombre completo', () => {
  it('exige nombre y apellido (dos palabras de 2+ letras)', () => {
    expect(validateBookingContact({ name: 'Ana', email: 'a@b.co', phone: '3001112233' }).field).toBe('name');
    expect(validateBookingContact({ name: 'Ana P', email: 'a@b.co', phone: '3001112233' }).field).toBe('name');
    expect(validateBookingContact({ name: '  ', email: 'a@b.co', phone: '3001112233' }).field).toBe('name');
  });
  it('acepta un nombre completo y lo normaliza (espacios)', () => {
    const r = validateBookingContact({ name: '  Ana   María  Pérez ', email: 'a@b.co', phone: '3001112233' });
    expect(r.ok).toBe(true);
    expect(r.name).toBe('Ana María Pérez');
  });
});

describe('validateBookingContact · correo', () => {
  it('rechaza correos inválidos', () => {
    for (const email of ['', 'ana', 'ana@', 'ana@b', 'ana@b.c', 'a b@c.co', 'ana@@b.co']) {
      expect(validateBookingContact({ name: 'Ana Pérez', email, phone: '3001112233' }).field).toBe('email');
    }
  });
  it('acepta un correo válido y lo pasa a minúsculas', () => {
    const r = validateBookingContact({ name: 'Ana Pérez', email: 'ANA.Perez@Correo.com', phone: '3001112233' });
    expect(r.ok).toBe(true);
    expect(r.email).toBe('ana.perez@correo.com');
  });
});

describe('validateBookingContact · celular', () => {
  it('rechaza celulares muy cortos o muy largos', () => {
    expect(validateBookingContact({ name: 'Ana Pérez', email: 'a@b.co', phone: '12345' }).field).toBe('phone');
    expect(validateBookingContact({ name: 'Ana Pérez', email: 'a@b.co', phone: '12345678901234567' }).field).toBe('phone');
  });
  it('acepta un celular con formato y devuelve solo dígitos', () => {
    const r = validateBookingContact({ name: 'Ana Pérez', email: 'a@b.co', phone: '+57 300 111 2233' });
    expect(r.ok).toBe(true);
    expect(r.phone).toBe('573001112233');
  });
});
