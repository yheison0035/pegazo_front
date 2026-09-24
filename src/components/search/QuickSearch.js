'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CubeIcon,
  UserIcon,
  ArrowRightIcon,
  PencilSquareIcon,
  ShoppingCartIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/authContext';
import usePermissions from '@/hooks/usePermissions';
import useTerms from '@/hooks/useTerms';
import { quickSearch } from '@/lib/api/routes/search';
import { formatCOP, formatDateSafe } from '@/lib/api/utils/utils';

const MAX_RECENTS = 6;

// Buscador global del CRM (command palette, ⌘K / Ctrl+K, o la tecla "/").
// Productos, clientes y facturas con su info clave; "Ir allá" abre el detalle,
// con acciones rápidas (Editar, Vender) según permisos. Recuerda los últimos
// abiertos (recientes) por usuario y soporta lector de código de barras GLOBAL
// (escanear en cualquier pantalla abre el producto). El diseño es responsive.
export default function QuickSearch() {
  const { usuario } = useAuth();
  const { can } = usePermissions();
  const t = useTerms();
  const router = useRouter();

  const canProducts = can('inventory', 'view');
  const canCustomers = can('customers', 'view');
  const canSales = can('delivered_sales', 'view');
  const canEditProduct = can('inventory', 'edit');
  const canEditCustomer = can('customers', 'edit');
  const canSell = can('sales', 'create');
  const enabled = !!usuario?.id && (canProducts || canCustomers || canSales);

  const recentsKey = `pegazo:qsearch:recents:${usuario?.company?.id || 0}:${usuario?.id || 0}`;

  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ products: [], customers: [], sales: [] });
  const [recents, setRecents] = useState([]);
  const [active, setActive] = useState(0);

  const inputRef = useRef(null);
  const reqId = useRef(0);
  const autojump = useRef(false); // salto directo tras escanear un código

  // Lista plana de resultados visible (para navegar con el teclado).
  const flat = useMemo(() => {
    const products = canProducts ? data.products || [] : [];
    const customers = canCustomers ? data.customers || [] : [];
    const sales = canSales ? data.sales || [] : [];
    return [
      ...products.map((p) => ({ type: 'product', item: p })),
      ...customers.map((c) => ({ type: 'customer', item: c })),
      ...sales.map((s) => ({ type: 'sale', item: s })),
    ];
  }, [data, canProducts, canCustomers, canSales]);

  const loadRecents = useCallback(() => {
    try {
      const raw = localStorage.getItem(recentsKey);
      setRecents(raw ? JSON.parse(raw) : []);
    } catch {
      setRecents([]);
    }
  }, [recentsKey]);

  const remember = useCallback(
    (entry) => {
      try {
        const next = [
          entry,
          ...recents.filter(
            (r) => !(r.type === entry.type && r.item.id === entry.item.id),
          ),
        ].slice(0, MAX_RECENTS);
        setRecents(next);
        localStorage.setItem(recentsKey, JSON.stringify(next));
      } catch {
        /* almacenamiento no disponible */
      }
    },
    [recents, recentsKey],
  );

  const close = useCallback(() => {
    setOpen(false);
    setTerm('');
    setData({ products: [], customers: [], sales: [] });
    setActive(0);
  }, []);

  const routeFor = (entry) => {
    if (entry.type === 'product')
      return `/dashboard/inventory?open=${entry.item.id}`;
    if (entry.type === 'customer')
      return `/dashboard/customers?open=${entry.item.id}`;
    return `/dashboard/delivered_sales?open=${entry.item.id}`;
  };

  const openDetail = useCallback(
    (entry) => {
      if (!entry) return;
      remember(entry);
      router.push(routeFor(entry));
      close();
    },
    [router, close, remember],
  );

  const editEntry = useCallback(
    (entry) => {
      remember(entry);
      const base =
        entry.type === 'product'
          ? '/dashboard/inventory/edit/'
          : '/dashboard/customers/edit/';
      router.push(`${base}${entry.item.id}`);
      close();
    },
    [router, close, remember],
  );

  const sellProduct = useCallback(
    (p) => {
      remember({ type: 'product', item: p });
      router.push(`/dashboard/sales?q=${encodeURIComponent(p.name)}`);
      close();
    },
    [router, close, remember],
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

  // Lector de código de barras GLOBAL: un escáner "teclea" el código muy rápido
  // y termina en Enter. Si eso ocurre fuera de un campo y el buscador está
  // cerrado, abrimos el buscador con ese código y saltamos al producto.
  useEffect(() => {
    if (!enabled || open || !canProducts) return;
    let buf = '';
    let last = 0;
    const onKey = (e) => {
      const el = document.activeElement;
      const typing =
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      const now = Date.now();
      if (now - last > 60) buf = ''; // gap grande = tecleo humano, se reinicia
      last = now;
      if (e.key === 'Enter') {
        if (buf.length >= 6) {
          autojump.current = true;
          setTerm(buf);
          setOpen(true);
        }
        buf = '';
        return;
      }
      if (e.key && e.key.length === 1) buf += e.key;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, open, canProducts]);

  // Al abrir: foco y cargar recientes.
  useEffect(() => {
    if (open) {
      loadRecents();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, loadRecents]);

  // Búsqueda con debounce.
  useEffect(() => {
    if (!open) return;
    const q = term.trim();
    if (q.length < 1) {
      setData({ products: [], customers: [], sales: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    const my = ++reqId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await quickSearch(q);
        if (my !== reqId.current) return;
        const products = res?.products || [];
        setData({
          products,
          customers: res?.customers || [],
          sales: res?.sales || [],
        });
        setActive(0);
        // Salto directo tras escanear: si hay un único producto (o varios), abre
        // el primero automáticamente.
        if (autojump.current) {
          autojump.current = false;
          if (products.length >= 1) {
            openDetail({ type: 'product', item: products[0] });
          }
        }
      } catch {
        if (my === reqId.current)
          setData({ products: [], customers: [], sales: [] });
      } finally {
        if (my === reqId.current) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [term, open, openDetail]);

  // Navegación con teclado dentro de la lista de resultados.
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
      openDetail(flat[active]);
    }
  };

  if (!enabled || !open) return null;

  const q = term.trim();
  const showEmpty = q.length >= 1 && !loading && flat.length === 0;

  const stockBadge = (p) => {
    if (p.stock <= 0) return { text: 'Agotado', cls: 'bg-red-100 text-red-700' };
    if (p.stock <= (p.minStock || 0))
      return { text: `Quedan ${p.stock}`, cls: 'bg-amber-100 text-amber-700' };
    return { text: `${p.stock} disp.`, cls: 'bg-green-100 text-green-700' };
  };

  let idx = -1; // índice global para resaltar el activo

  const ActionBtn = ({ onClick, title, children }) => (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-orange-600"
    >
      {children}
    </button>
  );

  const GoThere = ({ isActive }) => (
    <span
      className={`flex flex-none items-center gap-1 pl-1 text-xs font-medium ${
        isActive ? 'text-orange-600' : 'text-gray-300'
      }`}
    >
      <span className="hidden sm:inline">Ir allá</span>
      <ArrowRightIcon className="h-3.5 w-3.5" />
    </span>
  );

  const ProductRow = ({ p, isActive }) => {
    const badge = stockBadge(p);
    return (
      <div
        onClick={() => openDetail({ type: 'product', item: p })}
        className={`flex cursor-pointer items-start gap-3 px-4 py-2.5 ${
          isActive ? 'bg-orange-50' : 'hover:bg-gray-50'
        }`}
      >
        <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <CubeIcon className="h-5 w-5 text-gray-400" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block break-words text-sm font-medium leading-snug text-gray-800">
            {p.name}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">
              {formatCOP(p.salePrice)}
            </span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}
            >
              {badge.text}
            </span>
            {p.categoryName && (
              <span className="text-gray-400">{p.categoryName}</span>
            )}
          </span>
        </span>
        <span className="flex flex-none items-center gap-1 pt-0.5">
          {canSell && p.stock > 0 && (
            <ActionBtn onClick={() => sellProduct(p)} title="Vender">
              <ShoppingCartIcon className="h-4 w-4" />
            </ActionBtn>
          )}
          {canEditProduct && (
            <ActionBtn
              onClick={() => editEntry({ type: 'product', item: p })}
              title="Editar (precio / stock)"
            >
              <PencilSquareIcon className="h-4 w-4" />
            </ActionBtn>
          )}
          <GoThere isActive={isActive} />
        </span>
      </div>
    );
  };

  const CustomerRow = ({ c, isActive }) => (
    <div
      onClick={() => openDetail({ type: 'customer', item: c })}
      className={`flex cursor-pointer items-start gap-3 px-4 py-2.5 ${
        isActive ? 'bg-orange-50' : 'hover:bg-gray-50'
      }`}
    >
      <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-gray-100">
        <UserIcon className="h-5 w-5 text-gray-400" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-medium leading-snug text-gray-800">
          {c.name}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          {c.phone && <span>{c.phone}</span>}
          {c.document && <span className="text-gray-400">{c.document}</span>}
          {c.city && <span className="text-gray-400">{c.city}</span>}
        </span>
      </span>
      <span className="flex flex-none items-center gap-1 pt-0.5">
        {canEditCustomer && (
          <ActionBtn
            onClick={() => editEntry({ type: 'customer', item: c })}
            title="Editar cliente"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </ActionBtn>
        )}
        <GoThere isActive={isActive} />
      </span>
    </div>
  );

  const SaleRow = ({ s, isActive }) => (
    <div
      onClick={() => openDetail({ type: 'sale', item: s })}
      className={`flex cursor-pointer items-start gap-3 px-4 py-2.5 ${
        isActive ? 'bg-orange-50' : 'hover:bg-gray-50'
      }`}
    >
      <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-gray-100">
        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-medium leading-snug text-gray-800">
          {s.code}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <span className="font-semibold text-gray-700">
            {formatCOP(s.totalAmount)}
          </span>
          {s.customerName && (
            <span className="text-gray-400">{s.customerName}</span>
          )}
          {s.createdAt && (
            <span className="text-gray-400">{formatDateSafe(s.createdAt)}</span>
          )}
        </span>
      </span>
      <GoThere isActive={isActive} />
    </div>
  );

  const RecentRow = ({ r }) => {
    if (r.type === 'product') return <ProductRow p={r.item} isActive={false} />;
    if (r.type === 'customer')
      return <CustomerRow c={r.item} isActive={false} />;
    return <SaleRow s={r.item} isActive={false} />;
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 p-3 pt-[8vh] backdrop-blur-[1px] sm:p-4 sm:pt-[10vh]"
      onClick={close}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Campo de búsqueda */}
        <div className="flex flex-none items-center gap-2 border-b border-gray-100 px-4">
          <MagnifyingGlassIcon className="h-5 w-5 flex-none text-gray-400" />
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar producto, cliente, factura o código…"
            className="w-full bg-transparent py-4 text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none"
          />
          {loading && (
            <span className="h-4 w-4 flex-none animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
          )}
          <button
            onClick={close}
            className="flex-none rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Resultados */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* Sin término: recientes o ayuda */}
          {q.length < 1 && recents.length > 0 && (
            <div className="py-1">
              <p className="flex items-center gap-1 px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                <ClockIcon className="h-3.5 w-3.5" /> Recientes
              </p>
              {recents.map((r) => (
                <RecentRow key={`r-${r.type}-${r.item.id}`} r={r} />
              ))}
            </div>
          )}

          {q.length < 1 && recents.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-gray-400">
              Escribe un nombre, código de barras, cliente o factura.
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
                return (
                  <ProductRow key={`p-${p.id}`} p={p} isActive={idx === active} />
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
                return (
                  <CustomerRow key={`c-${c.id}`} c={c} isActive={idx === active} />
                );
              })}
            </div>
          )}

          {/* FACTURAS */}
          {canSales && (data.sales?.length || 0) > 0 && (
            <div className="py-1">
              <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Facturas
              </p>
              {data.sales.map((s) => {
                idx++;
                return <SaleRow key={`s-${s.id}`} s={s} isActive={idx === active} />;
              })}
            </div>
          )}
        </div>

        {/* Pie con atajos (solo en pantallas grandes) */}
        <div className="hidden flex-none items-center justify-between border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400 sm:flex">
          <span>↑↓ moverse · Enter ir · Esc cerrar</span>
          <span>Escanea un código para encontrarlo al instante</span>
        </div>
      </div>
    </div>
  );
}
