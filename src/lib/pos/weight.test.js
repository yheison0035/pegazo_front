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

import { stockLabel } from './weight';
describe('stockLabel', () => {
  it('muestra la unidad en productos por peso y el número solo en unidades', () => {
    expect(stockLabel(12, 'KG')).toBe('12 kg');
    expect(stockLabel(3, 'libra')).toBe('3 lb');
    expect(stockLabel(2.5, 'ARROBA')).toBe('2.5 @');
    expect(stockLabel(7, 'UNIDAD')).toBe(7);
    expect(stockLabel(undefined, 'KG')).toBe('--- kg');
  });
});
