import { Cinzel } from 'next/font/google';
import PublicBooking from '@/components/dashboard/appointments/publicBooking';

// Fuente display para el skin "guerrero" (grabada tipo Norse). Se expone como
// variable CSS; solo el skin oscuro la usa.
const display = Cinzel({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--bk-font-display',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// Config pública del negocio (para metadata dinámica por slug).
async function fetchConfig(slug) {
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

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cfg = await fetchConfig(slug);
  const name = cfg?.name || 'Agenda tu cita';
  const desc = `Reserva tu cita en ${name} fácil y rápido.`;
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
      url: `https://pegazo.co/booking/${slug}`,
      siteName: name,
      images,
      locale: 'es_CO',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description: 'Reserva tu cita ahora mismo',
      images: images.map((i) => i.url),
    },
    themeColor: '#000000',
    robots: { index: true, follow: true },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  return (
    <div className={`${display.variable} min-h-screen w-full bg-black`}>
      <PublicBooking slug={slug} />
    </div>
  );
}
