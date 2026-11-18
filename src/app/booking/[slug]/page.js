import PublicBooking from '@/components/dashboard/appointments/publicBooking';
import PublicCatalog from '@/components/public/PublicCatalog';
import { fetchConfig, buildPublicMetadata } from './publicMetadata';

// Fuente display del skin "guerrero" (Cinzel, grabada tipo Norse). Se carga por
// <link> de Google Fonts (no por next/font) para evitar el bug intermitente de
// Turbopack al tener más de una fuente de next/font/google ("queries have
// exactly one entry"), que rompía el build de Vercel. Solo el skin oscuro la usa
// vía la variable --bk-font-display.
const CINZEL_HREF =
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&display=swap';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return buildPublicMetadata(slug, 'booking');
}

export default async function Page({ params }) {
  const { slug } = await params;
  const cfg = await fetchConfig(slug);

  // Página apagada por super platform (o sin config): aviso neutro.
  if (cfg && cfg.enabled === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-center">
        <div className="max-w-sm">
          <h1 className="text-lg font-bold text-gray-800">
            Página no disponible
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Este negocio no tiene su página pública activa por el momento.
          </p>
        </div>
      </div>
    );
  }

  // Negocio de PRODUCTOS → catálogo/menú solo lectura (tema claro, sin la
  // portada negra de citas).
  if (cfg && cfg.mode === 'catalog') {
    return <PublicCatalog slug={slug} config={cfg} />;
  }

  // Negocio de SERVICIOS → agenda de citas (igual que RAGNOR, sin cambios).
  return (
    <div
      style={{ '--bk-font-display': "'Cinzel', Georgia, serif" }}
      className="min-h-screen w-full bg-black"
    >
      {/* Fuente display del skin oscuro (React 19 la sube al <head>). */}
      <link rel="stylesheet" href={CINZEL_HREF} />
      {/* El documento en negro: evita el fondo blanco del overscroll en móvil. */}
      <style>{`html,body{background:#08070a !important;overscroll-behavior:none}`}</style>
      <PublicBooking slug={slug} />
    </div>
  );
}
