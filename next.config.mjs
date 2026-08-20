/** @type {import('next').NextConfig} */
const nextConfig = {
  // Las imágenes que sube el CRM (logos, banners) viven en Cloudinary. Sin
  // esto, next/image lanza un error en tiempo de render y tumba la pantalla.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },

  // Migración de rutas: el CRM ahora vive en la raíz (sin /CRM). Se redirigen
  // los enlaces viejos /CRM/... a la nueva ubicación para no romper marcadores.
  async redirects() {
    return [
      // Dominio viejo (admin.europeatvstore.com): todo lo que llegue ahí se
      // redirige al mismo path en pegazo.co. Así los QR impresos de las citas
      // (/booking/ragnorbarber) y cualquier enlace antiguo siguen funcionando.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'admin.europeatvstore.com' }],
        destination: 'https://pegazo.co/:path*',
        permanent: true,
      },
      { source: '/CRM', destination: '/login', permanent: true },
      { source: '/CRM/:path*', destination: '/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
