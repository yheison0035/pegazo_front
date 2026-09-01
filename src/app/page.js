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
  XMarkIcon,
} from '@heroicons/react/24/outline';
import VerticalShowcase from '@/components/landing/VerticalShowcase';

// Cotización directa por WhatsApp (venta punto a punto; los precios se acuerdan
// con cada cliente). Los planes y sus límites siguen aplicados en el CRM.
const WHATSAPP =
  'https://wa.me/573186356609?text=' +
  encodeURIComponent('Hola, quiero cotizar Pegazo para mi negocio.');

// Todo lo que incluye la plataforma (para el plan a la medida).
const INCLUDED = [
  'Punto de venta y facturación',
  'Control de inventario en tiempo real',
  'Variantes (color, talla) y código de barras',
  'Productos por agotarse y agotados',
  'Varios locales, cada uno con su inventario',
  'Clientes (CRM), historial y notas',
  'Cartera y fiado',
  'Apertura y cierre de caja',
  'Gastos y utilidad',
  'IVA e impuestos (Colombia)',
  'Cotizaciones',
  'Citas y agenda de servicios',
  'Comisiones por empleado',
  'Fidelización de clientes',
  'Reportes de ventas y estadísticas',
  'Roles, permisos y auditoría',
  'WhatsApp a tus clientes',
  'Mesas e insumos (restaurantes)',
  'Aviso de consignaciones en tiempo real',
  'Tu tienda online conectada al inventario',
  'App instalable en el celular',
  'Personalización de panel y tienda',
];

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
    desc: 'Cuando te transfieren o consignan, Pegazo te avisa al instante (con voz y notificación) sin revisar el banco. Nadie más lo tiene.',
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

