import Link from 'next/link';
import {
  BanknotesIcon,
  ArchiveBoxIcon,
  UsersIcon,
  ReceiptPercentIcon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  BuildingStorefrontIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

const FEATURES = [
  {
    icon: BanknotesIcon,
    title: 'Ventas y facturación',
    desc: 'Vende rápido, imprime tu factura y controla tus ingresos al instante.',
  },
  {
    icon: ArchiveBoxIcon,
    title: 'Inventario',
    desc: 'Controla tu stock en tiempo real, con precios, códigos de barras y alertas.',
  },
  {
    icon: UsersIcon,
    title: 'Clientes',
    desc: 'Toda la información de tus clientes organizada en un solo lugar.',
  },
  {
    icon: ReceiptPercentIcon,
    title: 'Gastos',
    desc: 'Registra y controla los gastos de tu negocio y cuida tu rentabilidad.',
  },
  {
    icon: CalendarDaysIcon,
    title: 'Citas y servicios',
    desc: 'Agenda citas y gestiona tus servicios. Ideal para barberías, spa y salones.',
  },
  {
    icon: ChartBarSquareIcon,
    title: 'Estadísticas',
    desc: 'Reportes y KPIs claros para tomar mejores decisiones cada día.',
  },
  {
    icon: BuildingStorefrontIcon,
    title: 'Multi-sede',
    desc: 'Maneja varias sedes o puntos de venta desde una sola cuenta.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Roles y auditoría',
    desc: 'Da acceso a tu equipo con permisos por rol y registro de quién hizo qué.',
  },
];

const BUSINESS_TYPES = [
  'Barberías y salones',
  'Tiendas y minimercados',
  'Restaurantes y bares',
  'Comercio y retail',
  'Servicios',
  'Distribución',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-neutral-800">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <img
            src="/images/logo_pegazo.png"
            alt="Pegazo"
            className="h-11 w-auto"
          />
          <nav className="hidden items-center gap-8 text-sm text-neutral-300 md:flex">
            <a href="#funciones" className="hover:text-white">
              Funciones
            </a>
            <a href="#negocios" className="hover:text-white">
              Para tu negocio
            </a>
            <a href="#contacto" className="hover:text-white">
              Contacto
            </a>
          </nav>
          <Link
            href="/login"
            className="rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-white">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-orange-500 opacity-20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-amber-400 opacity-20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 py-24 text-center">
          <img
            src="/images/logo_pegazo.png"
            alt="Pegazo"
            className="mx-auto mb-8 h-56 w-auto"
          />
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Todo tu negocio,{' '}
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              en un solo lugar
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-300">
            Ventas, inventario, clientes, gastos, citas y reportes. Gestiona y
            haz despegar tu negocio desde una sola plataforma, en la nube.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-7 py-3 font-semibold text-white shadow-lg hover:opacity-90"
            >
              Iniciar sesión <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <a
              href="#funciones"
              className="rounded-xl border border-white/20 px-7 py-3 font-semibold text-white hover:bg-white/5"
            >
              Ver funciones
            </a>
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5">
              <CheckCircleIcon className="h-4 w-4 text-orange-500" /> En la nube
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircleIcon className="h-4 w-4 text-orange-500" /> Multi-sede
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircleIcon className="h-4 w-4 text-orange-500" /> Fácil de
              usar
            </span>
          </div>
        </div>
      </section>

      {/* FUNCIONES */}
      <section id="funciones" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Todo lo que tu negocio necesita
          </h2>
          <p className="mt-3 text-neutral-500">
            Un solo sistema para vender, controlar y crecer. Sin complicaciones.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-md"
            >
              <span className="inline-flex rounded-xl bg-orange-50 p-3 text-orange-600">
                <f.icon className="h-7 w-7" />
              </span>
              <h3 className="mt-4 font-semibold text-neutral-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-neutral-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ECOMMERCE */}
      <section className="mx-auto max-w-6xl px-5 pb-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 to-amber-500 p-8 text-white shadow-lg sm:p-12">
          <ShoppingBagIcon className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 text-white/10" />
          <div className="relative max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-white/80">
              Vende en línea
            </p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Tu tienda online, conectada a tu inventario
            </h2>
            <p className="mt-4 text-white/90">
              Lleva tu negocio a internet con tu propia tienda. Se sincroniza
              con tu inventario en tiempo real y{' '}
              <b>tú decides qué productos mostrar</b>: publica solo lo que
              quieres vender por internet.
            </p>
            <ul className="mt-6 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {[
                'Sincronizada con tu inventario',
                'Tú eliges qué productos publicar',
                'Pagos en línea integrados',
                'Con la imagen de tu marca',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 flex-none text-white" />
                  <span className="text-sm text-white/95">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PARA TU NEGOCIO */}
      <section id="negocios" className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Se adapta a tu tipo de negocio
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-neutral-500">
            Pegazo cambia según lo que vendes. La plataforma se ajusta a ti, no
            al revés.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {BUSINESS_TYPES.map((t) => (
              <span
                key={t}
                className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 shadow-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        id="contacto"
        className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-black py-20 text-white"
      >
        <div className="absolute -bottom-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-orange-500 opacity-20 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Empieza a gestionar tu negocio con Pegazo
          </h2>
          <p className="mt-4 text-neutral-300">
            Todo tu negocio, en un solo lugar. Ingresa y comienza hoy.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-8 py-3.5 font-semibold text-white shadow-lg hover:opacity-90"
          >
            Iniciar sesión <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-neutral-950 py-10 text-neutral-400">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <img
              src="/images/logo_pegazo.png"
              alt="Pegazo"
              className="h-10 w-auto"
            />
            <p className="text-xs text-neutral-500">
              Todo tu negocio, en un solo lugar.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#funciones" className="hover:text-white">
              Funciones
            </a>
            <a href="#negocios" className="hover:text-white">
              Negocios
            </a>
            <Link href="/login" className="hover:text-white">
              Iniciar sesión
            </Link>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-neutral-600">
          © {new Date().getFullYear()} Pegazo. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
