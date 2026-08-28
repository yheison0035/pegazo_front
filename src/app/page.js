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
  ChatBubbleLeftRightIcon,
  TableCellsIcon,
  ScissorsIcon,
  BoltIcon,
  RocketLaunchIcon,
  TruckIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  CalculatorIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  DocumentChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { PLANS } from '@/lib/plans';

// ── Lo que nos diferencia de la competencia (Siigo, Treinta, Alegra…) ──
const DIFFERENTIATORS = [
  {
    icon: SparklesIcon,
    title: 'Se adapta a CUALQUIER negocio',
    desc: 'Un mismo sistema que cambia según lo que vendes: barbería, consultorio, restaurante, supermercado, moda… La plataforma se ajusta a ti, no al revés.',
  },
  {
    icon: ShoppingBagIcon,
    title: 'Tu tienda online, conectada al inventario',
    desc: 'Vende por internet con tu propia tienda y tu marca, sincronizada con tu stock en tiempo real. Tú eliges qué productos publicar.',
  },
  {
    icon: BellAlertIcon,
    title: 'Aviso de consignaciones en tiempo real',
    desc: 'Cuando te transfieren o consignan, Pegazo te avisa al instante —con voz y notificación— sin revisar el banco. Nadie más lo tiene.',
  },
  {
    icon: GiftIcon,
    title: 'Fideliza y haz volver a tus clientes',
    desc: 'Sellos, premios y recordatorios automáticos por WhatsApp para que tus clientes regresen. Incluido, sin apps extra.',
  },
];

// ── Todo lo que hace, agrupado por área ──
const FEATURE_GROUPS = [
  {
    icon: BanknotesIcon,
    title: 'Ventas, caja e impuestos',
    items: [
      'Punto de venta rápido e impresión de factura',
      'Medios de pago: efectivo, transferencia, datáfono, Addi y fiado',
      'Apertura y cierre de caja con arqueo por día',
      'IVA y precios configurados para Colombia',
      'Cotizaciones para tus clientes',
    ],
  },
  {
    icon: ArchiveBoxIcon,
    title: 'Inventario y multi-local',
    items: [
      'Stock en tiempo real con código de barras',
      'Variantes por color, talla y presentación (kg, und…)',
      'Alertas de productos por agotarse y agotados',
      'Reposición rápida y control de costos',
      'Varios locales, cada uno con su propio inventario',
    ],
  },
  {
    icon: UsersIcon,
    title: 'Clientes y fidelización',
    items: [
      'Ficha, historial, notas y cumpleaños de cada cliente',
      'Cartera y fiado: controla lo que te deben y los abonos',
      'Fidelización con sellos y premios',
      'WhatsApp con un clic: cobros, promos y recordatorios',
      'Clientes de tu tienda online unificados con el CRM',
    ],
  },
  {
    icon: DocumentChartBarIcon,
    title: 'Reportes y decisiones',
    items: [
      'Reporte de ventas por día, semana, mes y sede',
      'Productos más vendidos y por medio de pago',
      'Utilidad real: ingresos vs. gastos',
      'Gráficas y KPIs claros en tu panel de inicio',
      'Rendimiento por empleado y por servicio',
    ],
  },
  {
    icon: ShieldCheckIcon,
    title: 'Equipo, roles y control',
    items: [
      'Permisos por rol (dueño, cajero, barbero…)',
      'Auditoría: registro de quién hizo qué',
      'Comisiones por empleado (servicios y productos)',
      'Cada colaborador ve solo lo que le corresponde',
    ],
  },
  {
    icon: ShoppingBagIcon,
    title: 'Tienda online y app',
    items: [
      'Tu tienda con tu marca, conectada al inventario',
      'Cuentas de clientes (incluso con Google) y sus pedidos',
      'Cobros en línea integrados',
      'Instalable en el celular como app (PWA)',
      'Avisos de consignaciones del banco en tiempo real',
    ],
  },
  {
    icon: SparklesIcon,
    title: 'Personalízalo a tu estilo',
    items: [
      'Colores y tema del panel (CRM) a tu gusto',
      'Tu tienda online con tu logo, colores y portada',
      'El vocabulario cambia según tu negocio',
      'Tú decides qué mostrar y cómo se ve',
    ],
  },
];

