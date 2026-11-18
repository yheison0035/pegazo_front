// La página /register es un componente de cliente y no puede exportar metadata;
// este layout (servidor) le da su propio SEO como página de conversión.
export const metadata = {
  title: 'Crea tu cuenta y registra tu negocio',
  description:
    'Regístrate en Pegazo y empieza a gestionar tu negocio: ventas y facturación, inventario, clientes, citas y tu tienda online. Sin instalar nada.',
  alternates: { canonical: 'https://pegazo.co/register' },
  openGraph: {
    type: 'website',
    url: 'https://pegazo.co/register',
    siteName: 'Pegazo',
    title: 'Crea tu cuenta en Pegazo',
    description:
      'Registra tu negocio y empieza a vender, controlar tu inventario y atender clientes hoy.',
  },
  robots: { index: true, follow: true },
};

export default function RegisterLayout({ children }) {
  return children;
}
