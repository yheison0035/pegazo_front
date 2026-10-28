import { describe, it, expect } from 'vitest';
import { isWeightUnit, isByWeightItem } from './weight';

// Regresión del incidente de carnicería: un producto guardado en KG se vendía
// solo por enteros porque el POS únicamente reconocía 'PESO'.
describe('isWeightUnit', () => {
  it.each(['PESO', 'KG', 'LIBRA', 'ARROBA', 'kg', 'libra'])('%s es por peso', (u) => {
    expect(isWeightUnit(u)).toBe(true);
  });
  it.each(['UNIDAD', 'unidad', '', null, undefined, 'CAJA'])('%s NO es por peso', (u) => {
    expect(isWeightUnit(u)).toBe(false);
  });
});

describe('isByWeightItem', () => {
  it('con unidad explícita manda la unidad, no el vertical', () => {
    expect(isByWeightItem({ unit: 'KG' }, false)).toBe(true);
    expect(isByWeightItem({ unit: 'UNIDAD' }, true)).toBe(false);
  });
  it('sin unidad manda el vertical (carnicería/fruver/súper = peso)', () => {
    expect(isByWeightItem({}, true)).toBe(true);
    expect(isByWeightItem({ unit: '' }, false)).toBe(false);
    expect(isByWeightItem(null, true)).toBe(true);
  });
});
