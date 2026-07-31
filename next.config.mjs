/** @type {import('next').NextConfig} */
const nextConfig = {
  // Migración de rutas: el CRM ahora vive en la raíz (sin /CRM). Se redirigen
  // los enlaces viejos /CRM/... a la nueva ubicación para no romper marcadores.
  async redirects() {
    return [
      { source: '/CRM', destination: '/', permanent: true },
      { source: '/CRM/:path*', destination: '/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
