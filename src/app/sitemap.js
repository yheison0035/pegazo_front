export default function sitemap() {
  const base = 'https://pegazo.co';
  const now = new Date();
  // Solo páginas públicas con valor SEO. /login no se incluye (sin valor de
  // búsqueda); las zonas privadas (dashboard/platform) las bloquea robots.
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${base}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
