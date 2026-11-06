import { describe, it, expect } from 'vitest';
import { resolveBranding } from '@/utils/resolveBranding';

const company = {
  name: 'Empresa S.A.S',
  logo: 'empresa.png',
  nit: '900',
  email: 'empresa@correo.com',
  phone: '111',
};
const local = {
  name: 'Sede Centro',
  logo: 'sede.png',
  nit: '901',
  email: 'sede@correo.com',
  phone: '222',
  address: 'Calle 1',
};

describe('resolveBranding (facturas/comprobantes)', () => {
  it('una sola sede: usa los datos de la empresa', () => {
    const b = resolveBranding({ company: { ...company, localCount: 1 } }, local);
    expect(b.name).toBe('Empresa S.A.S');
    expect(b.logo).toBe('empresa.png');
    expect(b.nit).toBe('900');
    // La dirección impresa sí es la del local de la venta cuando existe.
    expect(b.address).toBe('Calle 1');
  });

  it('varias sedes: usa los datos del local de la venta', () => {
    const b = resolveBranding({ company: { ...company, localCount: 3 } }, local);
    expect(b.name).toBe('Sede Centro');
    expect(b.logo).toBe('sede.png');
    expect(b.nit).toBe('901');
    expect(b.email).toBe('sede@correo.com');
    expect(b.phone).toBe('222');
  });

  it('varias sedes con local incompleto: cae a la empresa dato a dato', () => {
    const b = resolveBranding(
      { company: { ...company, localCount: 3 } },
      { name: 'Sede Norte', address: 'Av 2' },
    );
    expect(b.name).toBe('Sede Norte');
    expect(b.logo).toBe('empresa.png');
    expect(b.nit).toBe('900');
    expect(b.address).toBe('Av 2');
  });
});
