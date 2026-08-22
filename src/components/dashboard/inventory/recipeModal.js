'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { getRecipe, setRecipe } from '@/lib/api/routes/recipes';
import { getSupplies } from '@/lib/api/routes/supplies';

// Editor de receta de un plato: qué insumos consume UNA unidad.
export default function RecipeModal({ open, onClose, inventoryId, dishName }) {
  const [supplies, setSupplies] = useState([]);
  const [rows, setRows] = useState([]); // [{ supplyId, quantity }]
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!open || !inventoryId) return;
    setMsg('');
    getSupplies()
      .then((r) => setSupplies(r?.data || []))
      .catch(() => setSupplies([]));
    getRecipe(inventoryId)
      .then((r) =>
        setRows(
          (r?.data || []).map((it) => ({
            supplyId: String(it.supplyId),
            quantity: String(it.quantity),
          }))
        )
      )
      .catch(() => setRows([]));
  }, [open, inventoryId]);

  if (!open) return null;

  const unitOf = (supplyId) =>
    supplies.find((s) => String(s.id) === String(supplyId))?.unit || '';

  const addRow = () => setRows([...rows, { supplyId: '', quantity: '' }]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const setRow = (i, patch) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const save = async () => {
    const items = rows
      .filter((r) => r.supplyId && Number(r.quantity) > 0)
      .map((r) => ({
        supplyId: Number(r.supplyId),
        quantity: Number(r.quantity),
      }));
    setBusy(true);
    setMsg('');
    try {
      await setRecipe(inventoryId, items);
      setMsg('Receta guardada.');
      setTimeout(onClose, 600);
    } catch (e) {
      setMsg(e.message || 'No se pudo guardar la receta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Receta</h2>
            <p className="text-xs text-gray-500">
              Insumos que consume 1 unidad de {dishName || 'este plato'}. Se
              descuentan solos al venderlo.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-5">
          {supplies.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              Primero crea insumos en el módulo <strong>Insumos</strong> para
              poder armar la receta.
            </p>
          ) : (
            <>
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={r.supplyId}
                    onChange={(e) => setRow(i, { supplyId: e.target.value })}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">Elige un insumo…</option>
                    {supplies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={r.quantity}
                    onChange={(e) => setRow(i, { quantity: e.target.value })}
                    placeholder="Cant."
                    className="w-24 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  />
                  <span className="w-10 text-xs text-gray-400">
                    {unitOf(r.supplyId).toLowerCase()}
                  </span>
                  <button
                    onClick={() => removeRow(i)}
                    className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addRow}
                className="mt-1 inline-flex items-center gap-1 rounded-lg bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                <PlusIcon className="h-4 w-4" />
                Agregar insumo
              </button>
            </>
          )}
          {msg && <p className="text-xs text-gray-500">{msg}</p>}
        </div>

        <div className="flex flex-none justify-end gap-2 border-t border-gray-100 bg-white p-4">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={save}
            loading={busy}
            disabled={supplies.length === 0}
          >
            Guardar receta
          </Button>
        </div>
      </div>
    </div>
  );
}
