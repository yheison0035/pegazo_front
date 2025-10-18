'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/api/utils/utils';

const mockProducts = [
  { id: 1, name: 'Hidrolavadora Karcher K2', price: 350000 },
  { id: 2, name: 'Pulidora Industrial 1500W', price: 420000 },
  { id: 3, name: 'Aspiradora Electrolux 1600W', price: 280000 },
  { id: 4, name: 'Taladro Percutor Bosch', price: 310000 },
];

export default function ProductSelector({ value = [], onChange, disabled }) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(value);

  useEffect(() => {
    if (search.trim() === '') {
      setFiltered([]);
    } else {
      setFiltered(
        mockProducts.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search]);

  const handleSelectProduct = (product) => {
    const exists = selectedProducts.find((p) => p.id === product.id);
    if (exists) return;

    const newList = [
      ...selectedProducts,
      { ...product, quantity: 1, discount: 0, subtotal: product.price },
    ];
    setSelectedProducts(newList);
    setSearch('');
    setFiltered([]);
    onChange?.(newList);
  };

  const updateField = (id, field, value) => {
    const updated = selectedProducts.map((p) => {
      if (p.id === id) {
        const val =
          field === 'discount' ? parseFloat(value) || 0 : parseInt(value) || 1;
        const newSubtotal = p.price * p.quantity - (p.price * p.discount) / 100;
        return {
          ...p,
          [field]: val,
          subtotal: p.price * p.quantity - (p.price * val) / 100,
        };
      }
      return p;
    });
    setSelectedProducts(updated);
    onChange?.(updated);
  };

  const removeProduct = (id) => {
    const updated = selectedProducts.filter((p) => p.id !== id);
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
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500"
        />
        {filtered.length > 0 ? (
          <ul className="absolute z-10 bg-white border border-gray-200 w-full rounded-xl mt-1 shadow-md max-h-48 overflow-auto">
            {filtered.map((product) => (
              <li
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className="px-4 py-2 hover:bg-orange-50 cursor-pointer text-sm text-gray-700"
              >
                {product.name} — {formatPrice(product.price)}
              </li>
            ))}
          </ul>
        ) : search.trim() !== '' ? (
          <div className="absolute z-10 bg-white border border-gray-200 w-full rounded-xl mt-1 shadow-md px-4 py-2 text-sm text-gray-400">
            Producto no encontrado
          </div>
        ) : null}
      </div>

      {selectedProducts.length > 0 && (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-600 text-left border-b">
                <th className="py-1">Producto</th>
                <th className="py-1">Precio</th>
                <th className="py-1">Cant.</th>
                <th className="py-1">Desc (%)</th>
                <th className="py-1 text-right">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2">{p.name}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td>
                    <input
                      type="number"
                      value={p.quantity}
                      min={1}
                      onChange={(e) =>
                        updateField(p.id, 'quantity', e.target.value)
                      }
                      className="w-16 border rounded-md text-center"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={p.discount}
                      min={0}
                      max={100}
                      onChange={(e) =>
                        updateField(p.id, 'discount', e.target.value)
                      }
                      className="w-16 border rounded-md text-center"
                    />
                  </td>
                  <td className="text-right font-medium text-gray-700">
                    {formatPrice(p.subtotal)}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => removeProduct(p.id)}
                      type="button"
                      className="text-red-500 hover:text-red-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-3 font-semibold text-gray-800">
            Total: {formatPrice(total)}
          </div>
        </div>
      )}
    </div>
  );
}
