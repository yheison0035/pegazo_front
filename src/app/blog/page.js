import Link from 'next/link';
import { getAllPosts, BLOG_BASE } from '@/content/blog/posts';

export const metadata = {
  title: 'Blog · Consejos para hacer crecer tu negocio',
  description:
    'Guías prácticas para vender más y controlar tu negocio: punto de venta, inventario, fiado y cartera, citas, facturación y más. Del equipo de Pegazo.',
  keywords: [
    'blog de negocios',
    'software POS',
    'control de inventario',
    'fiado y cartera',
    'software para pymes Colombia',
  ],
  alternates: { canonical: BLOG_BASE },
  openGraph: {
    type: 'website',
    url: BLOG_BASE,
    siteName: 'Pegazo',
    title: 'Blog de Pegazo · Consejos para hacer crecer tu negocio',
    description:
      'Guías prácticas para vender más y controlar tu negocio: POS, inventario, fiado, citas, facturación y más.',
  },
};

function fmt(date) {
  try {
    return new Date(date).toLocaleDateString('es-CO', {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function BlogIndex() {
  const posts = getAllPosts();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${BLOG_BASE}#blog`,
    name: 'Blog de Pegazo',
    url: BLOG_BASE,
    inLanguage: 'es-CO',
    publisher: { '@id': 'https://pegazo.co/#organization' },
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${BLOG_BASE}/${p.slug}`,
      datePublished: p.date,
      dateModified: p.updated || p.date,
      description: p.description,
    })),
  };

  return (
    <div className="min-h-screen bg-white text-neutral-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-neutral-100 bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo_pegazo.png" alt="Pegazo" className="h-7 w-auto" />
            <span className="text-lg font-extrabold">Pegazo</span>
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-2 text-sm font-bold text-white"
          >
            Empieza gratis
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="mb-6 text-sm text-neutral-500">
          <Link href="/" className="hover:text-orange-600">
            Inicio
          </Link>{' '}
          · <span className="text-neutral-700">Blog</span>
        </nav>

        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          Consejos para hacer crecer tu negocio
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-neutral-600">
          Guías prácticas, sin relleno, sobre punto de venta, inventario, fiado,
          citas y todo lo que mueve tu negocio. Escritas por el equipo de Pegazo.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {posts.map((p) => (
            <article
              key={p.slug}
              className="group flex flex-col rounded-2xl border border-neutral-200 p-6 transition hover:border-orange-300 hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
                <time dateTime={p.date}>{fmt(p.date)}</time>
                <span>·</span>
                <span>{p.readingMinutes} min de lectura</span>
              </div>
              <h2 className="text-xl font-bold leading-snug text-neutral-900 group-hover:text-orange-600">
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              </h2>
              <p className="mt-2 flex-1 text-sm text-neutral-600">{p.excerpt}</p>
              <Link
                href={`/blog/${p.slug}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange-600"
              >
                Leer artículo →
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-2xl bg-neutral-950 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Todo tu negocio, en un solo lugar</h2>
          <p className="mx-auto mt-2 max-w-xl text-neutral-300">
            Ventas, inventario, clientes, citas, cartera y tu tienda online.
            Empieza hoy.
          </p>
          <Link
            href="/register"
            className="mt-5 inline-block rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-3 font-bold text-white"
          >
            Crear mi cuenta
          </Link>
        </div>
      </main>
    </div>
  );
}
