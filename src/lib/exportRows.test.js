import { describe, it, expect } from 'vitest';
import { flattenRow, toCsvRows } from './exportRows';

describe('exportRows', () => {
  it('aplana objetos anidados y resume listas', () => {
    expect(flattenRow({ a: 1, b: { c: 'x', d: { e: null } }, f: [{ name: 'N1' }, { code: 'C2' }, 3] }))
      .toEqual({ a: 1, 'b.c': 'x', 'b.d.e': '', f: 'N1 | C2 | 3' });
  });
  it('lista de objetos → una fila por objeto', () => {
    expect(toCsvRows([{ code: '1105', balance: 5 }, { code: '2408', balance: -1 }])).toEqual([{ code: '1105', balance: 5 }, { code: '2408', balance: -1 }]);
  });
  it('objeto con lista principal → exporta la lista; objeto de totales → concepto/valor', () => {
    expect(toCsvRows({ year: 2026, deadlines: [{ title: 'IVA', dueDate: '2026-03-10' }] })).toEqual([{ title: 'IVA', dueDate: '2026-03-10' }]);
    expect(toCsvRows({ iva: { generado: 10, descontable: 4 } })).toEqual([{ concepto: 'iva.generado', valor: 10 }, { concepto: 'iva.descontable', valor: 4 }]);
  });
  it('vacíos no rompen', () => {
    expect(toCsvRows(null)).toEqual([]);
    expect(toCsvRows([])).toEqual([]);
  });
});
