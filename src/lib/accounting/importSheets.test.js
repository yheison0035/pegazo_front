import { describe, it, expect } from 'vitest';
import {
  normHeader,
  parseDateCell,
  parseMoneyCell,
  mapRowHeaders,
  toEntryRows,
  toAccountRows,
  toAssetRows,
  entriesTemplateSheets,
  accountsTemplateSheets,
  assetsTemplateSheets,
} from './importSheets';

describe('importSheets', () => {
  it('normaliza encabezados con tildes, espacios y mayúsculas', () => {
    expect(normHeader(' Cuenta Débito ')).toBe('cuentadebito');
    expect(normHeader('N° Asiento')).toBe('nasiento');
    expect(normHeader('FECHA')).toBe('fecha');
  });

  it('parsea fechas en varios formatos y objetos Date', () => {
    expect(parseDateCell('2026-03-05')).toBe('2026-03-05');
    expect(parseDateCell('5/3/2026')).toBe('2026-03-05');
    expect(parseDateCell('05-03-2026')).toBe('2026-03-05');
    expect(parseDateCell(new Date(2026, 2, 5))).toBe('2026-03-05');
    expect(parseDateCell('ayer')).toBe('');
    expect(parseDateCell('')).toBe('');
  });

  it('parsea montos con formato colombiano e inglés', () => {
    expect(parseMoneyCell('$ 1.250.000')).toBe(1250000);
    expect(parseMoneyCell('1,250,000.50')).toBe(1250001);
    expect(parseMoneyCell(1250000)).toBe(1250000);
    expect(parseMoneyCell('')).toBe(0);
  });

  it('mapea encabezados a claves canónicas por tipo de hoja', () => {
    expect(mapRowHeaders({ 'Cuenta Débito': '1105', Haber: '4135', Importe: 5 }, 'entries')).toEqual({
      cuentaDebito: '1105',
      cuentaCredito: '4135',
      valor: 5,
    });
    expect(mapRowHeaders({ Código: '1105', Nombre: 'Caja', Clase: 'Activo' }, 'accounts')).toEqual({
      codigo: '1105',
      nombre: 'Caja',
      grupo: 'Activo',
    });
  });

  it('toEntryRows: formato PAR y DIARIO, ignora filas vacías', () => {
    const rows = toEntryRows([
      { Fecha: '15/01/2026', Descripcion: 'Venta', CuentaDebito: '1105', CuentaCredito: '4135', Valor: '100.000', Referencia: 'F1' },
      { Fecha: '', Descripcion: '', CuentaDebito: '', CuentaCredito: '', Valor: '' },
      { Fecha: new Date(2026, 0, 16), Asiento: 7, Descripcion: 'Arriendo', Cuenta: '5120', Debito: '500.000', Credito: '' },
      { Fecha: new Date(2026, 0, 16), Asiento: 7, Descripcion: 'Arriendo', Cuenta: '1110', Debito: '', Credito: 500000 },
    ]);
    expect(rows).toEqual([
      { fecha: '2026-01-15', descripcion: 'Venta', referencia: 'F1', cuentaDebito: '1105', cuentaCredito: '4135', valor: 100000 },
      { fecha: '2026-01-16', descripcion: 'Arriendo', referencia: '', asiento: '7', cuenta: '5120', debito: 500000, credito: 0 },
      { fecha: '2026-01-16', descripcion: 'Arriendo', referencia: '', asiento: '7', cuenta: '1110', debito: 0, credito: 500000 },
    ]);
  });

  it('toAccountRows y toAssetRows normalizan sus columnas', () => {
    expect(toAccountRows([{ Codigo: 5120, Nombre: 'Arriendo', Grupo: 'Gastos', Naturaleza: 'Débito' }])).toEqual([
      { codigo: '5120', nombre: 'Arriendo', grupo: 'Gastos', naturaleza: 'Débito' },
    ]);
    const assets = toAssetRows([
      { Nombre: 'PC', Categoria: 'Equipo', FechaCompra: '15/01/2026', Cantidad: '2', ValorUnitario: '2.500.000', VidaUtilMeses: 60 },
      { Nombre: 'Terreno', 'Fecha de compra': '2024-06-01', Costo: 80000000, 'Vida útil (meses)': '' },
      { Nombre: 'Muestra', FechaCompra: '2024-06-01', Costo: 1, Notas: 'EJEMPLO (borra esta fila)' },
    ]);
    expect(assets).toHaveLength(2);
    expect(assets[0]).toMatchObject({ name: 'PC', acquisitionDate: '2026-01-15', quantity: 2, unitCost: 2500000, cost: null, usefulLifeMonths: 60 });
    expect(assets[1]).toMatchObject({ name: 'Terreno', acquisitionDate: '2024-06-01', quantity: 1, unitCost: null, cost: 80000000, usefulLifeMonths: null });
  });

  it('las plantillas traen encabezados y el PUC de la empresa', () => {
    const accounts = [{ code: '1105', name: 'CAJA', type: 'ASSET', nature: 'DEBIT' }];
    const sheets = entriesTemplateSheets(accounts);
    expect(sheets.map((s) => s.name)).toEqual(['Movimientos', 'Diario', 'Cuentas']);
    expect(sheets[2].rows).toEqual([
      ['Codigo', 'Nombre', 'Grupo', 'Naturaleza'],
      ['1105', 'CAJA', 'Activo', 'Débito'],
    ]);
    expect(accountsTemplateSheets([])[0].rows).toHaveLength(2);
    expect(assetsTemplateSheets()[0].rows[0]).toContain('ValorUnitario');
  });
});
