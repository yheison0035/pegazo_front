// Puente con SheetJS para las pantallas contables: descargar un libro con
// varias hojas y leer la primera hoja útil de un archivo subido.
import * as XLSX from 'xlsx';

// sheets: [{ name, rows: [[...]] }]
export function downloadWorkbook(sheets, filename) {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(s.rows);
    // Ancho de columnas aproximado según el contenido (legible al abrir).
    const widths = [];
    for (const row of s.rows) {
      row.forEach((cell, i) => {
        const len = Math.min(60, String(cell ?? '').length + 2);
        widths[i] = Math.max(widths[i] || 10, len);
      });
    }
    ws['!cols'] = widths.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename);
}

// Lee un .xlsx/.xls/.csv y devuelve las filas (objetos por encabezado) de la
// primera hoja cuyo nombre esté en `preferred`; si ninguna, la primera hoja.
export async function readSheetRows(file, preferred = []) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: true });
  const name = preferred.find((p) => wb.Sheets[p]) || wb.SheetNames[0];
  const ws = wb.Sheets[name];
  if (!ws) return { sheet: null, rows: [] };
  const rows = XLSX.utils.sheet_to_json(ws, { raw: true, defval: '' });
  return { sheet: name, rows };
}

// Lee TODAS las hojas (para archivos con "Movimientos" y "Diario" a la vez).
export async function readAllSheets(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: true });
  return wb.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { raw: true, defval: '' }),
  }));
}
