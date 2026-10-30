import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { accountsSheet } from './exportPackage';
import { toAccountRows, parseMoneyCell, toEntryRows } from './importSheets';

// ---------------------------------------------------------------------------
// Mismo blindaje que en inventario, para el módulo de CONTABILIDAD: al exportar
// el plan de cuentas y reimportarlo, y al importar asientos con montos, no se
// debe perder ninguna cuenta ni desajustar los valores (débito/crédito).
// Usa la librería de Excel REAL (sin mocks).
// ---------------------------------------------------------------------------

// Exporta un plan de cuentas con XLSX real y lo relee como filas-objeto (igual
// que readSheetRows del importador contable).
function exportAccountsThenReopen(accounts) {
  const rows = accountsSheet(accounts); // array de arrays con encabezado
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plan de cuentas');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const wb2 = XLSX.read(buf, { type: 'array' });
  const ws2 = wb2.Sheets[wb2.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws2, { raw: true, defval: '' });
}

function makeAccounts(n) {
  const types = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
  const out = [];
  for (let i = 1; i <= n; i++) {
    const t = types[i % types.length];
    out.push({
      code: String(1000 + i),
      name: `Cuenta ${i}`,
      type: t,
      nature: t === 'LIABILITY' || t === 'EQUITY' || t === 'INCOME' ? 'CREDIT' : 'DEBIT',
      active: i % 20 !== 0,
    });
  }
  return out;
}

describe('Contabilidad · ciclo exportar→importar el plan de cuentas', () => {
  it('reimportar el plan exportado conserva TODAS las cuentas, su código y naturaleza', () => {
    const accounts = makeAccounts(400);
    const rawRows = exportAccountsThenReopen(accounts);
    const parsed = toAccountRows(rawRows);
    // No se pierde ninguna cuenta.
    expect(parsed.length).toBe(accounts.length);
    const byCode = new Map(parsed.map((r) => [r.codigo, r]));
    for (const a of accounts) {
      const r = byCode.get(a.code);
      expect(r).toBeTruthy();
      expect(r.nombre).toBe(a.name);
      // La naturaleza se conserva (no se invierte débito/crédito).
      expect(r.naturaleza).toBe(a.nature === 'CREDIT' ? 'Crédito' : 'Débito');
    }
  });

  it('con miles de cuentas el ciclo sigue siendo fiel (3000)', () => {
    const accounts = makeAccounts(3000);
    const parsed = toAccountRows(exportAccountsThenReopen(accounts));
    expect(parsed.length).toBe(3000);
    expect(parsed.every((r) => r.codigo && r.nombre)).toBe(true);
  });
});

describe('Contabilidad · montos de asientos tolerantes al formato (es-CO)', () => {
  it('parseMoneyCell lee miles con punto, símbolo y número sin desajustar', () => {
    expect(parseMoneyCell('$ 1.250.000')).toBe(1250000);
    expect(parseMoneyCell('1.250.000')).toBe(1250000);
    expect(parseMoneyCell('89.900')).toBe(89900);
    expect(parseMoneyCell(1250000)).toBe(1250000);
    expect(parseMoneyCell('1,250,000.50')).toBe(1250001); // redondeo a entero COP
    expect(parseMoneyCell('')).toBe(0);
  });

  it('importar asientos conserva débito y crédito exactos y cuadra', () => {
    const raw = [
      { Fecha: '2026-02-10', Asiento: '1', Cuenta: '1105', Débito: '$ 1.190.000', Crédito: '' },
      { Fecha: '2026-02-10', Asiento: '1', Cuenta: '4135', Débito: '', Crédito: '1.000.000' },
      { Fecha: '2026-02-10', Asiento: '1', Cuenta: '2408', Débito: '', Crédito: '190.000' },
    ];
    const rows = toEntryRows(raw);
    expect(rows).toHaveLength(3);
    const totalDebito = rows.reduce((s, r) => s + (r.debito || 0), 0);
    const totalCredito = rows.reduce((s, r) => s + (r.credito || 0), 0);
    expect(totalDebito).toBe(1190000);
    expect(totalCredito).toBe(1190000);
    expect(totalDebito).toBe(totalCredito); // la partida doble cuadra
  });
});
