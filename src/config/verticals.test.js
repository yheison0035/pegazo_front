import { describe, it, expect } from 'vitest';
import { BUSINESS_TYPES } from './businessTypes';
import { MODULE_KEYS } from './modules';
import { getTerms } from './terminology';
import { getProductFields } from './verticalProfiles';
import { assignableRolesForType } from './roleLabels';

// Consistencia de las superficies que definen cada tipo de negocio. Cada test
// recorre TODOS los tipos: nada queda a medias para una vertical.
const TYPES = Object.keys(BUSINESS_TYPES);
const company = (type) => ({ type });

describe('Módulos por tipo de negocio', () => {
  it('todo módulo listado existe como módulo activable (sin claves huérfanas)', () => {
    for (const t of TYPES) {
      const huerfanos = BUSINESS_TYPES[t].filter((k) => !MODULE_KEYS.includes(k));
      expect({ tipo: t, huerfanos }).toEqual({ tipo: t, huerfanos: [] });
    }
  });
  it('un solo punto de cobro: POS (sales) o módulo propio (parking/storage), nunca ambos', () => {
    for (const t of TYPES) {
      const m = BUSINESS_TYPES[t];
      const propio = m.includes('parking') || m.includes('storage');
      expect({ tipo: t, ok: m.includes('sales') !== propio }).toEqual({ tipo: t, ok: true });
    }
  });
  it('quien tiene inventario tiene categorías y proveedores; quien tiene citas tiene servicios', () => {
    for (const t of TYPES) {
      const m = BUSINESS_TYPES[t];
      if (m.includes('inventory')) {
        expect({ tipo: t, cat: m.includes('categories'), prov: m.includes('providers') }).toEqual({ tipo: t, cat: true, prov: true });
      }
      if (m.includes('appointments')) expect({ tipo: t, serv: m.includes('services') }).toEqual({ tipo: t, serv: true });
    }
  });
});

describe('Vocabulario por tipo de negocio', () => {
  it('siempre devuelve el set completo (singular y plural de cada término)', () => {
    for (const t of TYPES) {
      const terms = getTerms(company(t));
      for (const k of ['attendant', 'service', 'product', 'sale', 'appointment', 'customer']) {
        expect({ tipo: t, k, ok: !!terms[k] && !!terms[`${k}Plural`] }).toEqual({ tipo: t, k, ok: true });
      }
    }
  });
  it('los tipos con agenda nombran a quien atiende (no el genérico "Vendedor")', () => {
    for (const t of TYPES.filter((x) => BUSINESS_TYPES[x].includes('appointments'))) {
      expect({ tipo: t, attendant: getTerms(company(t)).attendant }).not.toEqual({ tipo: t, attendant: 'Vendedor' });
    }
  });
  it('el override de la empresa manda sobre el del tipo', () => {
    expect(getTerms({ type: 'SERVICIOS', terminology: { attendant: 'Estilista' } }).attendant).toBe('Estilista');
  });
});

describe('Campos de producto por tipo de negocio', () => {
  it('BARBERIA es idéntica a SERVICIOS (regresión: mostraba marca/proveedor/código)', () => {
    expect(getProductFields('BARBERIA')).toEqual(getProductFields('SERVICIOS'));
  });
  it('las verticales por peso venden con decimales (variantType weight)', () => {
    for (const t of ['FRUVER', 'CARNICERIA', 'SUPERMERCADO']) {
      expect({ tipo: t, vt: getProductFields(t).variantType }).toEqual({ tipo: t, vt: 'weight' });
    }
  });
  it('ropa y calzado manejan color + talla', () => {
    for (const t of ['ROPA', 'CALZADO']) {
      expect(getProductFields(t)).toMatchObject({ variantType: 'color', size: true });
    }
  });
  it('la talla solo existe junto al color (nunca en simple/peso)', () => {
    for (const t of TYPES) {
      const f = getProductFields(t);
      if (f.size) expect({ tipo: t, vt: f.variantType }).toEqual({ tipo: t, vt: 'color' });
    }
  });
  it('un tipo desconocido cae al DEFAULT sin romper', () => {
    expect(getProductFields('NO_EXISTE').variantType).toBe('simple');
  });
});

