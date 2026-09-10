'use client';

import { useState } from 'react';
import {
  HomeIcon,
  CalendarDaysIcon,
  ScissorsIcon,
  UsersIcon,
  BanknotesIcon,
  GiftIcon,
  ChartBarIcon,
  TableCellsIcon,
  FireIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  TruckIcon,
  BeakerIcon,
  TagIcon,
  Squares2X2Icon,
  GlobeAltIcon,
  BuildingStorefrontIcon,
  ReceiptPercentIcon,
  ArrowUturnLeftIcon,
  WrenchScrewdriverIcon,
  IdentificationIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { BUSINESS_TYPES } from '@/config/businessTypes';

// Etiqueta + ícono REAL de cada módulo del CRM (para mostrar el menú tal cual
// lo verá el dueño). La clave es la del módulo (último segmento de la ruta).
const MODULE_META = {
  dashboard: ['Inicio', HomeIcon],
  sales: ['Facturar (POS)', ShoppingBagIcon],
  delivered_sales: ['Ventas realizadas', ShoppingBagIcon],
  cash: ['Caja', BanknotesIcon],
  cartera: ['Cartera y fiado', CreditCardIcon],
  returns: ['Devoluciones', ArrowUturnLeftIcon],
  quotes: ['Cotizaciones', ClipboardDocumentListIcon],
  impuestos: ['Impuestos (IVA)', ReceiptPercentIcon],
  inventory: ['Inventario', ArchiveBoxIcon],
  categories: ['Categorías', Squares2X2Icon],
  brands: ['Marcas', TagIcon],
  providers: ['Proveedores', TruckIcon],
  purchases: ['Compras', ShoppingCartIcon],
  supplies: ['Insumos', BeakerIcon],
  customers: ['Clientes', UsersIcon],
  loyalty: ['Fidelización', GiftIcon],
  memberships: ['Membresías', IdentificationIcon],
  storage: ['Guarda cascos', ArchiveBoxIcon],
  appointments: ['Citas / Reservas', CalendarDaysIcon],
  services: ['Servicios', ScissorsIcon],
  clinical: ['Historia clínica', ClipboardDocumentListIcon],
  mesas: ['Mesas', TableCellsIcon],
  kitchen: ['Cocina (KDS)', FireIcon],
  expenses: ['Gastos', BanknotesIcon],
  payables: ['Cuentas por pagar', CreditCardIcon],
  'employee-charges': ['Cargos a empleados', CreditCardIcon],
  statistics: ['Estadísticas', ChartBarIcon],
  users: ['Usuarios y roles', UsersIcon],
  locals: ['Locales / sedes', BuildingOffice2Icon],
  bank: ['Consignaciones', BanknotesIcon],
  'nomina-electronica': ['Nómina electrónica', IdentificationIcon],
  website: ['Tienda online', GlobeAltIcon],
  orders: ['Pedidos', ShoppingBagIcon],
  settings: ['Configuración', WrenchScrewdriverIcon],
};

// Módulos reales que verá el dueño de cada tipo (Inicio primero, Configuración
// al final). Toma la lista curada por vertical del CRM (businessTypes.js).
function realModules(type) {
  const base = BUSINESS_TYPES[type] || [];
  return ['dashboard', ...base, 'settings'];
}

// Íconos por nombre de módulo (mismos que el menú real del CRM).
const ICONS = {
  Inicio: HomeIcon,
  Citas: CalendarDaysIcon,
  Servicios: ScissorsIcon,
  Clientes: UsersIcon,
  Pacientes: UsersIcon,
  Historia: ClipboardDocumentListIcon,
  Caja: BanknotesIcon,
  Gastos: BanknotesIcon,
  Fidelización: GiftIcon,
  Estadísticas: ChartBarIcon,
  Mesas: TableCellsIcon,
  Cocina: FireIcon,
  Menú: ClipboardDocumentListIcon,
  Insumos: BeakerIcon,
  Inventario: ArchiveBoxIcon,
  Compras: ShoppingCartIcon,
  Ventas: ShoppingBagIcon,
  Cartera: CreditCardIcon,
  Proveedores: TruckIcon,
  Turnos: CalendarDaysIcon,
  Reservas: CalendarDaysIcon,
  Lavados: ScissorsIcon,
  Guardados: ArchiveBoxIcon,
};

// El visitante elige un tipo de negocio y ve el panel de Pegazo adaptado
// (menú, vocabulario y catálogo). Datos ilustrativos.
const VERTICALS = [
  {
    id: 'barberia', type: 'SERVICIOS', emoji: '💈', name: 'Barbería', biz: 'RAGNOR Barber',
    accent: 'Se agenda por barbero, con comisiones y fidelización.',
    catalog: 'Servicios',
    items: [['Corte clásico', '$18.000'], ['Corte + barba', '$28.000'], ['Perfilado de cejas', '$8.000']],
    kpis: [['Ventas de hoy', '$486.000', 'bg-emerald-400'], ['Citas hoy', '14', 'bg-orange-400']],
  },
  {
    id: 'restaurante', type: 'RESTAURANTE', emoji: '🍽️', name: 'Restaurante', biz: 'La Parrilla',
    accent: 'Mesas, comandas y pantalla de cocina (KDS).',
    catalog: 'Menú',
    items: [['Bandeja paisa', '$26.000'], ['Limonada de coco', '$9.000'], ['Postre del día', '$7.000']],
    kpis: [['Ventas de hoy', '$1.240.000', 'bg-emerald-400'], ['Mesas activas', '6', 'bg-orange-400']],
  },
  {
    id: 'ferreteria', type: 'COMERCIO', emoji: '🔧', name: 'Ferretería', biz: 'El Tornillo',
    accent: 'Inventario, compras, cartera y fiado a la mano.',
    catalog: 'Inventario',
    items: [['Tornillo 1/4" (100u)', '$12.000'], ['Pintura vinilo 1gl', '$62.000'], ['Cinta aislante', '$4.500']],
    kpis: [['Ventas de hoy', '$2.150.000', 'bg-emerald-400'], ['Por cobrar', '$1.8M', 'bg-orange-400']],
  },
  {
    id: 'veterinaria', type: 'SERVICIOS', emoji: '🐾', name: 'Veterinaria', biz: 'Huellitas',
    accent: 'Citas por especialista y ficha de cada mascota.',
    catalog: 'Servicios',
    items: [['Consulta general', '$45.000'], ['Vacuna múltiple', '$55.000'], ['Baño y peluquería', '$35.000']],
    kpis: [['Ventas de hoy', '$620.000', 'bg-emerald-400'], ['Citas hoy', '9', 'bg-orange-400']],
  },
  {
    id: 'odontologia', type: 'ODONTOLOGIA', emoji: '🦷', name: 'Odontología', biz: 'Clínica Sonríe',
    accent: 'Historia clínica por paciente, odontograma y consentimientos firmados.',
    catalog: 'Tratamientos',
    items: [['Consulta + diagnóstico', '$60.000'], ['Limpieza dental', '$90.000'], ['Resina (por diente)', '$130.000']],
    kpis: [['Ventas de hoy', '$1.180.000', 'bg-emerald-400'], ['Citas hoy', '11', 'bg-orange-400']],
  },
  {
    id: 'ropa', type: 'ROPA', emoji: '👗', name: 'Tienda de ropa', biz: 'Moda Urbana',
    accent: 'Variantes por talla y color, con multi-sede.',
    catalog: 'Inventario',
    items: [['Camiseta oversize · M', '$49.900'], ['Jean slim · 32', '$89.900'], ['Chaqueta · L', '$139.900']],
    kpis: [['Ventas de hoy', '$980.000', 'bg-emerald-400'], ['Referencias', '860', 'bg-orange-400']],
  },
  {
    id: 'supermercado', type: 'SUPERMERCADO', emoji: '🛒', name: 'Minimercado', biz: 'La Esquina',
    accent: 'Venta rápida, proveedores y control de stock.',
    catalog: 'Inventario',
    items: [['Arroz 500g', '$2.400'], ['Leche entera 1L', '$4.300'], ['Huevos x30', '$16.500']],
    kpis: [['Ventas de hoy', '$3.420.000', 'bg-emerald-400'], ['Productos', '2.100', 'bg-orange-400']],
  },
  {
    id: 'lavado', type: 'LAVADO_VEHICULOS', emoji: '🚗', name: 'Lavado de vehículos', biz: 'Aqua Wash',
    accent: 'Turnos por lavador, comisiones y fidelización (el lavado #10 gratis).',
    catalog: 'Lavados',
    items: [['Lavado básico', '$15.000'], ['Lavado + encerado', '$28.000'], ['Polichado completo', '$120.000']],
    kpis: [['Ventas de hoy', '$540.000', 'bg-emerald-400'], ['Turnos hoy', '18', 'bg-orange-400']],
  },
  {
    id: 'canchas', type: 'CANCHAS_SINTETICAS', emoji: '⚽', name: 'Canchas sintéticas', biz: 'Gol Center',
    accent: 'Cada cancha se reserva por hora, con venta de bebidas e implementos.',
    catalog: 'Alquiler de cancha',
    items: [['Cancha 1 · hora', '$90.000'], ['Cancha 2 · hora', '$90.000'], ['Alquiler de peto', '$3.000']],
    kpis: [['Ventas de hoy', '$1.080.000', 'bg-emerald-400'], ['Reservas hoy', '12', 'bg-orange-400']],
  },
  {
    id: 'guardacascos', type: 'GUARDA_CASCOS', emoji: '🪖', name: 'Guarda cascos', biz: 'Casco Seguro',
    accent: 'Guardado por uso o mensualidad, con venta de candados y forros.',
    catalog: 'Guardados',
    items: [['Guardado por día', '$2.000'], ['Mensualidad', '$25.000'], ['Candado', '$18.000']],
    kpis: [['Ventas de hoy', '$180.000', 'bg-emerald-400'], ['Usuarios activos', '64', 'bg-orange-400']],
  },
];

export default function VerticalShowcase() {
  const [active, setActive] = useState(VERTICALS[0].id);
  const v = VERTICALS.find((x) => x.id === active) || VERTICALS[0];

  return (
    <div>
      {/* Selector de vertical */}
      <div className="flex flex-wrap justify-center gap-2">
        {VERTICALS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setActive(x.id)}
            aria-pressed={x.id === active}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              x.id === active
                ? 'border-orange-400 bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-orange-300'
            }`}
          >
            <span aria-hidden>{x.emoji}</span> {x.name}
          </button>
        ))}
      </div>

      {/* Ventana de la app (marco) */}
      <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        {/* barra superior del navegador */}
        <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-100 px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="mx-auto flex items-center gap-1 rounded-md bg-white px-3 py-0.5 text-[11px] text-neutral-400 ring-1 ring-neutral-200">
            🔒 app.pegazo.co
          </span>
        </div>

        {/* cuerpo: sidebar oscuro + contenido claro (como el CRM real) */}
        <div className="grid grid-cols-[132px_1fr] sm:grid-cols-[188px_1fr]">
          {/* SIDEBAR */}
          <aside className="bg-gradient-to-b from-[#0b0f19] to-[#05070d] p-3 border-r border-orange-500/10">
            <div className="mb-4 flex items-center gap-2 px-1">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 text-sm font-black text-white shadow">
                P
              </span>
              <span className="truncate text-sm font-bold text-white">
                Pegazo
              </span>
            </div>
            {(() => {
              const mods = realModules(v.type);
              return (
                <>
                  <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-white/35">
                    Tu menú · {mods.length} módulos
                  </p>
                  <ul className="max-h-[264px] space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(249,115,22,.5)_transparent]">
                    {mods.map((key, i) => {
                      const meta = MODULE_META[key] || [key, HomeIcon];
                      const label = meta[0];
                      const Icon = meta[1];
                      const activeItem = i === 0;
                      return (
                        <li
                          key={key}
                          className={`relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition ${
                            activeItem
                              ? 'bg-gradient-to-r from-orange-500/25 to-amber-500/10 text-white shadow-inner'
                              : 'text-white/55'
                          }`}
                        >
                          {activeItem && (
                            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-orange-400" />
                          )}
                          <Icon
                            className={`h-4 w-4 flex-none ${
                              activeItem ? 'text-orange-400' : 'text-white/45'
                            }`}
                          />
                          <span className="truncate">{label}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 px-1 text-[9.5px] text-white/25">
                    Desliza para ver todo tu CRM ↓
                  </p>
                </>
              );
            })()}
          </aside>

          {/* CONTENIDO (bg-gray-50 como el panel real) */}
          <div className="bg-gray-50 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">
                  Hola 👋 · {v.biz}
                </p>
                <p className="text-[11px] text-gray-500">
                  Este es tu panel · {v.name}
                </p>
              </div>
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-600">
                {v.name}
              </span>
            </div>

            {/* KPIs (tarjetas reales) */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {v.kpis.map(([label, val, dot]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} />
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      {label}
                    </p>
                  </div>
                  <p className="mt-1.5 text-lg font-bold text-gray-900">{val}</p>
                </div>
              ))}
            </div>

            {/* Catálogo adaptado (tarjeta real) */}
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-800">{v.catalog}</p>
                <span className="text-[10px] font-medium text-orange-600">
                  Ver todo
                </span>
              </div>
              <ul className="divide-y divide-gray-100">
                {v.items.map(([name, price]) => (
                  <li
                    key={name}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="truncate text-gray-700">{name}</span>
                    <span className="font-semibold text-gray-900">{price}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-3 text-[11px] text-gray-400">
              {v.accent}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
