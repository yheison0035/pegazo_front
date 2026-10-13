'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  MagnifyingGlassPlusIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { getPublicCatalog } from '@/lib/api/routes/inventory';
import { formatCOP } from '@/lib/api/utils/utils';

// Temas visuales del catálogo/menú público (como los "skins" de la página de
// citas). Cada tema define las variables de color de la página. El color de
// acento del negocio (config.accent) manda sobre el acento del tema.
export const CATALOG_THEMES = {
  clean: {
    key: 'clean',
    label: 'Claro profesional',
    desc: 'Blanco y aireado. Sirve para cualquier negocio.',
    accent: '#ea580c',
    bg: '#f7f7f8',
    surface: '#ffffff',
    text: '#111827',
    muted: '#6b7280',
    border: '#ececef',
    dark: false,
    heroBg: '#0b0b0f',
  },
  dark: {
    key: 'dark',
    label: 'Elegante oscuro',
    desc: 'Negro premium. Ideal joyería, tecnología, moda.',
    accent: '#d4af37',
    bg: '#0d0d12',
    surface: '#16161d',
    text: '#f5f5f7',
    muted: '#9aa0ab',
    border: '#272733',
    dark: true,
    heroBg: '#050507',
  },
  warm: {
    key: 'warm',
    label: 'Cálido gourmet',
    desc: 'Crema y terracota. Ideal restaurante, cafetería.',
    accent: '#b45309',
    bg: '#fbf7f1',
    surface: '#ffffff',
    text: '#2a1f1a',
    muted: '#8a7566',
    border: '#efe4d8',
    dark: false,
    heroBg: '#1c140e',
  },
  fresh: {
    key: 'fresh',
    label: 'Fresco natural',
    desc: 'Verde suave. Ideal supermercado, saludable.',
    accent: '#16a34a',
    bg: '#f3f8f4',
    surface: '#ffffff',
    text: '#14291d',
    muted: '#5e7a67',
    border: '#dcebe1',
    dark: false,
    heroBg: '#0a1a12',
  },
  bold: {
    key: 'bold',
    label: 'Moderno vibrante',
    desc: 'Azul profundo y contraste. Ideal tecnología, deporte.',
    accent: '#6366f1',
    bg: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    muted: '#94a3b8',
    border: '#334155',
    dark: true,
    heroBg: '#070b17',
  },
};

