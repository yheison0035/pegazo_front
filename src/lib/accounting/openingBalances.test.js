import { describe, it, expect } from 'vitest';
import { buildOpeningEntry, openingTotals, pickEquityAccount } from './openingBalances';

const accounts = [
  { code: '1105', name: 'CAJA', type: 'ASSET' },
  { code: '1435', name: 'INVENTARIO', type: 'ASSET' },
  { code: '2205', name: 'PROVEEDORES', type: 'LIABILITY' },
  { code: '3115', name: 'CAPITAL', type: 'EQUITY' },
];

describe('openingBalances', () => {
  it('elige capital (3115) o la primera de patrimonio', () => {
    expect(pickEquityAccount(accounts)).toBe('3115');
    expect(pickEquityAccount([{ code: '3999', type: 'EQUITY' }])).toBe('3999');
    expect(pickEquityAccount([])).toBe('');
  });

  it('calcula totales y diferencia', () => {
    expect(openingTotals([{ debit: 100 }, { credit: 30 }])).toEqual({ debit: 100, credit: 30, diff: 70 });
  });

  it('cuadra la diferencia contra patrimonio (crédito si sobran débitos)', () => {
    const e = buildOpeningEntry({
      date: '2026-01-01',
      rows: [
        { accountCode: '1105', debit: 2000000 },
        { accountCode: '1435', debit: 8000000 },
        { accountCode: '2205', credit: 3000000 },
      ],
      equityAccount: '3115',
      accounts,
    });
    expect(e.reference).toBe('APERTURA');
    expect(e.lines).toHaveLength(4);
    expect(e.lines[3]).toEqual({ accountCode: '3115', accountName: 'CAPITAL', debit: 0, credit: 7000000 });
    const d = e.lines.reduce((s, l) => s + l.debit, 0);
    const c = e.lines.reduce((s, l) => s + l.credit, 0);
    expect(d).toBe(c);
  });

  it('si la cuenta de patrimonio ya venía, ajusta su saldo neto', () => {
    const e = buildOpeningEntry({
      date: '2026-01-01',
      rows: [
        { accountCode: '1105', debit: 1000 },
        { accountCode: '3115', credit: 400 },
      ],
      equityAccount: '3115',
      accounts,
    });
    expect(e.lines).toEqual([
      { accountCode: '1105', accountName: null, debit: 1000, credit: 0 },
      { accountCode: '3115', accountName: null, debit: 0, credit: 1000 },
    ]);
  });

  it('no toca nada si ya cuadra y exige cuenta de patrimonio si hay diferencia', () => {
    const ok = buildOpeningEntry({
      date: '2026-01-01',
      rows: [{ accountCode: '1105', debit: 10 }, { accountCode: '2205', credit: 10 }],
      equityAccount: '',
      accounts,
    });
    expect(ok.lines).toHaveLength(2);
    expect(() =>
      buildOpeningEntry({ date: '2026-01-01', rows: [{ accountCode: '1105', debit: 10 }], equityAccount: '', accounts }),
    ).toThrow(/patrimonio/);
  });
});