// ── Cada tipo de negocio, individual y con lo suyo ──
const VERTICALS = [
  {
    icon: ScissorsIcon,
    name: 'Barberías y salones',
    tag: 'Belleza',
    perks: [
      'Agenda de citas con recordatorios',
      'Comisiones por barbero (cortes y productos)',
      'Fidelización con sellos y premios',
      'Cada barbero ve solo su información',
      'Venta de productos + servicios',
    ],
  },
  {
    icon: HeartIcon,
    name: 'Consultorios y clínicas',
    tag: 'Salud · odontología · estética',
    perks: [
      'Ficha e historial de cada paciente',
      'Agenda de citas con estados y recordatorios',
      'Planes de pago y cartera (abonos)',
      'Registro de tratamientos y servicios realizados',
      'WhatsApp para confirmar la cita',
    ],
  },
  {
    icon: TableCellsIcon,
    name: 'Restaurantes y bares',
    tag: 'Comida y bebida',
    perks: [
      'Menú por categorías',
      'Mesas con estados y cobro',
      'Insumos (y recetas, muy pronto)',
      'Domicilio, recoger o consumo en el lugar',
      'Ventas rápidas en hora pico',
    ],
  },
  {
    icon: BuildingStorefrontIcon,
    name: 'Supermercados y minimercados',
    tag: 'Retail de alto volumen',
    perks: [
      'Ventas rápidas con código de barras',
      'Inventario grande con alertas de agotados',
      'Reportes de ventas y más vendidos',
      'Fiado, cartera y varios cajeros',
      'Multi-local con inventario por sede',
    ],
  },
  {
    icon: ShoppingBagIcon,
    name: 'Moda, ropa y calzado',
    tag: 'Retail',
    perks: [
      'Variantes por color y talla',
      'Catálogo y tienda online con tu marca',
      'Inventario por sede',
      'Fidelización de clientes',
    ],
  },
  {
    icon: TruckIcon,
    name: 'Distribución y mayoristas',
    tag: 'B2B',
    perks: [
      'Multi-sede con inventario propio',
      'Listas de precios y cartera',
      'Reportes por sede',
      'Clientes y cotizaciones',
    ],
  },
  {
    icon: Cog6ToothIcon,
    name: 'Servicios y profesionales',
    tag: 'Servicios',
    perks: [
      'Agenda de citas',
      'Clientes con historial',
      'Cotizaciones y cartera',
      'Cobros y recordatorios',
    ],
  },
];

// ── Beneficios (por qué te conviene) ──
const BENEFITS = [
  {
    icon: BoltIcon,
    title: 'Deja de pagar varias herramientas',
    desc: 'POS, inventario, CRM, citas, reportes y tienda online en un solo lugar y una sola cuenta.',
  },
  {
    icon: MapPinIcon,
    title: 'Controla todo desde donde estés',
    desc: 'En la nube y como app en tu celular. Mira tus ventas y tu negocio en tiempo real.',
  },
  {
    icon: ClockIcon,
    title: 'Empieza en minutos',
    desc: 'Sin instalaciones ni técnicos. Crea tu cuenta, carga tus productos y a vender.',
  },
  {
    icon: CreditCardIcon,
    title: 'Sin permanencia',
    desc: 'Planes flexibles en pesos, con prueba gratis. Cancela cuando quieras.',
  },
];

