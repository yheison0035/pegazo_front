'use client';

import { useMemo, useState } from 'react';
import { formatMoney } from './statsUI';

/**
 * Tabla reutilizable con filtro por columna, orden y totales en vivo.
 *
 * columns: [{
 *   key, label, align:'left'|'right',
 *   filter:'text'|'select'|false,
 *   value:(row)=>valor crudo (para filtrar/ordenar/sumar),
 *   render:(row)=>nodo a mostrar (por defecto: value; si isMoney, formatMoney),
 *   sortValue:(row)=>valor de orden (opcional, si difiere de value),
 *   isMoney:bool, total:bool, sortable:bool (por defecto true),
 * }]
 */
export default function FilterableTable({
  columns,
  rows,
  initialSort,
  emptyText = 'Sin datos',
}) {
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState(initialSort || null);

  const val = (col, r) => (col.value ? col.value(r) : r[col.key]);

  const options = useMemo(() => {
    const o = {};
    for (const col of columns) {
      if (col.filter === 'select') {
        o[col.key] = [
          ...new Set(
            rows
              .map((r) => val(col, r))
              .filter((v) => v !== null && v !== undefined && v !== ''),
          ),
        ].sort();
      }
    }
    return o;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, rows]);

  const filtered = useMemo(() => {
    let out = rows.filter((r) => {
      for (const col of columns) {
        const fv = filters[col.key];
        if (!fv) continue;
        const cell = val(col, r);
        if (col.filter === 'text') {
          if (!String(cell ?? '').toLowerCase().includes(String(fv).toLowerCase()))
            return false;
        } else if (col.filter === 'select') {
          if (String(cell ?? '') !== String(fv)) return false;
        }
      }
      return true;
    });
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        const sv = (r) => (col.sortValue ? col.sortValue(r) : val(col, r));
        out = [...out].sort((a, b) => {
          const av = sv(a);
          const bv = sv(b);
          let cmp;
          if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
          else cmp = String(av ?? '').localeCompare(String(bv ?? ''));
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns, filters, sort]);

  const toggleSort = (col) => {
    if (col.sortable === false) return;
    setSort((s) =>
      s && s.key === col.key
        ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key: col.key, dir: 'desc' },
    );
  };

  const totalCols = columns.filter((c) => c.isMoney && c.total);
  const totals = {};
  for (const c of totalCols) {
    totals[c.key] = filtered.reduce((s, r) => s + (Number(val(c, r)) || 0), 0);
  }
  const anyFilter = Object.values(filters).some((v) => v);

  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const render = (col, r) => {
    if (col.render) return col.render(r);
    const v = val(col, r);
    return col.isMoney ? formatMoney(v) : v;
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <span className="text-xs text-gray-500">
          {filtered.length} de {rows.length} registro(s)
        </span>
        {anyFilter && (
          <button
            onClick={() => setFilters({})}
            className="rounded-full border border-gray-200 px-3 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c)}
                  className={`py-2 ${c.align === 'right' ? 'pl-4 text-right' : 'pr-4'} ${
                    c.sortable === false ? '' : 'cursor-pointer select-none hover:text-gray-700'
                  }`}
                >
                  {c.label}
                  {sort?.key === c.key && (
                    <span className="ml-1 text-orange-500">
                      {sort.dir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
            <tr className="border-b border-gray-100 align-top">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`py-2 ${c.align === 'right' ? 'pl-2' : 'pr-2'}`}
                >
                  {c.filter === 'text' && (
                    <input
                      value={filters[c.key] || ''}
                      onChange={(e) => setF(c.key, e.target.value)}
                      placeholder="Buscar…"
                      className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs font-normal normal-case focus:border-orange-400 focus:outline-none"
                    />
                  )}
                  {c.filter === 'select' && (
                    <select
                      value={filters[c.key] || ''}
                      onChange={(e) => setF(c.key, e.target.value)}
                      className={`w-full rounded-lg border px-2 py-1 text-xs font-normal normal-case focus:border-orange-400 focus:outline-none ${
                        filters[c.key]
                          ? 'border-orange-300 bg-orange-50 text-orange-700'
                          : 'border-gray-200'
                      }`}
                    >
                      <option value="">Todos</option>
                      {(options[c.key] || []).map((o) => (
                        <option key={o} value={o}>
                          {c.optionLabel ? c.optionLabel(o) : o}
                        </option>
                      ))}
                    </select>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length ? (
              filtered.map((r, i) => (
                <tr key={r.id ?? r.key ?? i} className="text-gray-700">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`py-2 ${
                        c.align === 'right'
                          ? 'pl-4 text-right font-semibold text-gray-900'
                          : 'pr-4'
                      }`}
                    >
                      {render(c, r)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-sm text-gray-400"
                >
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
          {totalCols.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 font-bold text-gray-900">
                {columns.map((c, i) => (
                  <td
                    key={c.key}
                    className={`py-3 ${c.align === 'right' ? 'pl-4 text-right' : 'pr-4'}`}
                  >
                    {i === 0
                      ? `Total ${anyFilter ? 'filtrado' : ''}`
                      : c.isMoney && c.total
                        ? formatMoney(totals[c.key])
                        : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
