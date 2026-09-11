import {
  HomeIcon,
  BuildingOffice2Icon,
  TagIcon,
  SparklesIcon,
  TruckIcon,
  ArchiveBoxIcon,
  UsersIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  ChartBarSquareIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
  MoonIcon,
  WrenchScrewdriverIcon,
  GlobeAltIcon,
  Squares2X2Icon,
  FireIcon,
  BuildingLibraryIcon,
  ListBulletIcon,
  BookOpenIcon,
  ChartPieIcon,
  CalculatorIcon,
  InboxArrowDownIcon,
  GiftIcon,
  DocumentTextIcon,
  ArrowUturnLeftIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

// El menú sigue un PASO A PASO de arriba hacia abajo, pensado para que cualquier
// persona lo use sin confundirse:
//   1. Inicio  2. Atención (lo que haces cuando llega el cliente)
//   3. Ventas (facturar/cobrar)  4. Clientes  5. Catálogo (lo que vendes)
//   6. Finanzas (dinero/reportes)  7. Administración.
// Cada sección solo aparece si la vertical usa alguno de sus módulos.
// IMPORTANTE: un catálogo que se anida (payment-methods, units-of-measure, etc.)
// debe ir en la MISMA sección que su padre (ver NEST_PARENT en useNavigation).
export const NAVIGATION = [
  {
    section: 'Inicio',
    items: [
      {
        name: 'Inicio',
        href: '/dashboard',
        icon: HomeIcon,
        roles: [
          'SUPER_ADMIN',
          'ADMIN',
          'RECEPCIONISTA',
          'COORDINADOR',
          'AUXILIAR',
          'ASESOR',
          'BODEGUERO',
          'VENTAS',
          'CAJA',
          'MESERO',
          'COCINERO',
          'PROFESIONAL',
          'BARBERO',
        ],
      },
    ],
  },

  // 2. ATENCIÓN — lo primero que haces cuando llega un cliente.
  {
    section: 'Atención',
    items: [
      {
        name: 'Citas',
        href: '/dashboard/appointments',
        icon: CalendarDaysIcon,
        roles: [
          'SUPER_ADMIN',
          'ADMIN',
          'BARBERO',
          'PROFESIONAL',
          'RECEPCIONISTA',
        ],
      },
      {
        name: 'Descansos',
        href: '/dashboard/rest-days',
        icon: MoonIcon,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Mesas',
        href: '/dashboard/mesas',
        icon: Squares2X2Icon,
        roles: [
          'SUPER_ADMIN',
          'ADMIN',
          'ASESOR',
          'RECEPCIONISTA',
          'CAJA',
          'MESERO',
        ],
      },
      {
        name: 'Cocina',
        href: '/dashboard/kitchen',
        icon: FireIcon,
        roles: [
          'SUPER_ADMIN',
          'ADMIN',
          'ASESOR',
          'RECEPCIONISTA',
          'AUXILIAR',
          'MESERO',
          'COCINERO',
        ],
      },
      {
        name: 'Guarda cascos',
        href: '/dashboard/storage',
        icon: ArchiveBoxIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA', 'ASESOR', 'CAJA'],
      },
    ],
  },

  // 3. VENTAS — facturar y cobrar.
  {
    section: 'Ventas',
    items: [
      {
        name: 'Realizar Factura',
        href: '/dashboard/sales',
        icon: BanknotesIcon,
        roles: [
          'SUPER_ADMIN',
          'ADMIN',
          'ASESOR',
          'RECEPCIONISTA',
          'VENTAS',
          'CAJA',
        ],
      },
      {
        name: 'Pedidos',
        href: '/dashboard/orders',
        icon: ShoppingCartIcon,
        roles: [
          'SUPER_ADMIN',
          'ADMIN',
          'ASESOR',
          'RECEPCIONISTA',
          'VENTAS',
          'CAJA',
        ],
      },
      {
        name: 'Cotizaciones',
        href: '/dashboard/quotes',
        icon: DocumentTextIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA', 'VENTAS'],
      },
      {
        name: 'Ventas Realizadas',
        href: '/dashboard/delivered_sales',
        icon: ClipboardDocumentCheckIcon,
        roles: [
          'SUPER_ADMIN',
          'ADMIN',
          'ASESOR',
          'RECEPCIONISTA',
          'CAJA',
          'VENTAS',
        ],
      },
      {
        name: 'Devoluciones',
        href: '/dashboard/returns',
        icon: ArrowUturnLeftIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
      {
        name: 'Caja',
        href: '/dashboard/cash',
        icon: CalculatorIcon,
        roles: [
          'SUPER_ADMIN',
          'ADMIN',
          'ASESOR',
          'RECEPCIONISTA',
          'CAJA',
          'VENTAS',
        ],
      },
      {
        name: 'Métodos de pago',
        href: '/dashboard/payment-methods',
        icon: CreditCardIcon,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Cartera',
        href: '/dashboard/cartera',
        icon: CreditCardIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA', 'CAJA'],
      },
    ],
  },

  // 4. CLIENTES.
  {
    section: 'Clientes',
    items: [
      {
        name: 'Clientes',
        href: '/dashboard/customers',
        icon: UsersIcon,
        roles: [
          'SUPER_ADMIN',
          'ADMIN',
          'ASESOR',
          'RECEPCIONISTA',
          'VENTAS',
          'CAJA',
        ],
      },
      {
        name: 'Segmentos de cliente',
        href: '/dashboard/customer-segments',
        icon: TagIcon,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Fidelización',
        href: '/dashboard/loyalty',
        icon: GiftIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
      {
        name: 'Membresías',
        href: '/dashboard/memberships',
        icon: CreditCardIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA'],
      },
    ],
  },

  // 5. CATÁLOGO — lo que vendes (productos y servicios) y su abastecimiento.
  {
    section: 'Catálogo',
    items: [
      {
        name: 'Servicios',
        href: '/dashboard/services',
        icon: WrenchScrewdriverIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA'],
      },
      {
        name: 'Inventario',
        href: '/dashboard/inventory',
        icon: ArchiveBoxIcon,
        roles: [
          'SUPER_ADMIN',
          'ADMIN',
          'ASESOR',
          'RECEPCIONISTA',
          'BODEGUERO',
          'VENTAS',
        ],
      },
      {
        name: 'Unidades de medida',
        href: '/dashboard/units-of-measure',
        icon: TagIcon,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Categorías',
        href: '/dashboard/categories',
        icon: TagIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA', 'BODEGUERO'],
      },
      {
        name: 'Marcas',
        href: '/dashboard/brands',
        icon: SparklesIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA', 'BODEGUERO'],
      },
      {
        name: 'Insumos',
        href: '/dashboard/supplies',
        icon: BeakerIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA', 'CAJA', 'COCINERO'],
      },
      {
        name: 'Proveedores',
        href: '/dashboard/providers',
        icon: TruckIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA', 'BODEGUERO'],
      },
      {
        name: 'Compras',
        href: '/dashboard/purchases',
        icon: InboxArrowDownIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA', 'BODEGUERO'],
      },
    ],
  },

  // 6. FINANZAS — dinero y reportes.
  {
    section: 'Finanzas',
    items: [
      {
        name: 'Gastos',
        href: '/dashboard/expenses',
        icon: ChartBarSquareIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ASESOR', 'RECEPCIONISTA'],
      },
      {
        name: 'Tipos de gasto',
        href: '/dashboard/expense-categories',
        icon: TagIcon,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Cuentas por pagar',
        href: '/dashboard/payables',
        icon: BanknotesIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA'],
      },
      {
        name: 'Cargos a empleados',
        href: '/dashboard/employee-charges',
        icon: CreditCardIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'BARBERO', 'PROFESIONAL'],
      },
      {
        name: 'Tipos de cargo',
        href: '/dashboard/charge-categories',
        icon: TagIcon,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Consignaciones',
        href: '/dashboard/bank',
        icon: BanknotesIcon,
        // Información financiera sensible: SOLO el dueño (SUPER_ADMIN), el
        // administrador (ADMIN) y la recepcionista.
        roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA'],
      },
      {
        name: 'Impuestos (IVA)',
        href: '/dashboard/impuestos',
        icon: ReceiptPercentIcon,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Estadísticas',
        href: '/dashboard/statistics',
        icon: ChartBarSquareIcon,
        roles: ['SUPER_ADMIN'],
      },
      {
        // Solo aparece si la plataforma la habilitó para la empresa.
        name: 'Facturación electrónica',
        href: '/dashboard/facturacion-electronica',
        icon: DocumentTextIcon,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Nómina electrónica',
        href: '/dashboard/nomina-electronica',
        icon: DocumentTextIcon,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
    ],
  },

  // 7. CONTABILIDAD — capa contable (se muestra si el dueño la activa + plan).
  //    Info financiera sensible: solo dueño (SUPER_ADMIN) y administrador.
  //    A futuro se suma el rol CONTADOR y más módulos (plan de cuentas, estados).
  {
    section: 'Contabilidad',
    items: [
      {
        name: 'Activos',
        href: '/dashboard/assets',
        icon: BuildingLibraryIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'CONTADOR'],
      },
      {
        name: 'Plan de cuentas',
        href: '/dashboard/plan-cuentas',
        icon: ListBulletIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'CONTADOR'],
      },
      {
        name: 'Libros',
        href: '/dashboard/libros',
        icon: BookOpenIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'CONTADOR'],
      },
      {
        name: 'Estados financieros',
        href: '/dashboard/estados-financieros',
        icon: ChartPieIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'CONTADOR'],
      },
    ],
  },

  // 8. ADMINISTRACIÓN — configuración del negocio.
  {
    section: 'Administración',
    items: [
      {
        name: 'Usuarios / Roles',
        href: '/dashboard/users',
        icon: UserGroupIcon,
        roles: ['SUPER_ADMIN'],
      },
      {
        name: 'Locales',
        href: '/dashboard/locals',
        icon: BuildingOffice2Icon,
        roles: ['SUPER_ADMIN'],
      },
      {
        name: 'Tienda online',
        href: '/dashboard/website',
        icon: GlobeAltIcon,
        roles: ['SUPER_ADMIN'],
      },
      {
        name: 'Configuración',
        href: '/dashboard/settings',
        icon: Cog6ToothIcon,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
    ],
  },
];
