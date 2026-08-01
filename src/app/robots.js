export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Zonas privadas de la aplicación: no deben indexarse.
        disallow: [
          '/dashboard/',
          '/platform/',
          '/reset-password',
          '/forgot-password',
        ],
      },
    ],
    sitemap: 'https://pegazo.co/sitemap.xml',
    host: 'https://pegazo.co',
  };
}
