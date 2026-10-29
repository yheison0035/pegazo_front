// Convierte lo que muestra una pantalla contable (lista de objetos o un objeto
// de totales) en filas planas para CSV: objetos anidados → "clave.subclave".
export function flattenRow(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      Object.assign(out, flattenRow(v, key));
    } else if (Array.isArray(v)) {
      out[key] = v.map((x) => (x && typeof x === 'object' ? x.name ?? x.code ?? JSON.stringify(x) : x)).join(' | ');
    } else {
      out[key] = v ?? '';
    }
  }
  return out;
}

export function toCsvRows(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((r) => flattenRow(r));
  // Objeto de totales: si trae una lista principal, exportarla; si no, una fila
  // por clave (concepto, valor).
  const list = Object.values(input).find((v) => Array.isArray(v) && v.length && typeof v[0] === 'object');
  if (list) return list.map((r) => flattenRow(r));
  const flat = flattenRow(input);
  return Object.entries(flat).map(([concepto, valor]) => ({ concepto, valor }));
}