// Página pública SOLO LECTURA del catálogo/menú de un negocio de productos
// (restaurante, supermercado, zapatería, etc.). Sin carrito ni pedidos: es una
// carta para mostrar o enviar al cliente. Se monta desde /booking/[slug] cuando
// el negocio es de productos (mode === 'catalog').
export default function PublicCatalog({ slug, config = {} }) {
  const theme = CATALOG_THEMES[config.catalogTheme] || CATALOG_THEMES.clean;
  const accent = config.accent || theme.accent;
  const name = config.name || 'Catálogo';
  // Variables de color del tema (se aplican en el contenedor raíz).
  const vars = {
    '--c-bg': theme.bg,
    '--c-surface': theme.surface,
    '--c-text': theme.text,
    '--c-muted': theme.muted,
    '--c-border': theme.border,
    '--c-accent': accent,
  };
  // Portada: imagen de fondo del negocio si existe; si no, degradado con acento.
  const heroImg = config.heroImage || '';
  const heroStyle = heroImg
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,.55), rgba(5,5,8,.82)), url(${heroImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: `radial-gradient(1200px 600px at 50% -10%, ${accent}${
          theme.dark ? '40' : '26'
        }, ${theme.heroBg} 58%)`,
      };
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

  // Palabra según la vertical: comida = "carta/menú", resto = "catálogo".
  const isFood = ['RESTAURANTE', 'COMIDA_RAPIDA', 'CAFETERIA'].includes(
    String(config.type || '').toUpperCase(),
  );
  const word = isFood ? 'carta' : 'catálogo';

  // Buscador del catálogo.
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const visibleGroups = useMemo(() => {
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        products: g.products.filter((p) =>
          `${p.name} ${p.description || ''}`.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.products.length > 0);
  }, [groups, q]);

  // Estado de un producto: menú usa "disponible"; productos (con control de
  // stock) usan "en stock / agotado". Elaborados sin stock no muestran etiqueta.
  const soldOut = (p) =>
    isFood
      ? p.available === false
      : p.available === false || (p.trackStock && (p.stock ?? 0) <= 0);
  const stateLabel = (p) => {
    if (isFood) return p.available === false ? 'No disponible' : 'Disponible';
    if (!p.trackStock) return null;
    return (p.stock ?? 0) <= 0 ? 'Agotado' : 'Disponible';
  };

  // Bienvenida (portada) al cargar, estilo RAGNOR, adaptada al tipo.
  const [entered, setEntered] = useState(false);

  // Barra de categorías: se imprimen las que CABEN y el resto va en un menú
  // "Más categorías" (como la tienda online). Se mide el ancho real.
  const catBarRef = useRef(null);
  const catMeasureRef = useRef(null);
  const [visibleCats, setVisibleCats] = useState(999);
  const [catMenuOpen, setCatMenuOpen] = useState(false);

  useEffect(() => {
    const compute = () => {
      const bar = catBarRef.current;
      const measure = catMeasureRef.current;
      if (!bar || !measure) return;
      const avail = bar.clientWidth;
      const chips = Array.from(measure.children);
      const GAP = 8;
      const totalW = chips.reduce((a, c) => a + c.offsetWidth + GAP, 0);
      if (totalW <= avail) {
        setVisibleCats(chips.length);
        return;
      }
      const RESERVE = 150; // deja espacio para el botón "Más categorías"
      let used = 0;
      let count = 0;
      for (const c of chips) {
        used += c.offsetWidth + GAP;
        if (used > avail - RESERVE) break;
        count++;
      }
      setVisibleCats(Math.max(1, count));
    };
    compute();
    let ro;
    if (typeof ResizeObserver !== 'undefined' && catBarRef.current) {
      ro = new ResizeObserver(compute);
      ro.observe(catBarRef.current);
    }
    window.addEventListener('resize', compute);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [visibleGroups, entered]);

  if (!entered) {
    return (
      <div
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
        style={heroStyle}
      >
        <div className="flex flex-col items-center gap-5 text-white">
          {config.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.logo}
              alt={name}
              className="h-24 w-24 rounded-3xl object-contain bg-white/5 p-1 ring-1 ring-white/15"
            />
          ) : null}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50">
              Bienvenido a
            </p>
            <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{name}</h1>
            {config.tagline && (
              <p className="mt-2 text-sm text-white/70">{config.tagline}</p>
            )}
          </div>
          <button
            onClick={() => setEntered(true)}
            className="rounded-full px-8 py-3 text-sm font-bold text-white shadow-xl transition hover:brightness-110"
            style={{ backgroundColor: accent }}
          >
            Ver {isFood ? 'la carta' : 'el catálogo'}
          </button>
          <p className="text-[11px] text-white/40">
            {word === 'carta' ? 'Nuestra carta' : 'Nuestro catálogo'} · solo
            visualización
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]"
      style={vars}
    >
      {/* Encabezado de marca */}
      <header className="border-b border-[var(--c-border)] bg-[var(--c-surface)]">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-6 text-center">
          {config.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.logo}
              alt={name}
              className="h-16 w-16 rounded-2xl object-contain ring-1 ring-black/10"
            />
          ) : null}
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--c-text)] sm:text-2xl">
            {name}
          </h1>
          {config.tagline && (
            <p className="text-sm text-[var(--c-muted)]">{config.tagline}</p>
          )}
          <span
            className="mt-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: accent }}
          >
            {isFood ? 'Carta' : 'Catálogo'}
          </span>
          <p className="text-[11px] text-[var(--c-muted)]">
            {isFood ? 'Carta' : 'Catálogo'} informativo · consulta
            disponibilidad y precios con el negocio.
          </p>
        </div>
      </header>

      {/* Barra FIJA: buscador + categorías (queda pegada arriba al desplazar) */}
      <div className="sticky top-0 z-30 border-b border-[var(--c-border)] bg-[var(--c-surface)]/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-5xl space-y-2 px-4 py-2.5">
          {/* Buscador */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Buscar en ${isFood ? 'la carta' : 'el catálogo'}…`}
              className="w-full rounded-full border border-[var(--c-border)] bg-[var(--c-bg)] py-2 pl-9 pr-9 text-sm text-[var(--c-text)] placeholder:text-[var(--c-muted)] focus:outline-none focus:ring-2 focus:ring-black/5"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--c-muted)] hover:opacity-70"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Categorías: se imprimen las que CABEN según el ancho real;
              el resto se agrupa en un menú "Más categorías". */}
          {visibleGroups.length > 1 && (
            <div className="relative">
              {/* fila visible (medida): recorta a las que caben */}
              <div
                ref={catBarRef}
                className="flex items-center gap-2 overflow-hidden"
              >
                {visibleGroups.slice(0, visibleCats).map((g) => (
                  <a
                    key={g.id}
                    href={`#cat-${g.id}`}
                    onClick={() => setActive(g.id)}
                    className={`flex-none whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active === g.id
                        ? 'border-transparent text-white'
                        : 'border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-muted)] hover:opacity-80'
                    }`}
                    style={
                      active === g.id ? { backgroundColor: accent } : undefined
                    }
                  >
                    {g.title}
                  </a>
                ))}
                {visibleCats < visibleGroups.length && (
                  <button
                    type="button"
                    onClick={() => setCatMenuOpen((o) => !o)}
                    className={`flex-none inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      catMenuOpen
                        ? 'border-[var(--c-accent)] text-[var(--c-text)]'
                        : 'border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-muted)] hover:opacity-80'
                    }`}
                  >
                    Más categorías ({visibleGroups.length - visibleCats})
                    <ChevronDownIcon
                      className={`h-3.5 w-3.5 transition ${catMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
              </div>

              {/* fila oculta solo para medir el ancho de cada chip */}
              <div
                ref={catMeasureRef}
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 -z-10 flex gap-2 opacity-0"
              >
                {visibleGroups.map((g) => (
                  <span
                    key={g.id}
                    className="flex-none whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold"
                  >
                    {g.title}
                  </span>
                ))}
              </div>

              {/* menú desplegable con las categorías restantes */}
              {catMenuOpen && visibleCats < visibleGroups.length && (
                <>
                  <button
                    type="button"
                    aria-label="Cerrar"
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setCatMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-40 mt-2 max-h-72 w-56 overflow-y-auto rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-1.5 shadow-xl">
                    {visibleGroups.slice(visibleCats).map((g) => (
                      <a
                        key={g.id}
                        href={`#cat-${g.id}`}
                        onClick={() => {
                          setActive(g.id);
                          setCatMenuOpen(false);
                        }}
                        className={`block rounded-lg px-3 py-2 text-sm transition ${
                          active === g.id
                            ? 'font-semibold text-white'
                            : 'text-[var(--c-text)] hover:opacity-70'
                        }`}
                        style={
                          active === g.id
                            ? { backgroundColor: accent }
                            : undefined
                        }
                      >
                        {g.title}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <p className="py-16 text-center text-sm text-[var(--c-muted)]">
            Cargando catálogo…
          </p>
        ) : total === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-surface)] py-16 text-center">
            <p className="text-sm text-[var(--c-muted)]">
              Este negocio aún no tiene productos publicados.
            </p>
          </div>
        ) : visibleGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-surface)] py-16 text-center">
            <p className="text-sm text-[var(--c-muted)]">
              No encontramos resultados para “{query}”.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {visibleGroups.map((g) => (
              <section key={g.id} id={`cat-${g.id}`} className="scroll-mt-24">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="h-5 w-1.5 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <h2 className="text-lg font-bold text-[var(--c-text)]">
                    {g.title}
                  </h2>
                  <span className="text-xs font-semibold text-[var(--c-muted)]">
                    {g.products.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {g.products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openDetail(p)}
                      className="flex flex-col overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] text-left shadow-sm transition hover:shadow-md"
                    >
                      <div className="relative aspect-square w-full bg-[var(--c-bg)]">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image}
                            alt={p.name}
                            loading="lazy"
                            className={`h-full w-full object-cover ${
                              soldOut(p) ? 'opacity-50 grayscale' : ''
                            }`}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[var(--c-muted)] opacity-50">
                            <span className="text-3xl">🛍️</span>
                          </div>
                        )}
                        {/* Disponibilidad: stock (productos) o disponible (menú) */}
                        {stateLabel(p) && (
                          <span
                            className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              soldOut(p)
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {stateLabel(p)}
                          </span>
                        )}
                        {p.images?.length > 1 && (
                          <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {p.images.length} fotos
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-3">
                        <h3 className="line-clamp-2 text-sm font-semibold text-[var(--c-text)]">
                          {p.name}
                        </h3>
                        {/* Etiquetas (features) */}
                        {p.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {p.tags.slice(0, 3).map((tg, i) => (
                              <span
                                key={i}
                                className="rounded-full bg-[var(--c-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--c-muted)]"
                              >
                                {tg}
                              </span>
                            ))}
                          </div>
                        )}
                        {p.description && (
                          <p className="line-clamp-2 text-xs text-[var(--c-muted)]">
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

      <footer className="pb-24 pt-4 text-center text-[11px] text-[var(--c-muted)] opacity-70">
        Hecho con Pegazo
      </footer>

      {/* Detalle del producto (PDP, solo lectura) */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-3 pt-[5vh] backdrop-blur-sm"
          onClick={() => setDetail(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-[var(--c-surface)] text-[var(--c-text)] shadow-2xl"
            style={vars}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 overflow-y-auto md:grid-cols-2">
              {/* Galería */}
              <div className="bg-[var(--c-bg)] p-4">
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
                  <p className="mt-2 text-center text-[11px] text-[var(--c-muted)]">
                    Toca la imagen para ampliar y hacer zoom
                  </p>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold text-[var(--c-text)]">
                    {detail.name}
                  </h2>
                  <button
                    onClick={() => setDetail(null)}
                    className="flex-none text-[var(--c-muted)] hover:opacity-70"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className="text-2xl font-extrabold tabular-nums"
                    style={{ color: accent }}
                  >
                    {formatCOP(detail.price)}
                  </p>
                  {stateLabel(detail) && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        soldOut(detail)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {stateLabel(detail)}
                    </span>
                  )}
                </div>
                {detail.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {detail.tags.map((tg, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-[var(--c-bg)] px-2.5 py-1 text-xs font-medium text-[var(--c-muted)]"
                      >
                        {tg}
                      </span>
                    ))}
                  </div>
                )}
                {detail.description && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--c-text)] opacity-90">
                    {detail.description}
                  </p>
                )}
                {detail.specs?.length > 0 && (
                  <div className="mt-1">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--c-muted)]">
                      Especificaciones
                    </p>
                    <dl className="divide-y divide-[var(--c-border)] rounded-xl border border-[var(--c-border)]">
                      {detail.specs.map((s, i) => (
                        <div
                          key={i}
                          className="flex justify-between gap-3 px-3 py-1.5 text-sm"
                        >
                          <dt className="text-[var(--c-muted)]">{s.key}</dt>
                          <dd className="text-right font-medium text-[var(--c-text)]">
                            {s.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                <p className="mt-auto pt-2 text-[11px] text-[var(--c-muted)]">
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
