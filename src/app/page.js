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
  BellAlertIcon,
  GiftIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  TableCellsIcon,
  ScissorsIcon,
  BoltIcon,
  RocketLaunchIcon,
  TruckIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';
import { PLANS } from '@/lib/plans';

// Lo que nos diferencia de la competencia (Siigo, Treinta, Alegra, etc.).
const DIFFERENTIATORS = [
  {
    icon: SparklesIcon,
    title: 'Se adapta a CUALQUIER negocio',
    desc: 'Un mismo sistema que cambia según lo que vendes: barbería, restaurante, tienda, moda, servicios… La plataforma se ajusta a ti, no al revés.',
  },
  {
    icon: ShoppingBagIcon,
    title: 'Tu tienda online, conectada al inventario',
    desc: 'Vende por internet con tu propia tienda, con tu marca, sincronizada con tu stock en tiempo real. Tú eliges qué productos publicar.',
  },
  {
    icon: BellAlertIcon,
    title: 'Aviso de consignaciones en tiempo real',
    desc: 'Cuando te transfieren o consignan, Pegazo te avisa al instante —con voz y notificación— sin que tengas que revisar el banco. Único.',
  },
  {
    icon: GiftIcon,
    title: 'Fideliza y haz volver a tus clientes',
    desc: 'Sellos, premios y recordatorios automáticos por WhatsApp para que tus clientes regresen. La fidelización viene incluida.',
  },
];

// Todo lo que Pegazo hace HOY.
const FEATURES = [
  {
    icon: BanknotesIcon,
    title: 'Ventas y facturación',
    desc: 'Vende rápido, imprime tu factura y controla tus ingresos al instante.',
  },
  {
    icon: ArchiveBoxIcon,
    title: 'Inventario en tiempo real',
    desc: 'Stock al día con variantes (color, talla), código de barras y alertas de agotados.',
  },
  {
    icon: UsersIcon,
    title: 'Clientes (CRM)',
    desc: 'Historial, cumpleaños y notas de cada cliente en un solo lugar.',
  },
  {
    icon: CreditCardIcon,
    title: 'Cartera y fiado',
    desc: 'Controla lo que te deben, los abonos y el crédito de cada cliente.',
  },
  {
    icon: ReceiptPercentIcon,
    title: 'Gastos y rentabilidad',
    desc: 'Registra gastos y mira tu utilidad real mes a mes.',
  },
  {
    icon: CalculatorIcon,
    title: 'Caja e impuestos',
    desc: 'Abre y cierra caja con control, e IVA configurado para Colombia.',
  },
  {
    icon: CalendarDaysIcon,
    title: 'Citas y servicios',
    desc: 'Agenda de citas para barberías, spa, salones y profesionales.',
  },
  {
    icon: ScissorsIcon,
    title: 'Comisiones por empleado',
    desc: 'Calcula comisiones de cortes y productos por cada colaborador.',
  },
  {
    icon: ChartBarSquareIcon,
    title: 'Estadísticas y reportes',
    desc: 'KPIs claros y gráficas para decidir mejor cada día.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Roles y auditoría',
    desc: 'Permisos por rol y registro de quién hizo qué en tu negocio.',
  },
  {
    icon: BuildingStorefrontIcon,
    title: 'Multi-sede',
    desc: 'Maneja varias sedes o puntos de venta desde una sola cuenta.',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'WhatsApp a tus clientes',
    desc: 'Escríbeles con un clic: cobros, promociones y recordatorios.',
  },
  {
    icon: TableCellsIcon,
    title: 'Mesas para restaurantes',
    desc: 'Gestiona mesas, estados y cobro para comida y bares.',
  },
  {
    icon: BellAlertIcon,
    title: 'Avisos del banco',
    desc: 'Notificación por voz cuando entra una consignación o transferencia.',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'App instalable',
    desc: 'Instálalo en tu celular como una app y trabaja desde donde estés.',
  },
  {
    icon: ShoppingBagIcon,
    title: 'Tienda online',
    desc: 'Tu propia tienda con tu marca, conectada a tu inventario.',
  },
];

// Adaptación por tipo de negocio, con lo que cada uno recibe.
const VERTICALS = [
  {
    icon: ScissorsIcon,
    name: 'Barberías y salones',
    perks: 'Citas, comisiones por barbero y fidelización.',
  },
  {
    icon: TableCellsIcon,
    name: 'Restaurantes y comida rápida',
    perks: 'Mesas, menú e insumos.',
  },
  {
    icon: BuildingStorefrontIcon,
    name: 'Tiendas y minimercados',
    perks: 'Inventario, código de barras y tienda online.',
  },
  {
    icon: ShoppingBagIcon,
    name: 'Moda y retail',
    perks: 'Variantes por color y talla, catálogo online.',
  },
  {
    icon: Cog6ToothIcon,
    name: 'Servicios y profesionales',
    perks: 'Agenda, cartera y clientes.',
  },
  {
    icon: TruckIcon,
    name: 'Distribución y mayoristas',
    perks: 'Multi-sede, precios y cartera.',
  },
];

