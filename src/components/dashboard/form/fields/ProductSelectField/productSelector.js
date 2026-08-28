'use client';

import { useState, useEffect, useRef } from 'react';
import {
  formatCOP,
  formatPrice,
  formatText,
  parseCOPToNumber,
  toggleCase,
} from '@/lib/api/utils/utils';
import useSales from '@/lib/api/hooks/useSales';
import { TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { WEIGHT_UNITS, unitShortLabel } from '@/config/verticalProfiles';

const isWeightUnit = (u) => WEIGHT_UNITS.includes(u);
// Oculta el color placeholder de productos sin variantes de color.
const realColor = (c) =>
  c && !['ÚNICO', 'UNICO', 'GENERAL'].includes(String(c).toUpperCase())
    ? c
    : '';

export default function ProductSelector({
  value = [],
  onChange,
  onTyping,
  // Cuando true, la lista de resultados fluye en el layout (no es "absolute"),
  // para que no la recorte un contenedor con overflow (ej. modal de mesa).
  inlineResults = false,
  // Cuando true, cada ítem muestra un campo de observación (ej. "sin arroz").
  allowNotes = false,
}) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [processing, setProcessing] = useState(false);
  const initialized = useRef(false);
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const { searchProducts, loading } = useSales();

  useEffect(() => {
    if (!initialized.current && Array.isArray(value) && value.length > 0) {
      setSelectedProducts(value);
      initialized.current = true;
    }
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!search || search.trim().length < 2) {
        setFiltered([]);
        return;
      }

      try {
        const res = await searchProducts(search);
        setFiltered(res?.data || []);
      } catch (err) {
        console.error('Error buscando productos', err);
        setFiltered([]);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  // Soporta productos y servicios. Si el ítem ya está en la lista, repetir la
  // selección/escaneo suma una unidad (productos) — flujo natural de un lector
  // de código de barras. Sin retrasos artificiales.
  const handleSelectProduct = (product) => {
    const isService = product.type === 'service';
    // Plato elaborado (sin control de stock): se puede vender siempre.
    const isPrepared = product.trackStock === false;

    if (!isService && !isPrepared && (!product.stock || product.stock <= 0)) {
      setAlert({
        type: 'info',
        message: 'Este producto no tiene stock disponible',
      });
      return;
    }

    const exists = selectedProducts.find(
      (p) => p.inventoryVariantId === product.id && p.type === product.type
    );

    if (exists) {
      if (!isService) updateQuantity(product.id, (exists.quantity || 1) + 1);
      setSearch('');
      setFiltered([]);
      return;
    }

    const newList = [
      ...selectedProducts,
      {
        type: product.type,
        inventoryVariantId: product.id,
        name: isService
          ? product.name
          : `${product.name}${
              realColor(product.color) ? ` - ${realColor(product.color)}` : ''
            }${product.size ? ` / ${product.size}` : ''}`,
        price: product.price,
        stock: isService ? null : product.stock,
        trackStock: product.trackStock,
        unit: product.unit || 'UNIDAD',
        originalQuantity: 0,
        quantity: 1,
        discount: product.discount,
        subtotal: product.price,
      },
    ];

    setSelectedProducts(newList);
    setSearch('');
    setFiltered([]);
    onChange?.(newList);
  };

  // Enter en el buscador: agrega el mejor resultado (lector de código de barras).
  // Si el debounce aún no trajo resultados, busca al instante para no perder el
  // escaneo rápido.
  const handleEnter = async () => {
    const term = search.trim();
    if (term.length < 2) return;

    let results = filtered;
    if (!results || results.length === 0) {
      try {
        const res = await searchProducts(term);
        results = res?.data || [];
      } catch {
        results = [];
      }
    }
    if (results.length) handleSelectProduct(results[0]);
  };

  // ✅ AJUSTE: servicios sin límite
  const updateQuantity = (id, quantity) => {
    const updated = selectedProducts.map((p) => {
      if (p.inventoryVariantId === id) {
        const isService = p.type === 'service';
        // Plato elaborado (sin stock): cantidad libre, como un servicio.
        const isPrepared = p.trackStock === false;

        let safeQty;

        if (isService || isPrepared) {
          safeQty = Math.max(1, Number(quantity) || 1);
        } else if (isWeightUnit(p.unit)) {
          // Venta por peso: admite decimales, sin forzar mínimo 1.
          const maxAllowed = p.stock + p.originalQuantity;
          safeQty = Math.max(
            0.001,
            Math.min(Number(quantity) || 0.001, maxAllowed)
          );
        } else {
          const maxAllowed = p.stock + p.originalQuantity;

          safeQty = Math.max(1, Math.min(Number(quantity) || 1, maxAllowed));
        }

        const base = p.price * safeQty;
        const safeDiscount = Math.min(p.discount || 0, base);

        return {
          ...p,
          quantity: safeQty,
          subtotal: base - safeDiscount,
        };
      }
      return p;
    });

    setSelectedProducts(updated);
    onChange?.(updated);
  };

  const updateDiscount = (id, discount) => {
    const updated = selectedProducts.map((p) => {
      if (p.inventoryVariantId === id) {
        const total = p.price * p.quantity;

        const safeDiscount = Math.max(
          0,
          Math.min(Number(discount) || 0, total)
        );

        return {
          ...p,
          discount: safeDiscount,
          subtotal: total - safeDiscount,
        };
      }
      return p;
    });

    setSelectedProducts(updated);
    onChange?.(updated);
  };

  // Observación por ítem (ej. "sin arroz", "poca ensalada").
  const updateNotes = (id, notes) => {
    const updated = selectedProducts.map((p) =>
      p.inventoryVariantId === id ? { ...p, notes } : p
    );
    setSelectedProducts(updated);
    onChange?.(updated);
  };

  // AJUSTE: eliminar correcto con type
  const removeProduct = (id) => {
    const updated = selectedProducts.filter((p) => p.inventoryVariantId !== id);
    setSelectedProducts(updated);
    onChange?.(updated);
  };

  const total = selectedProducts.reduce((acc, p) => acc + p.subtotal, 0);

  const totalDiscount = selectedProducts.reduce(
    (acc, p) => acc + (isNaN(Number(p.discount)) ? 0 : Number(p.discount)),
    0
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />

          <input
            type="text"
            placeholder="Buscar o escanear código de barras (Enter agrega)..."
            value={search}
            onChange={(e) => {
              const value = toggleCase(e.target.value, 'uppercase');
              setSearch(value);
              onTyping?.();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleEnter();
              }
            }}
            className="
              w-full rounded-2xl pl-11 pr-4 py-3 text-sm
              bg-white border border-gray-200
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400
              transition-all shadow-sm
            "
          />
        </div>

        {search.trim().length >= 2 && (
          <div
            className={`${
              inlineResults ? 'relative' : 'absolute z-30'
            } mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden`}
          >
            {loading && (
              <div className="px-4 py-4 text-sm text-gray-400 flex items-center gap-2">
                <span className="animate-pulse">Buscando productos...</span>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="max-h-72 overflow-auto">
                {filtered.map((product) => {
                  const noStock =
                    product.type !== 'service' &&
                    product.trackStock !== false &&
                    product.stock <= 0;

                  return (
                    <div
                      key={`${product.type}-${product.id}`}
                      onClick={() => {
                        if (noStock) return;
                        handleSelectProduct(product);
                      }}
                      className={`
                        flex items-center justify-between
                        px-4 py-3 text-sm
                        border-b border-gray-100
                        transition
                        ${
                          noStock
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex flex-col">
                        <span className="text-gray-800 font-medium">
                          {product.name}
                        </span>
                        {product.type !== 'service' && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {(realColor(product.color) || product.size) && (
                              <>
                                <span>
                                  {realColor(product.color)}
                                  {product.size ? ` / ${product.size}` : ''}
                                </span>
                                <span>•</span>
                              </>
                            )}
                            {product.trackStock === false ? (
                              <span className="text-emerald-600">
                                Al momento
                              </span>
                            ) : (
                              <span>
                                Stock: {product.stock}
                                {isWeightUnit(product.unit)
                                  ? ` ${unitShortLabel(product.unit)}`
                                  : ''}
                              </span>
                            )}

                            {noStock && (
                              <span className="text-red-500 font-medium">
                                Sin stock
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <span className="text-gray-900 font-semibold">
                        ${formatPrice(product.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="px-4 py-4 text-sm text-gray-400 text-center">
                No se encontraron productos
              </div>
            )}
          </div>
        )}
      </div>

      {processing && (
        <div className="flex items-center justify-center rounded-2xl p-6 border border-gray-200 bg-gray-50 text-gray-500 text-sm">
          Cargando productos...
        </div>
      )}

      {!processing && selectedProducts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto shadow-sm">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-4 text-left">Producto</th>
                <th className="px-6 py-4 text-center">Precio</th>
                <th className="px-6 py-4 text-center">Cant.</th>
                <th className="px-6 py-4 text-center">Desc.</th>
                <th className="px-6 py-4 text-right">Subtotal</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>

            <tbody>
              {selectedProducts.map((p) => (
                <tr
                  key={`${p.type}-${p.inventoryVariantId}`}
                  className="border-t border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {p.name}
                    {allowNotes && (
                      <input
                        type="text"
                        value={p.notes || ''}
                        onChange={(e) =>
                          updateNotes(p.inventoryVariantId, e.target.value)
                        }
                        placeholder="Observación: sin arroz, poca ensalada..."
                        className="mt-1.5 w-full max-w-xs rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-normal text-gray-700 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    )}
                  </td>

                  <td className="px-6 py-4 text-center text-gray-700">
                    ${formatPrice(p.price)}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        min={isWeightUnit(p.unit) ? 0.001 : 1}
                        step={isWeightUnit(p.unit) ? 0.001 : 1}
                        max={
                          p.type === 'service' || p.trackStock === false
                            ? undefined
                            : p.stock + p.originalQuantity
                        }
                        value={p.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            p.inventoryVariantId,
                            Number(e.target.value)
                          )
                        }
                        className="w-20 h-9 text-center rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-orange-500/20 outline-none"
                      />
                      {isWeightUnit(p.unit) && (
                        <span className="text-xs font-medium text-gray-400">
                          {unitShortLabel(p.unit)}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <input
                      type="text"
                      value={formatCOP(p.discount || 0)}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        updateDiscount(
                          p.inventoryVariantId,
                          parseCOPToNumber(e.target.value)
                        )
                      }
                      className="w-24 h-9 text-center rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-orange-500/20 outline-none"
                      placeholder="$ 0"
                    />
                  </td>

                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    ${formatPrice(p.subtotal)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => removeProduct(p.inventoryVariantId)}
                      className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 transition group cursor-pointer"
                    >
                      <TrashIcon className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end px-6 py-5 border-t border-gray-100">
            <div className="flex flex-col items-end gap-1 text-sm">
              <div className="flex justify-between w-48 text-gray-500">
                <span>Subtotal</span>
                <span>
                  $
                  {formatPrice(
                    selectedProducts.reduce(
                      (acc, p) => acc + p.price * p.quantity,
                      0
                    )
                  )}
                </span>
              </div>

              <div className="flex justify-between w-48 text-red-500">
                <span>Descuento</span>
                <span>
                  -$
                  {totalDiscount === 0 ? '0' : formatPrice(totalDiscount)}
                </span>
              </div>

              <div className="flex justify-between w-48 text-base font-semibold text-gray-900 pt-1">
                <span>Total</span>
                <span>${formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '', url: '' })}
        url={alert.url}
      />
    </div>
  );
}
