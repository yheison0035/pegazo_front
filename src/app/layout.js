import { AuthProvider } from '@/context/authContext';
import { monserrat } from '@/styles/fonts';
import '@/styles/globals.css';

export const metadata = {
  title: 'Pegazo',
  description: 'Pegazo · plataforma para gestionar y hacer despegar tu negocio',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      <html lang="es">
        <body className={`${monserrat.className} antialiased`}>{children}</body>
      </html>
    </AuthProvider>
  );
}
