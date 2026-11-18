// Metadata de las páginas públicas (/booking, /catalog, /menu). Vive en su propio
// módulo (sin componentes cliente) para poder testearlo y reutilizarlo desde las
// tres rutas. El mensaje de la vista previa (WhatsApp/redes) cambia según el tipo:
//   booking → citas · catalog → productos/pedidos · menu → carta/comida.

// Base del API para el fetch de metadata (server). En algunos entornos la var
// NEXT_PUBLIC no llega al runtime del servidor y cae a localhost; en producción
// usamos la URL pública del API como respaldo para que el título/preview salga
// con la marca del negocio al compartir el enlace.
function resolveApiUrl() {
  let url = process.env.NEXT_PUBLIC_API_URL || '';
  if (!url || (process.env.NODE_ENV === 'production' && url.includes('localhost'))) {
    url = 'https://admineuropeatvstoreback-production.up.railway.app';
  }
  return url.replace(/\/$/, '');
}
const API_URL = resolveApiUrl();

// Config pública del negocio (para metadata dinámica por slug).
export async function fetchConfig(slug) {
  try {
    const res = await fetch(
      `${API_URL}/appointments/booking-config/${encodeURIComponent(slug)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

// Copys por tipo de página pública.
export const META_COPY = {
  booking: {
    path: 'booking',
    fallbackName: 'Agenda tu cita',
    desc: (name) => `Reserva tu cita en ${name} fácil y rápido.`,
    twitter: 'Reserva tu cita ahora mismo',
  },
  catalog: {
    path: 'catalog',
    fallbackName: 'Catálogo',
    desc: (name) => `Explora el catálogo de ${name} y haz tu pedido fácil y rápido.`,
    twitter: 'Mira nuestro catálogo',
  },
  menu: {
    path: 'menu',
    fallbackName: 'Carta',
    desc: (name) => `Mira la carta de ${name} y haz tu pedido fácil y rápido.`,
    twitter: 'Mira nuestra carta',
  },
};

// Construye la metadata (incluye Open Graph/Twitter) de la página pública para un
// `kind` concreto: el enlace compartido muestra el mensaje y la URL correctos.
export async function buildPublicMetadata(slug, kind = 'booking') {
  const copy = META_COPY[kind] || META_COPY.booking;
  const cfg = await fetchConfig(slug);
  const name = cfg?.name || copy.fallbackName;
  const desc = copy.desc(name);
  const images = cfg?.logo ? [{ url: cfg.logo }] : [];

  return {
    metadataBase: new URL('https://pegazo.co'),
    title: { default: name, template: `%s | ${name}` },
    description: desc,
    icons: cfg?.logo
      ? { icon: cfg.logo, shortcut: cfg.logo, apple: cfg.logo }
      : undefined,
    openGraph: {
      title: name,
      description: desc,
      url: `https://pegazo.co/${copy.path}/${slug}`,
      siteName: name,
      images,
      locale: 'es_CO',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description: copy.twitter,
      images: images.map((i) => i.url),
    },
    themeColor: '#000000',
    robots: { index: true, follow: true },
  };
}
