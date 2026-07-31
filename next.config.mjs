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
      { source: '/CRM', destination: '/login', permanent: true },
      { source: '/CRM/:path*', destination: '/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
