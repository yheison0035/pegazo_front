// /login es la entrada al panel (sin valor de búsqueda): se marca noindex para
export const dynamic = 'force-dynamic';
// que no compita con la landing ni la página de registro. La página es de
// cliente y no puede exportar metadata, por eso va en este layout de servidor.
export const metadata = {
  title: 'Iniciar sesión',
  description: 'Ingresa a tu cuenta de Pegazo para gestionar tu negocio.',
  alternates: { canonical: 'https://pegazo.co/login' },
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }) {
  return children;
}
