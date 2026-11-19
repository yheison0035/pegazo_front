import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllSolutions,
  getSolutionBySlug,
  SOLUTIONS_BASE,
} from '@/content/landings/solutions';

export function generateStaticParams() {
  return getAllSolutions().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const sol = getSolutionBySlug(slug);
  if (!sol) return { title: 'Solución no encontrada' };
  const url = `${SOLUTIONS_BASE}/${sol.slug}`;
  return {
    title: sol.metaTitle,
    description: sol.metaDescription,
    keywords: sol.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      siteName: 'Pegazo',
      title: sol.metaTitle,
      description: sol.metaDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: sol.metaTitle,
      description: sol.metaDescription,
    },
  };
}

export default async function SolutionPage({ params }) {
  const { slug } = await params;
  const sol = getSolutionBySlug(slug);
  if (!sol) notFound();

  const url = `${SOLUTIONS_BASE}/${sol.slug}`;
  const related = (sol.related || [])
    .map((s) => getSolutionBySlug(s))
    .filter(Boolean);

  const graph = [
    {
      '@type': 'SoftwareApplication',
      '@id': `${url}#app`,
      name: 'Pegazo',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: sol.metaDescription,
      url,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'COP',
        price: '150000',
        category: 'subscription',
      },
      publisher: { '@id': 'https://pegazo.co/#organization' },
      inLanguage: 'es-CO',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://pegazo.co' },
        { '@type': 'ListItem', position: 2, name: 'Soluciones', item: SOLUTIONS_BASE },
        { '@type': 'ListItem', position: 3, name: sol.h1, item: url },
      ],
    },
  ];
  if (sol.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: sol.faq.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
  }
  const jsonLd = { '@context': 'https://schema.org', '@graph': graph };

  return (
    <div className="min-h-screen bg-white text-neutral-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER */}
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
        {/* HERO */}
        <section className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-white">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
            <nav className="mb-5 text-sm text-neutral-400">
              <Link href="/" className="hover:text-orange-400">
                Inicio
              </Link>{' '}
              ·{' '}
              <Link href="/soluciones" className="hover:text-orange-400">
                Soluciones
              </Link>
            </nav>
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-orange-300">
              {sol.eyebrow}
            </span>
            <h1 className="mt-4 max-w-3xl text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {sol.h1}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-300">
              {sol.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-3 font-bold text-white shadow hover:opacity-90"
              >
                Crear mi cuenta
              </Link>
              <Link
                href="/#planes"
                className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/5"
              >
                Ver plan Órbita
              </Link>
            </div>
          </div>
        </section>

        {/* FUNCIONES */}
        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            Lo que Pegazo hace por ti
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sol.features.map(([title, desc]) => (
              <div
                key={title}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-bold text-neutral-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {desc}
                </p>
              </div>
            ))}
          </div>
          {sol.closing ? (
            <p className="mt-8 rounded-2xl bg-orange-50 p-5 text-neutral-800">
              {sol.closing}
            </p>
          ) : null}
        </section>

        {/* FAQ */}
        {sol.faq?.length ? (
          <section className="bg-neutral-50">
            <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
              <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
                Preguntas frecuentes
              </h2>
              <div className="mt-6 space-y-3">
                {sol.faq.map(([q, a], i) => (
                  <details
                    key={i}
                    open={i === 0}
                    className="rounded-xl border border-neutral-200 bg-white p-4"
                  >
                    <summary className="cursor-pointer font-semibold text-neutral-900">
                      {q}
                    </summary>
                    <p className="mt-2 text-neutral-700">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="rounded-3xl bg-neutral-950 p-8 text-center text-white sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Tu negocio, en un solo lugar
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-neutral-300">
              Nuestro CRM se adapta a tu negocio, no tu negocio al CRM. Empieza hoy
              con el plan Órbita.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-block rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-7 py-3 font-bold text-white"
            >
              Crear mi cuenta
            </Link>
          </div>
        </section>

        {/* RELACIONADAS (enlaces internos) */}
        {related.length ? (
          <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
            <h2 className="text-lg font-bold text-neutral-900">
              Soluciones relacionadas
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/soluciones/${r.slug}`}
                  className="rounded-xl border border-neutral-200 p-4 transition hover:border-orange-300 hover:shadow-sm"
                >
                  <p className="text-xs font-semibold text-orange-600">
                    {r.eyebrow}
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900">{r.h1}</p>
                </Link>
              ))}
            </div>
            <p className="mt-6 text-sm text-neutral-500">
              ¿Buscas otra cosa?{' '}
              <Link href="/soluciones" className="font-semibold text-orange-600">
                Ver todas las soluciones
              </Link>{' '}
              o leer el{' '}
              <Link href="/blog" className="font-semibold text-orange-600">
                blog
              </Link>
              .
            </p>
          </section>
        ) : null}
      </main>
    </div>
  );
}
