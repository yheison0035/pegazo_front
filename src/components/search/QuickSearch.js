'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CubeIcon,
  UserIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import usePermissions from '@/hooks/usePermissions';
import useTerms from '@/hooks/useTerms';
import { quickSearch } from '@/lib/api/routes/search';
import { formatCOP } from '@/lib/api/utils/utils';

// Buscador global del CRM (command palette, ⌘K / Ctrl+K, o la tecla "/").
// Muestra productos y clientes con su info clave (precio, stock que queda) sin
// entrar al módulo; "Ir allá" abre el detalle en su módulo. Se abre también con
// el evento 'pegazo-open-search' (lo dispara la barra fija del layout).
export default function QuickSearch() {
  const { usuario } = useAuth();
  const { can } = usePermissions();
  const t = useTerms();
  const router = useRouter();

  const canProducts = can('inventory', 'read');
  const canCustomers = can('customers', 'read');
  const enabled = !!usuario?.id && (canProducts || canCustomers);

  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ products: [], customers: [] });
  const [active, setActive] = useState(0);

  const inputRef = useRef(null);
  const reqId = useRef(0);

  // Lista plana de resultados (para navegar con el teclado).
  const flat = useMemo(() => {
    const products = canProducts ? data.products || [] : [];
    const customers = canCustomers ? data.customers || [] : [];
    return [
      ...products.map((p) => ({ type: 'product', item: p })),
      ...customers.map((c) => ({ type: 'customer', item: c })),
    ];
  }, [data, canProducts, canCustomers]);

  const close = useCallback(() => {
    setOpen(false);
    setTerm('');
    setData({ products: [], customers: [] });
    setActive(0);
  }, []);

  const goTo = useCallback(
    (entry) => {
      if (!entry) return;
      if (entry.type === 'product') {
        router.push(`/dashboard/inventory?open=${entry.item.id}`);
      } else {
        router.push(`/dashboard/customers?open=${entry.item.id}`);
      }
      close();
    },
    [router, close],
  );

  // Abrir con ⌘K / Ctrl+K o "/" (si no se está escribiendo en otro campo).
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => {
      const k = e.key?.toLowerCase();
      const metaK = (e.metaKey || e.ctrlKey) && k === 'k';
      const el = document.activeElement;
      const typing =
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable);
      const slash = k === '/' && !typing;
      if (metaK || slash) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pegazo-open-search', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pegazo-open-search', onOpen);
    };
  }, [enabled]);

  // Foco al abrir.
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Búsqueda con debounce.
  useEffect(() => {
    if (!open) return;
    const q = term.trim();
    if (q.length < 1) {
      setData({ products: [], customers: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    const my = ++reqId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await quickSearch(q);
        if (my !== reqId.current) return; // llegó una respuesta vieja
        setData({
          products: res?.products || [],
          customers: res?.customers || [],
        });
        setActive(0);
      } catch {
        if (my === reqId.current) setData({ products: [], customers: [] });
      } finally {
        if (my === reqId.current) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [term, open]);

  // Navegación con teclado dentro de la lista.
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (!flat.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + flat.length) % flat.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      goTo(flat[active]);
    }
  };

  if (!enabled || !open) return null;

  const q = term.trim();
  const showEmpty = q.length >= 1 && !loading && flat.length === 0;

  const stockBadge = (p) => {
    if (p.stock <= 0)
      return { text: 'Agotado', cls: 'bg-red-100 text-red-700' };
    if (p.stock <= (p.minStock || 0))
      return {
        text: `Quedan ${p.stock}`,
        cls: 'bg-amber-100 text-amber-700',
      };
    return { text: `${p.stock} disp.`, cls: 'bg-green-100 text-green-700' };
  };

  let idx = -1; // índice global para resaltar el activo

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 p-4 pt-[10vh] backdrop-blur-[1px]"
      onClick={close}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Campo de búsqueda */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-4">
          <MagnifyingGlassIcon className="h-5 w-5 flex-none text-gray-400" />
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Buscar ${t.productPlural?.toLowerCase() || 'productos'}, clientes, código…`}
            className="w-full bg-transparent py-4 text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none"
          />
          {loading && (
            <span className="h-4 w-4 flex-none animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
          )}
          <button
            onClick={close}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Resultados */}
        <div className="max-h-[60vh] overflow-y-auto">
          {q.length < 1 && (
            <div className="px-4 py-10 text-center text-sm text-gray-400">
              Escribe un nombre, código de barras o cliente.
              <div className="mt-2 text-xs text-gray-300">
                ↑↓ para moverte · Enter para ir · Esc para cerrar
              </div>
            </div>
          )}

          {showEmpty && (
            <div className="px-4 py-10 text-center text-sm text-gray-400">
              No se encontró nada para “{q}”.
            </div>
          )}

          {/* PRODUCTOS */}
          {canProducts && (data.products?.length || 0) > 0 && (
            <div className="py-1">
              <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {t.productPlural || 'Productos'}
              </p>
              {data.products.map((p) => {
                idx++;
                const isActive = idx === active;
                const badge = stockBadge(p);
                return (
                  <button
                    key={`p-${p.id}`}
                    onClick={() => goTo({ type: 'product', item: p })}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${
                      isActive ? 'bg-orange-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <CubeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-800">
                        {p.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">
                          {formatCOP(p.salePrice)}
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}
                        >
                          {badge.text}
                        </span>
                        {p.categoryName && (
                          <span className="truncate text-gray-400">
                            {p.categoryName}
                          </span>
                        )}
                      </span>
                    </span>
                    <span
                      className={`flex flex-none items-center gap-1 text-xs font-medium ${
                        isActive ? 'text-orange-600' : 'text-gray-300'
                      }`}
                    >
                      Ir allá <ArrowRightIcon className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* CLIENTES */}
          {canCustomers && (data.customers?.length || 0) > 0 && (
            <div className="py-1">
              <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Clientes
              </p>
              {data.customers.map((c) => {
                idx++;
                const isActive = idx === active;
                return (
                  <button
                    key={`c-${c.id}`}
                    onClick={() => goTo({ type: 'customer', item: c })}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${
                      isActive ? 'bg-orange-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-gray-100">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-800">
                        {c.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                        {c.phone && <span>{c.phone}</span>}
                        {c.document && (
                          <span className="text-gray-400">{c.document}</span>
                        )}
                        {c.city && (
                          <span className="truncate text-gray-400">
                            {c.city}
                          </span>
                        )}
                      </span>
                    </span>
                    <span
                      className={`flex flex-none items-center gap-1 text-xs font-medium ${
                        isActive ? 'text-orange-600' : 'text-gray-300'
                      }`}
                    >
                      Ir allá <ArrowRightIcon className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
