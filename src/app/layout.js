import Script from 'next/script';
import { AuthProvider } from '@/context/authContext';
import { ToastProvider } from '@/context/toastContext';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import { monserrat } from '@/styles/fonts';
import '@/styles/globals.css';

// Google Tag Manager. El ID se puede sobreescribir con NEXT_PUBLIC_GTM_ID en
// Vercel; si no, usa el contenedor de Pegazo. Desde GTM se gestiona GA4 y otras
// etiquetas sin volver a tocar código.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-P88J458M';

export const metadata = {
  metadataBase: new URL('https://pegazo.co'),
  title: {
    default: 'Pegazo — Todo tu negocio, en un solo lugar',
    template: '%s · Pegazo',
  },
  description:
    'Pegazo es el software en la nube para gestionar tu negocio: ventas y facturación, inventario, clientes, gastos, citas, reportes y tu tienda online conectada al inventario.',
  applicationName: 'Pegazo',
  keywords: [
    'software de gestión',
    'CRM',
    'punto de venta',
    'POS',
    'sistema POS Colombia',
    'facturación',
    'programa de facturación',
    'software de facturación Colombia',
    'control de inventario',
    'software de inventario',
    'sistema de ventas',
    'gestión de negocios',
    'administrar negocio',
    'software para pymes',
    'software para negocios Colombia',
    'software para tiendas',
    'software para minimercados y supermercados',
    'sistema para restaurantes',
    'software para barberías',
    'software para peluquerías y salones',
    'software para consultorios y clínicas',
    'sistema para odontología',
    'software para distribuidoras',
    'control de fiado y cartera',
    'cierre de caja',
    'reportes de ventas',
    'fidelización de clientes',
    'agenda de citas',
    'tienda online',
    'ecommerce conectado al inventario',
    'crear tienda online',
    'multi sede',
    'varios locales inventario',
    'app para vender',
    'alternativa a Siigo Treinta Alegra',
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
      'Gestiona ventas, inventario, clientes, gastos, citas y reportes desde una sola plataforma en la nube. Con tu tienda online conectada al inventario.',
    // La imagen para compartir la genera src/app/opengraph-image.js (1200x630).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pegazo — Todo tu negocio, en un solo lugar',
    description:
      'Software en la nube para vender, controlar tu inventario y hacer crecer tu negocio. Con tienda online.',
    // Usa la misma imagen generada por src/app/opengraph-image.js (1200x630).
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
  // Verificación de propiedad en Google Search Console (y otros). Se activa con
  // la variable de entorno NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION (token que da
  // Search Console). Si no está, no se imprime nada. También se puede verificar
  // por DNS (TXT), que no requiere desplegar.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport = {
  themeColor: '#EA580C',
  width: 'device-width',
  initialScale: 1,
};

// Sin render dinámico global: la landing y el blog quedan ESTÁTICOS (CDN, más
// rápido y mejor SEO). Las áreas dinámicas (panel, plataforma, portal contador,
// login/registro y páginas públicas por slug) declaran su propio force-dynamic.

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      <html lang="es">
        <head>
          {/* Google Tag Manager */}
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        </head>
        <body className={`${monserrat.className} antialiased`}>
          {/* Google Tag Manager (noscript) */}
          <noscript>
            {/* eslint-disable-next-line @next/next/no-sync-scripts */}
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
              title="gtm"
            />
          </noscript>
          <ServiceWorkerRegister />
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
