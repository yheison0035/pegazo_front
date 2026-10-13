'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/react/24/outline';
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
  // Detalle tipo PDP (producto seleccionado) y visor de imagen con zoom.
  const [detail, setDetail] = useState(null);
  const [detailImg, setDetailImg] = useState(0);
  const [zoom, setZoom] = useState(false); // visor abierto
  const [big, setBig] = useState(false); // nivel de zoom dentro del visor

  const openDetail = (p) => {
    setDetail(p);
    setDetailImg(0);
    setZoom(false);
    setBig(false);
  };
  const detailImages = detail
    ? detail.images?.length
      ? detail.images
      : detail.image
        ? [detail.image]
        : []
    : [];
  const currentImg = detailImages[detailImg] || detailImages[0] || null;

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
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openDetail(p)}
                      className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition hover:shadow-md"
                    >
                      <div className="relative aspect-square w-full bg-gray-50">
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
                            <span className="text-3xl">🛍️</span>
                          </div>
                        )}
                        {p.images?.length > 1 && (
                          <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {p.images.length} fotos
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-3">
                        <h3 className="line-clamp-2 text-sm font-semibold text-gray-800">
                          {p.name}
                        </h3>
                        {/* Etiquetas (features) */}
                        {p.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {p.tags.slice(0, 3).map((tg, i) => (
                              <span
                                key={i}
                                className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                              >
                                {tg}
                              </span>
                            ))}
                          </div>
                        )}
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
                    </button>
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

      {/* Detalle del producto (PDP, solo lectura) */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-3 pt-[5vh] backdrop-blur-sm"
          onClick={() => setDetail(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 overflow-y-auto md:grid-cols-2">
              {/* Galería */}
              <div className="bg-gray-50 p-4">
                <button
                  type="button"
                  onClick={() => {
                    if (currentImg) {
                      setBig(false);
                      setZoom(true);
                    }
                  }}
                  className="group relative block aspect-square w-full overflow-hidden rounded-2xl bg-white ring-1 ring-gray-100"
                  style={{ cursor: currentImg ? 'zoom-in' : 'default' }}
                >
                  {currentImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentImg}
                      alt={detail.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl text-gray-300">
                      🛍️
                    </div>
                  )}
                  {currentImg && (
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                      <MagnifyingGlassPlusIcon className="h-3.5 w-3.5" /> Ampliar
                    </span>
                  )}
                </button>
                {detailImages.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {detailImages.map((u, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setDetailImg(i)}
                        className={`h-14 w-14 flex-none overflow-hidden rounded-lg ring-2 ${
                          i === detailImg ? '' : 'ring-transparent'
                        }`}
                        style={
                          i === detailImg ? { boxShadow: `0 0 0 2px ${accent}` } : undefined
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                {currentImg && (
                  <p className="mt-2 text-center text-[11px] text-gray-400">
                    Toca la imagen para ampliar y hacer zoom
                  </p>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    {detail.name}
                  </h2>
                  <button
                    onClick={() => setDetail(null)}
                    className="flex-none text-gray-400 hover:text-gray-700"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <p
                  className="text-2xl font-extrabold tabular-nums"
                  style={{ color: accent }}
                >
                  {formatCOP(detail.price)}
                </p>
                {detail.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {detail.tags.map((tg, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                      >
                        {tg}
                      </span>
                    ))}
                  </div>
                )}
                {detail.description && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                    {detail.description}
                  </p>
                )}
                {detail.specs?.length > 0 && (
                  <div className="mt-1">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      Especificaciones
                    </p>
                    <dl className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                      {detail.specs.map((s, i) => (
                        <div
                          key={i}
                          className="flex justify-between gap-3 px-3 py-1.5 text-sm"
                        >
                          <dt className="text-gray-500">{s.key}</dt>
                          <dd className="text-right font-medium text-gray-800">
                            {s.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                <p className="mt-auto pt-2 text-[11px] text-gray-400">
                  Catálogo informativo · consulta disponibilidad con el negocio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visor con zoom (lightbox) */}
      {detail && zoom && currentImg && (
        <div
          className="fixed inset-0 z-[60] bg-black/90"
          onClick={() => setZoom(false)}
        >
          <div className="h-full w-full overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex min-h-full min-w-full items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImg}
                alt={detail.name}
                onClick={() => setBig((b) => !b)}
                className={big ? 'w-[180%] max-w-none' : 'max-h-[88vh] max-w-full'}
                style={{ cursor: big ? 'zoom-out' : 'zoom-in' }}
              />
            </div>
          </div>
          <button
            onClick={() => setZoom(false)}
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white ring-1 ring-white/25 hover:bg-white/25"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-white/70">
            Toca la imagen para {big ? 'alejar' : 'acercar'}
          </p>
        </div>
      )}

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