// ── Roadmap ──
const ROADMAP = [
  {
    icon: ReceiptPercentIcon,
    title: 'Facturación electrónica DIAN',
    desc: 'Emite facturas electrónicas válidas ante la DIAN, desde el mismo sistema.',
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

const FAQ = [
  {
    q: '¿Sirve para mi tipo de negocio?',
    a: 'Sí. Pegazo se adapta a barberías, consultorios, restaurantes, supermercados, moda, distribución y servicios. El vocabulario y las funciones cambian según lo que vendes.',
  },
  {
    q: '¿Puedo manejar varios locales?',
    a: 'Sí. Puedes tener varias sedes desde una sola cuenta, y cada local con su propio inventario, ventas y reportes.',
  },
  {
    q: '¿Necesito instalar algo?',
    a: 'No. Funciona en la nube desde el navegador y se instala como app en tu celular. Empiezas en minutos.',
  },
  {
    q: '¿La tienda online tiene costo aparte?',
    a: 'Tu tienda online se conecta a tu inventario y usa tu marca. Se activa según tu plan, sin montar otra plataforma.',
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

// ─────────────────────────────────────────────────────────────
// Mockups visuales (para "mostrar" el sistema sin capturas reales)
// ─────────────────────────────────────────────────────────────
function DashboardMockup() {
  const bars = [40, 62, 52, 78, 96, 70, 88];
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  return (
    <div className="w-full rounded-2xl border border-white/10 bg-neutral-900 p-4 shadow-2xl">
      {/* barra de ventana */}
      <div className="mb-3 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 text-[11px] text-neutral-500">
          pegazo.co · panel
        </span>
      </div>
      {/* stat cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: 'Ventas hoy', v: '$ 1.284.500', c: 'text-emerald-400' },
          { l: 'Nº de ventas', v: '37', c: 'text-white' },
          { l: 'Por cobrar', v: '$ 320.000', c: 'text-orange-400' },
        ].map((s) => (
          <div key={s.l} className="rounded-xl bg-white/5 px-3 py-2">
            <p className={`text-sm font-bold tabular-nums ${s.c}`}>{s.v}</p>
            <p className="text-[10px] text-neutral-400">{s.l}</p>
          </div>
        ))}
      </div>
      {/* gráfica */}
      <div className="mt-3 rounded-xl bg-white/5 p-3">
        <p className="mb-2 text-[11px] font-medium text-neutral-300">
          Ventas de la semana
        </p>
        {/* Barras: hijas DIRECTAS de un contenedor con altura fija para que el
            height en % se calcule bien. */}
        <div className="flex h-24 items-end gap-2">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-orange-600 to-amber-400"
              style={{ height: `${h}%` }}
              title={days[i]}
            />
          ))}
        </div>
        <div className="mt-1 flex gap-2">
          {days.map((d, i) => (
            <span
              key={i}
              className="flex-1 text-center text-[9px] text-neutral-500"
            >
              {d}
            </span>
          ))}
        </div>
      </div>
      {/* por agotarse */}
      <div className="mt-3 rounded-xl bg-white/5 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-neutral-300">
          <ExclamationTriangleIcon className="h-3.5 w-3.5 text-amber-400" />
          Productos por agotarse
        </div>
        {[
          { n: 'Cera Gold', s: '2 und', c: 'text-amber-400' },
          { n: 'Shampoo 500ml', s: '0 und', c: 'text-red-400' },
        ].map((p) => (
          <div
            key={p.n}
            className="flex items-center justify-between border-t border-white/5 py-1 text-[11px]"
          >
            <span className="text-neutral-300">{p.n}</span>
            <span className={`font-semibold ${p.c}`}>{p.s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneStoreMockup() {
  return (
    <div className="mx-auto w-[220px] rounded-[2rem] border-4 border-neutral-800 bg-neutral-950 p-2 shadow-2xl">
      <div className="overflow-hidden rounded-[1.5rem] bg-white">
        {/* header tienda */}
        <div className="flex items-center justify-between bg-neutral-900 px-3 py-2 text-white">
          <span className="text-[11px] font-bold">Mi Tienda</span>
          <div className="flex gap-1.5 text-[10px] text-neutral-300">
            <span>👤</span>
            <span>🛒</span>
          </div>
        </div>
        {/* banner */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 px-3 py-4 text-white">
          <p className="text-[11px] font-bold leading-tight">
            Envío gratis por compras hoy
          </p>
          <p className="text-[9px] text-white/80">Con tu marca y tus colores</p>
        </div>
        {/* grid productos */}
        <div className="grid grid-cols-2 gap-2 p-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-neutral-100 p-1.5 shadow-sm"
            >
              <div className="mb-1 h-12 rounded bg-neutral-100" />
              <div className="h-1.5 w-3/4 rounded bg-neutral-200" />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[9px] font-bold text-neutral-800">
                  $ 25.000
                </span>
                <span className="rounded bg-orange-500 px-1 text-[8px] font-bold text-white">
                  +
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:py-20 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300">
              <BoltIcon className="h-3.5 w-3.5 text-orange-400" /> Un solo
              sistema para cualquier negocio
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Todo tu negocio,{' '}
              <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
                en un solo lugar
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-300 lg:mx-0">
              Ventas, inventario, clientes, citas, cartera, reportes y tu propia
              tienda online. Pegazo se adapta a lo que vendes y hace despegar tu
              negocio —todo desde la nube.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
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

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-neutral-400 lg:justify-start">
              {['En la nube', 'Multi-sede', 'Sin permanencia', 'Hecho para Colombia'].map(
                (t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircleIcon className="h-4 w-4 text-orange-500" /> {t}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Mockup del panel */}
          <div className="mx-auto w-full max-w-md">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* DIFERENCIADORES */}
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

      {/* SHOWCASE / MÍRALO POR DENTRO */}
      <section className="bg-neutral-950 py-20 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">Míralo por dentro</h2>
            <p className="mt-3 text-neutral-400">
              Un panel claro con tus números en tiempo real, y una tienda online
              con tu marca.
            </p>
          </div>
          <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold">
                Tu negocio en una sola pantalla
              </h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  'Ventas del día y de la semana con gráfica',
                  'Cuánto te deben (cartera) y cuánto entró por cada medio de pago',
                  'Productos por agotarse y agotados, para reponer a tiempo',
                  'Cierre de caja y reportes con un clic',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-neutral-300">
                    <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-none text-orange-500" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mx-auto w-full max-w-md">
              <DashboardMockup />
            </div>

            <div className="order-4 mx-auto lg:order-3">
              <PhoneStoreMockup />
            </div>
            <div className="order-3 lg:order-4">
              <h3 className="text-xl font-bold">Tu tienda online lista</h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  'Con tu logo, colores y productos',
                  'Sincronizada con tu inventario en tiempo real',
                  'Tus clientes crean cuenta (incluso con Google) y siguen su pedido',
                  'Cobros en línea y avisos de pago al instante',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-neutral-300">
                    <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-none text-orange-500" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FUNCIONES por área */}
      <section id="funciones" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Todo lo que tu negocio necesita
          </h2>
          <p className="mt-3 text-neutral-500">
            Un solo sistema para vender, controlar y crecer. Deja de pagar
            varias herramientas.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURE_GROUPS.map((g) => (
            <div
              key={g.title}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-orange-300 hover:shadow-md"
            >
              <span className="inline-flex rounded-xl bg-orange-50 p-2.5 text-orange-600">
                <g.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-3 font-bold text-neutral-900">{g.title}</h3>
              <ul className="mt-3 space-y-1.5">
                {g.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-sm">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-none text-orange-500" />
                    <span className="text-neutral-600">{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* POR VERTICAL (individual) */}
      <section id="negocios" className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-neutral-900">
              Hecho para tu tipo de negocio
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-500">
              No es genérico: cada negocio tiene sus propias funciones. Elige el
              tuyo.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {VERTICALS.map((v) => (
              <div
                key={v.name}
                className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex flex-none rounded-xl bg-neutral-900 p-2.5 text-white">
                    <v.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-bold text-neutral-900">{v.name}</h3>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-orange-600">
                      {v.tag}
                    </p>
                  </div>
                </div>
                <ul className="mt-4 space-y-1.5">
                  {v.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-none text-orange-500" />
                      <span className="text-neutral-600">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Por qué te conviene
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="text-center sm:text-left">
              <span className="inline-flex rounded-xl bg-orange-50 p-3 text-orange-600">
                <b.icon className="h-7 w-7" />
              </span>
              <h3 className="mt-4 font-semibold text-neutral-900">{b.title}</h3>
              <p className="mt-1.5 text-sm text-neutral-500">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRÓXIMAMENTE */}
      <section className="bg-neutral-950 py-20 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-400">
              <RocketLaunchIcon className="h-3.5 w-3.5" /> Próximamente
            </span>
            <h2 className="mt-3 text-3xl font-bold">Esto es solo el comienzo</h2>
            <p className="mt-3 text-neutral-400">
              Pegazo crece contigo. Estas son algunas funciones que se vienen.
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
          Todos los planes incluyen datos en la nube y respaldados. Precios en
          pesos colombianos (COP).
        </p>
      </section>

      {/* FAQ */}
      <section className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-center text-3xl font-bold text-neutral-900">
            Preguntas frecuentes
          </h2>
          <div className="mt-10 space-y-3">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-neutral-900">
                  {f.q}
                  <span className="text-orange-500 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-neutral-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
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
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
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
