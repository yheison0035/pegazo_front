import { monserrat } from '@/styles/fonts';

const LOGO =
  'https://res.cloudinary.com/dl7g5sslz/image/upload/v1777311594/logo_ragnor_okgsb8.png';

export const metadata = {
  title: 'RAGNOR BARBER',
  description: 'Agenda tu cita con los mejores barberos',

  openGraph: {
    title: 'RAGNOR BARBER',
    description: 'Reserva tu cita fácil y rápido',
    images: [LOGO],
  },

  twitter: {
    card: 'summary_large_image',
    images: [LOGO],
  },

  icons: {
    icon: LOGO,
    shortcut: LOGO,
    apple: LOGO,
  },
};

export default function BookingLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${monserrat.className} antialiased bg-black`}>
        {children}
      </body>
    </html>
  );
}
