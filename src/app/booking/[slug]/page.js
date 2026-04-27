// src/app/booking/[slug]/page.js

import PublicBooking from '@/components/dashboard/appointments/publicBooking';

const LOGO =
  'https://res.cloudinary.com/dl7g5sslz/image/upload/v1777311594/logo_ragnor_okgsb8.png';

export const dynamic = 'force-dynamic';

export const metadata = {
  metadataBase: new URL('https://admin.europeatvstore.com'),

  title: {
    default: 'RAGNOR BARBER',
    template: '%s | RAGNOR BARBER',
  },

  description:
    'Reserva tu cita en RAGNOR BARBER. Corte, barba y estilo profesional.',

  icons: {
    icon: [
      {
        url: 'https://res.cloudinary.com/dl7g5sslz/image/upload/v1777332078/logo_ragnor_pvnvqe.ico',
      },
      {
        url: 'https://res.cloudinary.com/dl7g5sslz/image/upload/v1777311594/logo_ragnor_okgsb8.png',
        type: 'image/png',
      },
    ],
    shortcut: [
      'https://res.cloudinary.com/dl7g5sslz/image/upload/v1777332078/logo_ragnor_pvnvqe.ico',
    ],
    apple: [
      'https://res.cloudinary.com/dl7g5sslz/image/upload/v1777311594/logo_ragnor_okgsb8.png',
    ],
  },

  keywords: [
    'barbería',
    'corte de cabello',
    'barba',
    'Ragnor Barber',
    'barbería cerca',
  ],

  authors: [{ name: 'RAGNOR BARBER' }],

  openGraph: {
    title: 'RAGNOR BARBER',
    description:
      'Agenda tu cita fácil y rápido en RAGNOR BARBER. Servicio premium.',
    url: 'https://admin.europeatvstore.com/booking/ragnorbarber',
    siteName: 'RAGNOR BARBER',
    images: [
      {
        url: LOGO,
        width: 1200,
        height: 630,
        alt: 'RAGNOR BARBER Logo',
      },
    ],
    locale: 'es_CO',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'RAGNOR BARBER',
    description: 'Reserva tu cita ahora mismo',
    images: [LOGO],
  },

  icons: {
    icon: LOGO,
    shortcut: LOGO,
    apple: LOGO,
  },

  themeColor: '#000000',

  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return (
    <div className="min-h-screen w-full bg-black">
      <PublicBooking />
    </div>
  );
}
