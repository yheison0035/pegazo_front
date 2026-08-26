import { AuthProvider } from '@/context/authContext';
import { ToastProvider } from '@/context/toastContext';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import SplashScreen from '@/components/pwa/SplashScreen';
import { monserrat } from '@/styles/fonts';
import '@/styles/globals.css';

export const metadata = {
  metadataBase: new URL('https://pegazo.co'),
  title: {
    default: 'Pegazo — Todo tu negocio, en un solo lugar',
    template: '%s · Pegazo',
  },
  description:
    'Pegazo es el software en la nube para gestionar tu negocio: ventas y facturación, inventario, clientes, gastos, citas, reportes y tu tienda online conectada al inventario. Empieza gratis.',
  applicationName: 'Pegazo',
  keywords: [
    'software de gestión',
    'CRM',
    'punto de venta',
    'POS',
    'facturación',
    'control de inventario',
    'sistema de ventas',
    'gestión de negocios',
    'tienda online',
    'ecommerce',
    'software para negocios Colombia',
    'software para pymes',
    'programa de facturación',
    'barbería spa salón',
    'multi sede',
    'Pegazo',
  ],
  authors: [{ name: 'Pegazo' }],
  creator: 'Pegazo',
  publisher: 'Pegazo',
  alternates: {
    canonical: 'https://pegazo.co',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://pegazo.co',
    siteName: 'Pegazo',
    title: 'Pegazo — Todo tu negocio, en un solo lugar',
    description:
      'Gestiona ventas, inventario, clientes, gastos, citas y reportes desde una sola plataforma en la nube. Con tu tienda online conectada al inventario. Empieza gratis.',
    images: [
      {
        url: '/images/logo_pegazo.png',
        width: 1536,
        height: 1024,
        alt: 'Pegazo — plataforma para gestionar tu negocio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pegazo — Todo tu negocio, en un solo lugar',
    description:
      'Software en la nube para vender, controlar tu inventario y hacer crecer tu negocio. Con tienda online. Empieza gratis.',
    images: ['/images/logo_pegazo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'business',
  applicationName: 'Pegazo',
  appleWebApp: {
    capable: true,
    title: 'Pegazo',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#EA580C',
  width: 'device-width',
  initialScale: 1,
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      <html lang="es">
        <body className={`${monserrat.className} antialiased`}>
          <ServiceWorkerRegister />
          <SplashScreen />
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
