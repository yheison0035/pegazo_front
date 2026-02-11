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

export default function ProductSelector({ value = [], onChange, onTyping }) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [processing, setProcessing] = useState(false);
  const initialized = useRef(false);

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

  const handleSelectProduct = async (product) => {
    const exists = selectedProducts.find(
      (p) => p.inventoryVariantId === product.id
    );
    if (exists) return;

    setProcessing(true);
    await new Promise((res) => setTimeout(res, 300));

    const newList = [
      ...selectedProducts,
      {
        inventoryVariantId: product.id,
        name: `${product.name} - ${product.color}`,
        price: product.price,
        stock: product.stock,
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
    setProcessing(false);
  };

  const updateQuantity = (id, quantity) => {
    const updated = selectedProducts.map((p) => {
      if (p.inventoryVariantId === id) {
        const maxAllowed = p.stock + p.originalQuantity;

        const safeQty = Math.max(
          1,
          Math.min(Number(quantity) || 1, maxAllowed)
        );

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

  const removeProduct = (id) => {
    const updated = selectedProducts.filter((p) => p.inventoryVariantId !== id);
    setSelectedProducts(updated);
    onChange?.(updated);
  };

  const total = selectedProducts.reduce((acc, p) => acc + p.subtotal, 0);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => {
            const value = toggleCase(e.target.value, 'uppercase');
            setSearch(value);
            onTyping?.();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none"
        />

        {search.trim().length >= 2 && (
          <div className="absolute z-10 bg-white border w-full rounded-xl mt-1 shadow-md max-h-48 overflow-auto">
            {loading ? (
              <div className="px-4 py-2 text-sm text-gray-400">
                Buscando productos...
              </div>
            ) : filtered.length > 0 ? (
              <ul>
                {filtered.map((product) => (
                  <li
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="px-4 py-2 hover:bg-orange-50 cursor-pointer text-sm"
                  >
                    {formatText(product.name)} - {product.color} | Stock:{' '}
                    {product.stock} — {formatPrice(product.price)}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-2 text-sm text-gray-400">
                No hay productos relacionados
              </div>
            )}
          </div>
        )}
      </div>

      {processing && (
        <div className="flex items-center justify-center border border-gray-300 rounded-xl p-4 bg-gray-50 text-gray-500 text-sm">
          Cargando productos...
        </div>
      )}

      {!processing && selectedProducts.length > 0 && (
        <div className="border border-gray-300 rounded-xl p-4 bg-gray-50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left">
                <th>Producto</th>
                <th>Precio</th>
                <th>Cant.</th>
                <th>Desc. ($)</th>
                <th className="text-right">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((p) => (
                <tr key={p.inventoryVariantId}>
                  <td>{formatText(p.name)}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      max={p.stock + p.originalQuantity}
                      value={p.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          p.inventoryVariantId,
                          Number(e.target.value)
                        )
                      }
                      className="w-16 m-1 border border-gray-400 rounded text-center"
                    />
                  </td>
                  <td>
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
                      className="w-28 border border-gray-400 rounded text-center"
                      placeholder="$ 0"
                    />
                  </td>
                  <td className="text-right pl-4">{formatPrice(p.subtotal)}</td>
                  <td>
                    <button
                      onClick={() => removeProduct(p.inventoryVariantId)}
                      className="text-red-500 ml-2 cursor-pointer font-bold border rounded-full hover:bg-red-100 px-1"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-3 font-semibold">
            Total: {formatPrice(total)}
          </div>
        </div>
      )}
    </div>
  );
}
