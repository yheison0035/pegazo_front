import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllPosts,
  getPostBySlug,
  BLOG_BASE,
} from '@/content/blog/posts';

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Artículo no encontrado' };
  const url = `${BLOG_BASE}/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: 'Pegazo',
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

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

export default async function BlogArticle({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const url = `${BLOG_BASE}/${post.slug}`;
  const others = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  const graph = [
    {
      '@type': 'BlogPosting',
      '@id': `${url}#article`,
      headline: post.title,
      description: post.description,
      url,
      datePublished: post.date,
      dateModified: post.updated || post.date,
      inLanguage: 'es-CO',
      image: post.cover ? `https://pegazo.co${post.cover}` : undefined,
      author: { '@type': 'Organization', name: 'Pegazo', url: 'https://pegazo.co' },
      publisher: { '@id': 'https://pegazo.co/#organization' },
      mainEntityOfPage: url,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://pegazo.co' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: BLOG_BASE },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
  ];
  if (post.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: post.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
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

      <header className="border-b border-neutral-100 bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo_pegazo_sm.png" alt="Pegazo" width={240} height={160} className="h-7 w-auto" />
            <span className="text-lg font-extrabold">Pegazo</span>
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-2 text-sm font-bold text-white"
          >
            Crear mi cuenta
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="mb-6 text-sm text-neutral-500">
          <Link href="/" className="hover:text-orange-600">
            Inicio
          </Link>{' '}
          ·{' '}
          <Link href="/blog" className="hover:text-orange-600">
            Blog
          </Link>
        </nav>

        <article>
          <div className="mb-3 flex items-center gap-2 text-xs text-neutral-500">
            <time dateTime={post.date}>{fmt(post.date)}</time>
            <span>·</span>
            <span>{post.readingMinutes} min de lectura</span>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-4xl">
            {post.title}
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-neutral-700">
            {post.intro}
          </p>

          {post.sections.map((s, i) => (
            <section key={i} className="mt-8">
              <h2 className="text-2xl font-bold text-neutral-900">{s.h2}</h2>
              {s.body?.map((p, j) => (
                <p key={j} className="mt-3 leading-relaxed text-neutral-700">
                  {p}
                </p>
              ))}
              {s.list?.length ? (
                <ul className="mt-4 space-y-2">
                  {s.list.map((li, k) => (
                    <li key={k} className="flex gap-2 text-neutral-700">
                      <span className="mt-1 text-orange-500">•</span>
                      <span>{li}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          {post.faq?.length ? (
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-neutral-900">
                Preguntas frecuentes
              </h2>
              <div className="mt-4 space-y-4">
                {post.faq.map((f, i) => (
                  <div key={i} className="rounded-xl border border-neutral-200 p-4">
                    <h3 className="font-semibold text-neutral-900">{f.q}</h3>
                    <p className="mt-1 text-neutral-700">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-neutral-950 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Pon esto en práctica con Pegazo</h2>
          <p className="mx-auto mt-2 max-w-xl text-neutral-300">
            Ventas, inventario, clientes, fiado, citas y tu tienda online, en un
            solo lugar.
          </p>
          <Link
            href="/register"
            className="mt-5 inline-block rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-3 font-bold text-white"
          >
            Crear mi cuenta
          </Link>
        </div>

        {/* Otros artículos (enlaces internos) */}
        {others.length ? (
          <div className="mt-12">
            <h2 className="text-lg font-bold text-neutral-900">Sigue leyendo</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {others.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="rounded-xl border border-neutral-200 p-4 transition hover:border-orange-300 hover:shadow-sm"
                >
                  <p className="font-semibold text-neutral-900">{p.title}</p>
                  <p className="mt-1 text-sm text-neutral-600">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
