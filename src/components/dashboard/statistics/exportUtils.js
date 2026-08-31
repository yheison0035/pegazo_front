'use client';

// Exporta filas a un CSV que Excel abre correctamente en es-CO:
// - BOM UTF-8 (acentos), separador ';' (Excel español), montos sin símbolo.
// rows: array de arrays (la primera fila son los encabezados).
export function exportCSV(filename, rows) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map((r) => r.map(esc).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + body], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Número plano para la celda (sin símbolo, punto miles quitado) — Excel lo lee
// como número.
export function csvNum(v) {
  return Math.round(Number(v) || 0);
}