describe('Roles por tipo de negocio', () => {
  it('todo tipo puede asignar ADMIN y CONTADOR', () => {
    for (const t of TYPES) {
      const r = assignableRolesForType(t);
      expect({ tipo: t, admin: r.includes('ADMIN'), contador: r.includes('CONTADOR') }).toEqual({ tipo: t, admin: true, contador: true });
    }
  });
  it('los tipos con agenda ofrecen el rol PROFESIONAL (regresión: barbería sin Barbero)', () => {
    for (const t of TYPES.filter((x) => BUSINESS_TYPES[x].includes('appointments'))) {
      expect({ tipo: t, ok: assignableRolesForType(t).includes('PROFESIONAL') }).toEqual({ tipo: t, ok: true });
    }
  });
  it('comida ofrece MESERO y COCINERO', () => {
    for (const t of ['RESTAURANTE', 'COMIDA_RAPIDA']) {
      expect(assignableRolesForType(t)).toEqual(expect.arrayContaining(['MESERO', 'COCINERO']));
    }
  });
});

describe('Verticales completadas 28/10/2026', () => {
  const NUEVOS = ['PANADERIA', 'PESCADERIA', 'LICORERA', 'PAPELERIA', 'PETSHOP', 'FERRETERIA', 'TECNOLOGIA',
    'ASADERO', 'BAR', 'PIZZERIA', 'GIMNASIO', 'TALLER_MECANICO', 'VETERINARIA', 'LAVANDERIA'];
  it('todos existen con módulos', () => {
    for (const t of NUEVOS) expect({ tipo: t, ok: (BUSINESS_TYPES[t] || []).length > 0 }).toEqual({ tipo: t, ok: true });
  });
  it('panadería, pescadería y asadero venden por peso; pañalería por talla/etapa', () => {
    for (const t of ['PANADERIA', 'PESCADERIA', 'ASADERO']) {
      expect({ tipo: t, vt: getProductFields(t).variantType }).toEqual({ tipo: t, vt: 'weight' });
    }
    expect(getProductFields('PANALERIA')).toMatchObject({ variantType: 'color', size: true });
  });
  it('panadería tiene proveedores, marcas e insumos (producción básica)', () => {
    expect(getProductFields('PANADERIA')).toMatchObject({ provider: true, brand: true });
    expect(BUSINESS_TYPES.PANADERIA).toEqual(expect.arrayContaining(['providers', 'brands', 'supplies']));
  });
  it('gimnasio tiene membresías y agenda; veterinaria tiene historia clínica y agenda', () => {
    expect(BUSINESS_TYPES.GIMNASIO).toEqual(expect.arrayContaining(['memberships', 'appointments', 'services']));
    expect(BUSINESS_TYPES.VETERINARIA).toEqual(expect.arrayContaining(['clinical', 'appointments', 'services']));
  });
  it('quien atiende tiene nombre propio en los nuevos de agenda', () => {
    expect(getTerms(company('GIMNASIO')).attendant).toBe('Entrenador');
    expect(getTerms(company('TALLER_MECANICO')).attendant).toBe('Mecánico');
    expect(getTerms(company('VETERINARIA')).attendant).toBe('Veterinario');
  });
  it('los de comida nuevos tienen mesas y cocina, y su catálogo se llama Menú/Carta', () => {
    for (const t of ['ASADERO', 'BAR', 'PIZZERIA']) {
      expect(BUSINESS_TYPES[t]).toEqual(expect.arrayContaining(['mesas', 'kitchen']));
      expect(['Menú', 'Carta']).toContain(getTerms(company(t)).catalogLabel);
    }
  });
});
