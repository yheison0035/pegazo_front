import { getAllPosts } from '@/content/blog/posts';

export default function sitemap() {
  const base = 'https://pegazo.co';
  const now = new Date();
  // Solo páginas públicas con valor SEO. /login no se incluye (sin valor de
  // búsqueda); las zonas privadas (dashboard/platform) las bloquea robots.
  const posts = getAllPosts().map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.updated || p.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    {
      url: `${base}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...posts,
  ];
}
