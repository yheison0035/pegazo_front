// Descarga un CSV (abrible en Excel) a partir de una lista de objetos planos.
// El BOM inicial hace que Excel respete tildes y ñ.
export function downloadCsv(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);

  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csv = [
    headers.join(';'),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(';')),
  ].join('\n');

  const blob = new Blob(['﻿' + csv], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
