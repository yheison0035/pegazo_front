// Manifiesto PWA: hace que Pegazo se pueda "instalar" como app en el celular
// (Android/iOS) y en el escritorio. Next lo sirve en /manifest.webmanifest y
// añade solo la etiqueta <link rel="manifest">.
export default function manifest() {
  return {
    name: 'Pegazo — Gestiona tu negocio',
    short_name: 'Pegazo',
    description:
      'Ventas, inventario, clientes, citas y reportes de tu negocio en un solo lugar.',
    id: '/',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#EA580C',
    lang: 'es-CO',
    dir: 'ltr',
    categories: ['business', 'productivity', 'finance'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
