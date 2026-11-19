import Link from 'next/link';
import { getAllSolutions, SOLUTIONS_BASE } from '@/content/landings/solutions';

export const metadata = {
  title: 'Soluciones por tipo de negocio',
  description:
    'Pegazo se adapta a tu negocio: punto de venta, facturación, inventario y CRM para tiendas, supermercados, restaurantes, barberías, consultorios, ropa, distribuidoras, droguerías y más.',
  keywords: [
    'software por tipo de negocio',
    'software punto de venta',
    'software contable',
    'software de inventario',
    'CRM para negocios',
    'software para pymes Colombia',
  ],
  alternates: { canonical: SOLUTIONS_BASE },
  openGraph: {
    type: 'website',
    url: SOLUTIONS_BASE,
    siteName: 'Pegazo',
    title: 'Soluciones de Pegazo por tipo de negocio',
    description:
      'Punto de venta, facturación, inventario y CRM adaptados a tu tipo de negocio.',
  },
};

export default function SolutionsIndex() {
  const solutions = getAllSolutions();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://pegazo.co' },
          { '@type': 'ListItem', position: 2, name: 'Soluciones', item: SOLUTIONS_BASE },
        ],
      },
      {
        '@type': 'ItemList',
        itemListElement: solutions.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: s.h1,
          url: `${SOLUTIONS_BASE}/${s.slug}`,
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white text-neutral-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-white/10 bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo_pegazo_sm.png"
              alt="Pegazo"
              width={240}
              height={160}
              className="h-7 w-auto"
            />
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-2 text-sm font-bold text-white"
          >
            Crear mi cuenta
          </Link>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-white">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
            <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Un software que se adapta a tu tipo de negocio
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-300">
              Punto de venta, facturación, inventario y CRM en un solo lugar.
              Elige tu negocio y descubre cómo Pegazo trabaja para ti, con tu
              vocabulario y tus funciones.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {solutions.map((s) => (
              <Link
                key={s.slug}
                href={`/soluciones/${s.slug}`}
                className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md"
              >
                <span className="text-xs font-semibold text-orange-600">
                  {s.eyebrow}
                </span>
                <h2 className="mt-1 text-lg font-bold text-neutral-900 group-hover:text-orange-700">
                  {s.h1}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
                  {sliceDescription(s.metaDescription)}
                </p>
                <span className="mt-4 text-sm font-semibold text-orange-600">
                  Ver más →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function sliceDescription(text) {
  if (!text) return '';
  const dot = text.indexOf(':');
  return dot > 30 ? text.slice(0, dot) + '.' : text;
}