// ── Cómo funciona (3 pasos) ──
const HOW_STEPS = [
  {
    n: '1',
    title: 'Cotiza tu plan',
    desc: 'Escríbenos por WhatsApp y te asesoramos según tu tipo de negocio, tus sedes y tu equipo.',
  },
  {
    n: '2',
    title: 'Montamos tu negocio',
    desc: 'Te configuramos la cuenta y te ayudamos a cargar tu inventario, servicios y colaboradores.',
  },
  {
    n: '3',
    title: 'Empieza a vender',
    desc: 'Factura, gestiona citas, cobra, mira tus reportes y activa tu tienda online desde el primer día.',
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
    q: '¿Qué es Pegazo?',
    a: 'Pegazo es un software de gestión en la nube (POS + CRM) para administrar tu negocio: ventas y facturación, inventario, clientes, cartera, citas, reportes y tu propia tienda online. Todo en una sola plataforma, desde el navegador o como app en tu celular.',
  },
  {
    q: '¿Sirve para mi tipo de negocio?',
    a: 'Sí. Pegazo se adapta a barberías y salones, consultorios y clínicas (odontología, estética), restaurantes y bares, supermercados y minimercados, tiendas de ropa, distribución y servicios. El vocabulario y las funciones cambian según lo que vendes.',
  },
  {
    q: '¿Puedo manejar varios locales o sedes?',
    a: 'Sí. Puedes tener varias sedes desde una sola cuenta, y cada local con su propio inventario, ventas, caja y reportes, con control de roles para tu equipo.',
  },
  {
    q: '¿Necesito instalar algo o un técnico?',
    a: 'No. Pegazo funciona en la nube desde cualquier navegador y se instala como app en tu celular (PWA). Creas tu cuenta, cargas tus productos y empiezas a vender en minutos.',
  },
  {
    q: '¿Incluye tienda online?',
    a: 'Sí. Tu tienda online se conecta a tu inventario en tiempo real y usa tu marca (logo y colores). Tú eliges qué productos publicar y tus clientes crean su cuenta y siguen sus pedidos. Se activa según tu plan, sin montar otra plataforma.',
  },
  {
    q: '¿Puedo controlar el fiado y la cartera?',
    a: 'Sí. Registras ventas a crédito (fiado), controlas cuánto te deben, los abonos y el saldo de cada cliente, y haces el cierre de caja con arqueo cada día.',
  },
  {
    q: '¿Cuánto cuesta y hay permanencia?',
    a: 'Puedes empezar gratis y subir de plan cuando crezcas. Los planes son en pesos colombianos, sin permanencia, con prueba gratis en los planes pagos. Cancela cuando quieras.',
  },
  {
    q: '¿Pegazo factura electrónicamente ante la DIAN?',
    a: 'La facturación electrónica DIAN está en camino. Hoy imprimes tu factura y controlas tus ventas e IVA; muy pronto podrás emitir facturas electrónicas válidas desde el mismo sistema.',
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
      applicationSubCategory: 'POS, CRM, Inventario, Ecommerce',
      operatingSystem: 'Web, iOS, Android',
      url: 'https://pegazo.co',
      inLanguage: 'es-CO',
      description:
        'Plataforma todo en uno para gestionar y hacer despegar tu negocio, con tienda online conectada al inventario.',
      featureList: [
        'Punto de venta y facturación',
        'Control de inventario en tiempo real con multi-local',
        'Clientes (CRM), cartera y fiado',
        'Citas y agenda de servicios',
        'Cierre de caja y control de gastos',
        'Reportes de ventas y estadísticas',
        'Fidelización de clientes',
        'Tienda online conectada al inventario',
        'Roles, permisos y auditoría',
        'Comisiones por empleado',
        'Aviso de consignaciones en tiempo real',
      ],
      offers: {
        '@type': 'Offer',
        priceCurrency: 'COP',
        availability: 'https://schema.org/InStock',
        description:
          'Plan a la medida de tu negocio. Cotiza por WhatsApp, sin permanencia.',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://pegazo.co/#faq',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
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
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
            >
              Cotizar
            </a>
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
              negocio, todo desde la nube.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-7 py-3 font-semibold text-white shadow-lg hover:opacity-90 sm:w-auto"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" /> Cotizar por WhatsApp
              </a>
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

      {/* ¿QUÉ ES PEGAZO? (contenido para SEO) */}
      <section className="mx-auto max-w-4xl px-5 pt-16 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
          ¿Qué es Pegazo?
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-neutral-600">
          <b>Pegazo</b> es un software de gestión en la nube (punto de venta y
          CRM) para administrar tu negocio desde un solo lugar: ventas y
          facturación, control de inventario, clientes, cartera y fiado, gastos,
          cierre de caja, citas, reportes y estadísticas, fidelización y tu
          propia tienda online conectada al inventario. Funciona en cualquier
          navegador y como app en tu celular, y se adapta a tu tipo de negocio:
          barberías, consultorios, restaurantes, supermercados, tiendas de ropa,
          distribución y servicios. Ideal para negocios y pymes en Colombia que
          quieren vender más y controlar mejor, sin planillas de Excel ni pagar
          varias herramientas.
        </p>
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

      {/* DEMO INTERACTIVA: elige tu negocio y míralo adaptarse */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
              <SparklesIcon className="h-3.5 w-3.5" /> Demo en vivo
            </span>
            <h2 className="text-3xl font-bold text-neutral-900">
              Elige tu negocio y míralo adaptarse
            </h2>
            <p className="mt-3 text-neutral-500">
              El mismo Pegazo, con el menú, el vocabulario y el catálogo de TU
              negocio. Toca un tipo y compruébalo.
            </p>
          </div>
          <div className="mt-10">
            <VerticalShowcase />
          </div>
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

      {/* CÓMO FUNCIONA */}
      <section className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-neutral-900">
              Empieza en 3 pasos
            </h2>
            <p className="mt-3 text-neutral-500">
              Sin instalaciones ni complicaciones. Hoy mismo estás vendiendo.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {HOW_STEPS.map((s) => (
              <div
                key={s.n}
                className="relative rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-600 to-amber-500 text-lg font-bold text-white shadow">
                  {s.n}
                </span>
                <h3 className="mt-4 font-semibold text-neutral-900">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm text-neutral-500">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-7 py-3 font-semibold text-white shadow-lg hover:opacity-90"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" /> Cotizar por
              WhatsApp
            </a>
          </div>
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

      {/* PLAN A TU MEDIDA (cotización por WhatsApp) */}
      {/* COMPARATIVA */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            ¿Por qué Pegazo y no otro?
          </h2>
          <p className="mt-3 text-neutral-500">
            Otros llevan la contabilidad. Pegazo hace vender: se adapta a tu
            negocio y trae tu tienda online conectada al inventario.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-3 text-left font-medium text-neutral-500"></th>
                <th className="rounded-t-xl bg-gradient-to-br from-orange-600 to-amber-500 p-3 text-center font-bold text-white">
                  Pegazo
                </th>
                <th className="p-3 text-center font-semibold text-neutral-500">
                  Alegra
                </th>
                <th className="p-3 text-center font-semibold text-neutral-500">
                  Siigo
                </th>
                <th className="p-3 text-center font-semibold text-neutral-500">
                  Treinta
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Se adapta a tu tipo de negocio', ['Sí, configurable', 'Genérico', 'Genérico', 'Básico']],
                ['Tienda online conectada al inventario', ['Incluida', false, false, false]],
                ['Citas / agenda + fidelización', ['Sí', false, false, false]],
                ['Restaurante: mesas + cocina (KDS)', ['Sí', false, false, false]],
                ['Multi-sede con inventario por local', ['Sí', 'Sí', 'Sí', 'Limitado']],
                ['Pagos en línea a tu propio banco', ['Sí', false, false, false]],
                ['App en el celular (PWA)', ['Sí', 'Sí', 'Sí', 'Sí']],
                ['Facturación electrónica DIAN', ['En camino', 'Sí', 'Sí', false]],
              ].map(([label, cells], i) => (
                <tr key={label} className={i % 2 ? 'bg-neutral-50' : ''}>
                  <td className="p-3 text-left font-medium text-neutral-700">
                    {label}
                  </td>
                  {cells.map((c, j) => (
                    <td
                      key={j}
                      className={`p-3 text-center ${
                        j === 0 ? 'bg-orange-50/60 font-semibold text-orange-700' : 'text-neutral-500'
                      }`}
                    >
                      {c === false ? (
                        <XMarkIcon className="mx-auto h-4 w-4 text-neutral-300" />
                      ) : c === true || c === 'Sí' || c === 'Incluida' ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircleIcon
                            className={`h-4 w-4 ${j === 0 ? 'text-orange-600' : 'text-emerald-500'}`}
                          />
                          {c !== 'Sí' ? c : ''}
                        </span>
                      ) : (
                        c
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-xs text-neutral-400">
          La facturación electrónica DIAN está en camino en Pegazo. Todo lo demás,
          ya disponible hoy.
        </p>
      </section>

      <section id="planes" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Un plan a la medida de tu negocio
          </h2>
          <p className="mt-3 text-neutral-500">
            Nosotros te asesoramos y armamos el plan según lo que necesitas. Sin
            permanencia. Escríbenos y te cotizamos al instante.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="grid md:grid-cols-2">
            {/* Lado marca / CTA */}
            <div className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-8 text-white sm:p-10">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500 opacity-20 blur-3xl" />
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                Plan a tu medida
              </p>
              <h3 className="mt-2 text-2xl font-bold">
                Todo Pegazo, ajustado a tu negocio
              </h3>
              <p className="mt-3 text-neutral-300">
                Pagas por lo que tu negocio necesita. Te asesoramos según tu
                tipo de negocio, tus sedes y tu equipo.
              </p>
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-3.5 font-semibold text-white shadow-lg transition hover:opacity-90"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                Cotizar por WhatsApp
              </a>
              <p className="mt-3 text-xs text-neutral-400">
                Respuesta rápida · Sin compromiso
              </p>
            </div>

            {/* Lado incluido */}
            <div className="p-8 sm:p-10">
              <p className="mb-4 font-semibold text-neutral-900">
                Incluye todo lo que ofrece Pegazo:
              </p>
              <ul className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {INCLUDED.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-none text-orange-500" />
                    <span className="text-neutral-600">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-neutral-400">
          Datos en la nube y respaldados. Te ayudamos a montar tu negocio en el
          sistema.
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
            Todo tu negocio, en un solo lugar. Escríbenos y te armamos el plan a
            tu medida.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-8 py-3.5 font-semibold text-white shadow-lg hover:bg-neutral-800 sm:w-auto"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" /> Cotizar por WhatsApp
            </a>
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
