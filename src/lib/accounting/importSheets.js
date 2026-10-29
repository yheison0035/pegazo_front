// Lectura de hojas Excel/CSV para los módulos contables (asientos, plan de
// cuentas, activos). Normaliza encabezados (tildes, mayúsculas, espacios) y
// los lleva a las claves que espera el backend. Funciones puras (sin xlsx).

export function normHeader(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Alias de encabezado → clave canónica, por tipo de hoja.
const ENTRY_HEADERS = {
  fecha: 'fecha',
  date: 'fecha',
  descripcion: 'descripcion',
  detalle: 'descripcion',
  concepto: 'descripcion',
  description: 'descripcion',
  referencia: 'referencia',
  ref: 'referencia',
  documento: 'referencia',
  reference: 'referencia',
  cuentadebito: 'cuentaDebito',
  cuentadebe: 'cuentaDebito',
  debe: 'cuentaDebito',
  cuentacredito: 'cuentaCredito',
  cuentahaber: 'cuentaCredito',
  haber: 'cuentaCredito',
  valor: 'valor',
  monto: 'valor',
  importe: 'valor',
  asiento: 'asiento',
  numero: 'asiento',
  numeroasiento: 'asiento',
  comprobante: 'asiento',
  cuenta: 'cuenta',
  codigocuenta: 'cuenta',
  codigo: 'cuenta',
  debito: 'debito',
  debitos: 'debito',
  debit: 'debito',
  credito: 'credito',
  creditos: 'credito',
  credit: 'credito',
};

const ACCOUNT_HEADERS = {
  codigo: 'codigo',
  code: 'codigo',
  cuenta: 'codigo',
  codigocuenta: 'codigo',
  nombre: 'nombre',
  name: 'nombre',
  nombrecuenta: 'nombre',
  descripcion: 'nombre',
  grupo: 'grupo',
  tipo: 'grupo',
  type: 'grupo',
  clase: 'grupo',
  naturaleza: 'naturaleza',
  nature: 'naturaleza',
};

const ASSET_HEADERS = {
  nombre: 'name',
  name: 'name',
  activo: 'name',
  categoria: 'category',
  category: 'category',
  tipo: 'category',
  referencia: 'reference',
  reference: 'reference',
  placa: 'reference',
  serie: 'reference',
  fechacompra: 'acquisitionDate',
  fechadecompra: 'acquisitionDate',
  fechaadquisicion: 'acquisitionDate',
  fecha: 'acquisitionDate',
  acquisitiondate: 'acquisitionDate',
  cantidad: 'quantity',
  quantity: 'quantity',
  valorunitario: 'unitCost',
  unitcost: 'unitCost',
  costo: 'cost',
  costototal: 'cost',
  cost: 'cost',
  valorsalvamento: 'salvageValue',
  salvamento: 'salvageValue',
  valorresidual: 'salvageValue',
  salvagevalue: 'salvageValue',
  vidautilmeses: 'usefulLifeMonths',
  vidautil: 'usefulLifeMonths',
  meses: 'usefulLifeMonths',
  usefullifemonths: 'usefulLifeMonths',
  notas: 'notes',
  observaciones: 'notes',
  notes: 'notes',
};

const SHEET_HEADERS = {
  entries: ENTRY_HEADERS,
  accounts: ACCOUNT_HEADERS,
  assets: ASSET_HEADERS,
};

// Convierte una celda a texto plano (fechas de Excel → YYYY-MM-DD).
export function cellToText(v) {
  if (v == null) return '';
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return '';
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(v).trim();
}

// Fecha en texto libre → YYYY-MM-DD ('' si no se entiende). Acepta
// YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY y objetos Date.
export function parseDateCell(v) {
  const s = cellToText(v);
  if (!s) return '';
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}

// "$ 1.250.000", "1,250,000.50", 1250000 → número (entero COP).
export function parseMoneyCell(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return Math.round(v);
  let s = String(v).replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  const hasDot = s.includes('.');
  const hasComma = s.includes(',');
  if (hasDot && hasComma) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (hasComma) {
    const parts = s.split(',');
    s = parts.length > 2 || parts[parts.length - 1].length === 3 ? parts.join('') : parts.join('.');
  } else if (hasDot) {
    const parts = s.split('.');
    s = parts.length > 2 || parts[parts.length - 1].length === 3 ? parts.join('') : s;
  }
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

// Lleva una fila (objeto con encabezados originales) a claves canónicas.
export function mapRowHeaders(row, kind) {
  const dict = SHEET_HEADERS[kind] || {};
  const out = {};
  for (const [k, v] of Object.entries(row || {})) {
    const key = dict[normHeader(k)];
    if (!key) continue;
    if (out[key] === undefined || out[key] === '') out[key] = v;
  }
  return out;
}

// ¿La fila está completamente vacía? (Excel suele traer filas en blanco.)
export function isBlankRow(row) {
  return !Object.values(row || {}).some((v) => cellToText(v) !== '');
}

// --- Asientos ---------------------------------------------------------------
// Devuelve filas listas para /accounting/entries/import en los dos formatos
// (PAR o DIARIO), ya con fechas y montos normalizados.
export function toEntryRows(rawRows) {
  const rows = [];
  for (const raw of rawRows || []) {
    if (isBlankRow(raw)) continue;
    const m = mapRowHeaders(raw, 'entries');
    const fecha = parseDateCell(m.fecha);
    const base = {
      fecha: fecha || cellToText(m.fecha),
      descripcion: cellToText(m.descripcion),
      referencia: cellToText(m.referencia),
    };
    const isPair = cellToText(m.cuentaDebito) || cellToText(m.cuentaCredito);
    if (isPair) {
      rows.push({
        ...base,
        cuentaDebito: cellToText(m.cuentaDebito),
        cuentaCredito: cellToText(m.cuentaCredito),
        valor: parseMoneyCell(m.valor),
      });
    } else {
      rows.push({
        ...base,
        asiento: cellToText(m.asiento),
        cuenta: cellToText(m.cuenta),
        debito: parseMoneyCell(m.debito),
        credito: parseMoneyCell(m.credito),
      });
    }
  }
  return rows;
}

// --- Plan de cuentas --------------------------------------------------------
export function toAccountRows(rawRows) {
  const rows = [];
  for (const raw of rawRows || []) {
    if (isBlankRow(raw)) continue;
    const m = mapRowHeaders(raw, 'accounts');
    rows.push({
      codigo: cellToText(m.codigo),
      nombre: cellToText(m.nombre),
      grupo: cellToText(m.grupo),
      naturaleza: cellToText(m.naturaleza),
    });
  }
  return rows;
}

// --- Activos ----------------------------------------------------------------
export function toAssetRows(rawRows) {
  const rows = [];
  for (const raw of rawRows || []) {
    if (isBlankRow(raw)) continue;
    const m = mapRowHeaders(raw, 'assets');
    // Filas de ejemplo de la plantilla: no se importan.
    if (/^ejemplo/i.test(cellToText(m.notes))) continue;
    const unitCost = parseMoneyCell(m.unitCost);
    const cost = parseMoneyCell(m.cost);
    const life = cellToText(m.usefulLifeMonths);
    rows.push({
      name: cellToText(m.name),
      category: cellToText(m.category) || null,
      reference: cellToText(m.reference) || null,
      acquisitionDate: parseDateCell(m.acquisitionDate) || cellToText(m.acquisitionDate),
      quantity: Math.max(1, Math.round(Number(cellToText(m.quantity)) || 1)),
      unitCost: unitCost > 0 ? unitCost : null,
      cost: unitCost > 0 ? null : cost,
      salvageValue: parseMoneyCell(m.salvageValue),
      usefulLifeMonths: life === '' ? null : Math.round(Number(life) || 0),
      notes: cellToText(m.notes) || null,
    });
  }
  return rows;
}

// --- Plantillas (hojas como matrices) --------------------------------------
const TYPE_LABEL = {
  ASSET: 'Activo',
  LIABILITY: 'Pasivo',
  EQUITY: 'Patrimonio',
  INCOME: 'Ingresos',
  COST: 'Costos',
  EXPENSE: 'Gastos',
};
const NATURE_LABEL = { DEBIT: 'Débito', CREDIT: 'Crédito' };

export function accountsSheet(accounts) {
  return [['Codigo', 'Nombre', 'Grupo', 'Naturaleza']].concat(
    (accounts || []).map((a) => [
      a.code,
      a.name,
      TYPE_LABEL[a.type] || a.type || '',
      NATURE_LABEL[a.nature] || a.nature || '',
    ]),
  );
}

// Plantilla de asientos: hoja "Movimientos" (formato PAR), hoja "Diario"
// (formato DIARIO, varias líneas por asiento) y hoja "Cuentas" con el PUC.
export function entriesTemplateSheets(accounts, sampleDate = '2026-01-15') {
  return [
    {
      name: 'Movimientos',
      rows: [
        ['Fecha', 'Descripcion', 'CuentaDebito', 'CuentaCredito', 'Valor', 'Referencia'],
        [sampleDate, 'Ejemplo: venta de contado', '1105', '4135', 100000, 'FAC-001'],
      ],
    },
    {
      name: 'Diario',
      rows: [
        ['Fecha', 'Asiento', 'Descripcion', 'Cuenta', 'Debito', 'Credito', 'Referencia'],
        [sampleDate, 1, 'Ejemplo: venta con IVA', '1105', 119000, '', 'FAC-002'],
        [sampleDate, 1, 'Ejemplo: venta con IVA', '4135', '', 100000, 'FAC-002'],
        [sampleDate, 1, 'Ejemplo: venta con IVA', '2408', '', 19000, 'FAC-002'],
      ],
    },
    { name: 'Cuentas', rows: accountsSheet(accounts) },
  ];
}

export function accountsTemplateSheets(accounts) {
  const rows = accountsSheet(accounts);
  if (rows.length === 1) rows.push(['5120', 'ARRIENDO', 'Gastos', 'Débito']);
  return [{ name: 'Cuentas', rows }];
}

export function assetsTemplateSheets() {
  return [
    {
      name: 'Activos',
      rows: [
        [
          'Nombre',
          'Categoria',
          'Referencia',
          'FechaCompra',
          'Cantidad',
          'ValorUnitario',
          'ValorSalvamento',
          'VidaUtilMeses',
          'Notas',
        ],
        ['Computador portátil', 'Equipo', 'SN-001', '2026-01-15', 1, 2500000, 0, 60, 'EJEMPLO (borra esta fila)'],
        ['Local comercial', 'Inmueble', '', '2024-06-01', 1, 180000000, 0, '', 'EJEMPLO: sin vida útil = no se deprecia'],
      ],
    },
  ];
}
