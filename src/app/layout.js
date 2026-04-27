import { AuthProvider } from '@/context/authContext';
import { monserrat } from '@/styles/fonts';
import '@/styles/globals.css';

export const metadata = {
  title: 'Zorvex',
  description: 'CRM inteligente para gestión empresarial',
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/icon.png', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
    apple: ['/apple-icon.png'],
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
