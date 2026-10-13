'use client';

import { useEffect, useMemo, useState } from 'react';
import { getPublicCatalog } from '@/lib/api/routes/inventory';
import { formatCOP } from '@/lib/api/utils/utils';

// Página pública SOLO LECTURA del catálogo/menú de un negocio de productos
// (restaurante, supermercado, zapatería, etc.). Sin carrito ni pedidos: es una
// carta para mostrar o enviar al cliente. Se monta desde /booking/[slug] cuando
// el negocio es de productos (mode === 'catalog').
export default function PublicCatalog({ slug, config = {} }) {
  const accent = config.accent || '#ea580c';
  const name = config.name || 'Catálogo';
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await getPublicCatalog(slug);
        if (!cancel) setGroups(res?.data || []);
      } catch {
        if (!cancel) setGroups([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [slug]);

  const total = useMemo(
    () => groups.reduce((n, g) => n + (g.products?.length || 0), 0),
    [groups],
  );
  const whatsapp = (config.whatsapp || '').replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Encabezado de marca */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-6 text-center">
          {config.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.logo}
              alt={name}
              className="h-16 w-16 rounded-2xl object-contain ring-1 ring-gray-900/10"
            />
          ) : null}
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            {name}
          </h1>
          {config.tagline && (
            <p className="text-sm text-gray-500">{config.tagline}</p>
          )}
          <span
            className="mt-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: accent }}
          >
            Catálogo
          </span>
          <p className="text-[11px] text-gray-400">
            Catálogo informativo · consulta disponibilidad y precios con el
            negocio.
          </p>
        </div>

        {/* Navegación rápida de categorías */}
        {groups.length > 1 && (
          <nav className="mx-auto max-w-5xl overflow-x-auto px-4 pb-3">
            <div className="flex gap-2">
              {groups.map((g) => (
                <a
                  key={g.id}
                  href={`#cat-${g.id}`}
                  onClick={() => setActive(g.id)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active === g.id
                      ? 'border-transparent text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  style={
                    active === g.id ? { backgroundColor: accent } : undefined
                  }
                >
                  {g.title}
                </a>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <p className="py-16 text-center text-sm text-gray-400">
            Cargando catálogo…
          </p>
        ) : total === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <p className="text-sm text-gray-500">
              Este negocio aún no tiene productos publicados.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <section key={g.id} id={`cat-${g.id}`} className="scroll-mt-24">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="h-5 w-1.5 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <h2 className="text-lg font-bold text-gray-800">{g.title}</h2>
                  <span className="text-xs font-semibold text-gray-400">
                    {g.products.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {g.products.map((p) => (
                    <article
                      key={p.id}
                      className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
                    >
                      <div className="aspect-square w-full bg-gray-50">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image}
                            alt={p.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <span className="text-3xl">🍽️</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-3">
                        <h3 className="line-clamp-2 text-sm font-semibold text-gray-800">
                          {p.name}
                        </h3>
                        {p.description && (
                          <p className="line-clamp-2 text-xs text-gray-400">
                            {p.description}
                          </p>
                        )}
                        <p
                          className="mt-auto pt-1 text-base font-extrabold tabular-nums"
                          style={{ color: accent }}
                        >
                          {formatCOP(p.price)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="pb-24 pt-4 text-center text-[11px] text-gray-300">
        Hecho con Pegazo
      </footer>

      {/* Contacto por WhatsApp (no es pedido: solo consultar). */}
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.517 5.248l-.999 3.648 3.971-1.615z" />
          </svg>
          Consultar
        </a>
      )}
    </div>
  );
}