// A dónde apunta Pegazo (roadmap).
const ROADMAP = [
  {
    icon: ReceiptPercentIcon,
    title: 'Facturación electrónica DIAN',
    desc: 'Emite tus facturas electrónicas válidas ante la DIAN, desde el mismo sistema.',
  },
  {
    icon: BoltIcon,
    title: 'Pantalla de cocina (KDS)',
    desc: 'Los pedidos llegan directo a la cocina en tiempo real.',
  },
  {
    icon: Squares2X2Icon,
    title: 'Recetas e insumos',
    desc: 'Descuenta ingredientes automáticamente con cada plato vendido.',
  },
  {
    icon: SparklesIcon,
    title: 'Editor de tu tienda in-situ',
    desc: 'Personaliza tu tienda online desde el propio sitio, sin saber de tecnología.',
  },
  {
    icon: BellAlertIcon,
    title: 'Notificaciones push',
    desc: 'Avisos al instante en tu celular de ventas, citas y consignaciones.',
  },
  {
    icon: RocketLaunchIcon,
    title: 'Más verticales',
    desc: 'Nuevos tipos de negocio y módulos, según lo que necesites.',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://pegazo.co/#organization',
      name: 'Pegazo',
      url: 'https://pegazo.co',
      logo: 'https://pegazo.co/images/logo_pegazo.png',
      slogan: 'Todo tu negocio, en un solo lugar',
      description:
        'Software en la nube para gestionar negocios: ventas, inventario, clientes, gastos, citas, reportes y tienda online.',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://pegazo.co/#website',
      url: 'https://pegazo.co',
      name: 'Pegazo',
      inLanguage: 'es-CO',
      publisher: { '@id': 'https://pegazo.co/#organization' },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Pegazo',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://pegazo.co',
      description:
        'Plataforma todo en uno para gestionar y hacer despegar tu negocio, con tienda online conectada al inventario.',
      offers: PLANS.map((p) => ({
        '@type': 'Offer',
        name: `Plan ${p.name}`,
        price: p.priceMonthly ?? 0,
        priceCurrency: 'COP',
        description: p.tagline,
        category: 'subscription',
      })),
    },
  ],
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-neutral-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <img
            src="/images/logo_pegazo.png"
            alt="Pegazo"
            className="h-9 w-auto sm:h-11"
          />
          <nav className="hidden items-center gap-8 text-sm text-neutral-300 md:flex">
            <a href="#diferencia" className="hover:text-white">
              Por qué Pegazo
            </a>
            <a href="#funciones" className="hover:text-white">
              Funciones
            </a>
            <a href="#negocios" className="hover:text-white">
              Para tu negocio
            </a>
            <a href="#planes" className="hover:text-white">
              Planes
            </a>
          </nav>
          {/* Iniciar sesión SIEMPRE visible (también en móvil) */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-200 hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-white">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-orange-500 opacity-20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-amber-400 opacity-20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 py-20 text-center sm:py-24">
          <img
            src="/images/logo_pegazo.png"
            alt="Pegazo"
            className="mx-auto mb-8 h-40 w-auto sm:h-56"
          />
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300">
            <BoltIcon className="h-3.5 w-3.5 text-orange-400" /> Un solo sistema
            para cualquier negocio
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Todo tu negocio,{' '}
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              en un solo lugar
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-300">
            Ventas, inventario, clientes, citas, cartera, reportes y hasta tu
            propia tienda online. Pegazo se adapta a lo que vendes y hace
            despegar tu negocio —todo desde la nube.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-7 py-3 font-semibold text-white shadow-lg hover:opacity-90 sm:w-auto"
            >
              Crear cuenta gratis <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-white/20 px-7 py-3 text-center font-semibold text-white hover:bg-white/5 sm:w-auto"
            >
              Iniciar sesión
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5">
              <CheckCircleIcon className="h-4 w-4 text-orange-500" /> En la nube
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircleIcon className="h-4 w-4 text-orange-500" /> Multi-sede
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircleIcon className="h-4 w-4 text-orange-500" /> Sin
              permanencia
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircleIcon className="h-4 w-4 text-orange-500" /> Hecho para
              Colombia
            </span>
          </div>
        </div>
      </section>

      {/* DIFERENCIADORES (lo épico) */}
      <section id="diferencia" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
            Por qué Pegazo y no otro
          </p>
          <h2 className="mt-2 text-3xl font-bold text-neutral-900">
            Lo que nos hace diferentes
          </h2>
          <p className="mt-3 text-neutral-500">
            No es un software genérico más. Pegazo hace cosas que los demás no.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {DIFFERENTIATORS.map((d) => (
            <div
              key={d.title}
              className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-7 shadow-sm transition hover:border-orange-300 hover:shadow-md"
            >
              <d.icon className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 text-orange-500/10 transition group-hover:scale-110" />
              <span className="inline-flex rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 p-3 text-white shadow">
                <d.icon className="h-7 w-7" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-neutral-900">
                {d.title}
              </h3>
              <p className="mt-2 text-neutral-600">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONES (todo lo que hace) */}
      <section id="funciones" className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-neutral-900">
              Todo lo que tu negocio necesita
            </h2>
            <p className="mt-3 text-neutral-500">
              Un solo sistema para vender, controlar y crecer. Deja de pagar
              varias herramientas.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-md"
              >
                <span className="inline-flex rounded-xl bg-orange-50 p-2.5 text-orange-600">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-3 font-semibold text-neutral-900">
                  {f.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ECOMMERCE */}
      <section className="mx-auto max-w-6xl px-5 py-16">
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
              Lleva tu negocio a internet con tu propia tienda, con tu marca. Se
              sincroniza con tu inventario en tiempo real y{' '}
              <b>tú decides qué productos mostrar</b>. Tus clientes crean su
              cuenta (incluso con Google) y siguen sus pedidos.
            </p>
            <ul className="mt-6 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {[
                'Sincronizada con tu inventario',
                'Tú eliges qué productos publicar',
                'Cuentas de clientes y Google',
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
      <section id="negocios" className="mx-auto max-w-6xl px-5 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Se adapta a tu tipo de negocio
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-neutral-500">
            Pegazo cambia según lo que vendes: el vocabulario, las funciones y
            hasta la tienda online se ajustan a ti.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VERTICALS.map((v) => (
            <div
              key={v.name}
              className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <span className="inline-flex flex-none rounded-xl bg-neutral-900 p-2.5 text-white">
                <v.icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-semibold text-neutral-900">{v.name}</h3>
                <p className="mt-0.5 text-sm text-neutral-500">{v.perks}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRÓXIMAMENTE (roadmap) */}
      <section className="bg-neutral-950 py-20 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-400">
              <RocketLaunchIcon className="h-3.5 w-3.5" /> Próximamente
            </span>
            <h2 className="mt-3 text-3xl font-bold">Esto es solo el comienzo</h2>
            <p className="mt-3 text-neutral-400">
              Pegazo crece contigo. Estas son algunas de las funciones que se
              vienen.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ROADMAP.map((r) => (
              <div
                key={r.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex rounded-xl bg-white/10 p-2.5 text-orange-400">
                    <r.icon className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-semibold text-orange-300">
                    Pronto
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-white">{r.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-400">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Un plan para cada momento de tu negocio
          </h2>
          <p className="mt-3 text-neutral-500">
            Empieza gratis y sube de nivel cuando crezcas. Sin permanencia, con
            14 días de prueba en los planes pagos.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex h-full flex-col rounded-2xl border p-6 shadow-sm transition ${
                plan.highlight
                  ? 'border-orange-500 bg-white ring-2 ring-orange-500'
                  : 'border-neutral-200 bg-white hover:border-orange-300'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 px-3 py-1 text-xs font-semibold text-white shadow">
                  Más popular
                </span>
              )}

              <div className="text-2xl">{plan.emoji}</div>
              <h3 className="mt-2 text-lg font-bold text-neutral-900">
                {plan.name}
              </h3>
              <p className="text-sm text-neutral-500">{plan.tagline}</p>

              <div className="mt-4">
                <span className="text-3xl font-extrabold text-neutral-900">
                  {plan.priceLabel}
                </span>
                <span className="text-sm text-neutral-500">
                  {plan.priceSuffix}
                </span>
                {plan.yearLabel && (
                  <p className="mt-1 text-xs text-neutral-400">
                    {plan.yearLabel}
                  </p>
                )}
              </div>

              <Link
                href={`/register?plan=${plan.id}`}
                className={`mt-5 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white hover:opacity-90'
                    : 'border border-neutral-300 text-neutral-800 hover:border-orange-400 hover:text-orange-600'
                }`}
              >
                {plan.cta}
              </Link>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {plan.limits.map((l) => (
                  <span
                    key={l}
                    className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600"
                  >
                    {l}
                  </span>
                ))}
              </div>

              <ul className="mt-5 space-y-2 border-t border-neutral-100 pt-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-none text-orange-500" />
                    <span className="text-neutral-600">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-neutral-400">
          Todos los planes incluyen datos en la nube y respaldados. Los precios
          están en pesos colombianos (COP).
        </p>
      </section>

      {/* CTA FINAL */}
      <section
        id="contacto"
        className="relative overflow-hidden bg-gradient-to-br from-orange-600 to-amber-500 py-20 text-white"
      >
        <div className="absolute -bottom-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-white opacity-10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Haz despegar tu negocio con Pegazo
          </h2>
          <p className="mt-4 text-white/90">
            Todo tu negocio, en un solo lugar. Crea tu cuenta gratis y empieza
            hoy.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-8 py-3.5 font-semibold text-white shadow-lg hover:bg-neutral-800 sm:w-auto"
            >
              Crear cuenta gratis <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-white/40 px-8 py-3.5 text-center font-semibold text-white hover:bg-white/10 sm:w-auto"
            >
              Iniciar sesión
            </Link>
          </div>
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
            <a href="#diferencia" className="hover:text-white">
              Por qué Pegazo
            </a>
            <a href="#funciones" className="hover:text-white">
              Funciones
            </a>
            <a href="#planes" className="hover:text-white">
              Planes
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
