'use client';

import { useEffect, useMemo, useState } from 'react';
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
  ReceiptPercentIcon,
  ArrowUturnLeftIcon,
  WrenchScrewdriverIcon,
  IdentificationIcon,
  BuildingOffice2Icon,
  Bars3Icon,
  XMarkIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { BUSINESS_TYPES } from '@/config/businessTypes';

function apiBase() {
  let url = process.env.NEXT_PUBLIC_API_URL || '';
  if (!url || url.includes('localhost')) {
    url = 'https://admineuropeatvstoreback-production.up.railway.app';
  }
  return url.replace(/\/$/, '');
}

// Etiqueta + ícono REAL de cada módulo del CRM (para mostrar el menú tal cual
// lo verá el dueño). La clave es la del módulo.
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
  parking: ['Parqueadero', TruckIcon],
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

// Módulos reales a mostrar en el menú. Preferimos los que trae el backend por
// tipo; si no llegan, caemos a la lista curada del CRM (businessTypes.js).
function menuModules(type, modules) {
  const base =
    Array.isArray(modules) && modules.length
      ? modules
      : BUSINESS_TYPES[type] || [];
  const all = ['dashboard', ...base, 'settings'];
  // Únicos, en orden, y solo los que sabemos pintar.
  return all.filter((k, i) => MODULE_META[k] && all.indexOf(k) === i);
}

const TYPE_EMOJI = {
  SERVICIOS: '💈', VETERINARIA: '🐾', ODONTOLOGIA: '🦷', GIMNASIO: '🏋️',
  LAVADO_VEHICULOS: '🚗', LAVANDERIA: '🧺', TALLER_MECANICO: '🔩',
  CANCHAS_SINTETICAS: '⚽', GUARDA_CASCOS: '🪖', PARQUEADERO: '🅿️', RESTAURANTE: '🍽️',
  COMIDA_RAPIDA: '🍔', CAFETERIA: '☕', PIZZERIA: '🍕', BAR: '🍻',
  PANADERIA: '🥐', CARNICERIA: '🥩', PESCADERIA: '🐟', FRUVER: '🥦',
  SUPERMERCADO: '🛒', DROGUERIA: '💊', LICORERA: '🍷', ROPA: '👗', PANALERIA: '🍼',
  CALZADO: '👟', FERRETERIA: '🔧', FLORISTERIA: '🌸', PAPELERIA: '📎',
  PETSHOP: '🐶', TECNOLOGIA: '💻', TELEVENTAS: '📞', ECOMMERCE: '📦',
  COMERCIO: '🏪', DISTRIBUCION: '🚚', FERIA: '🎪',
};

// Ejemplos ilustrativos por tipo (nombre de negocio + catálogo + ítems + KPIs).
// Si entra un tipo NUEVO sin preset, se genera uno coherente por su modo.
const E = 'bg-emerald-400';
const O = 'bg-orange-400';
const PRESETS = {
  SERVICIOS: { biz: 'RAGNOR Barber', catalog: 'Servicios', accent: 'Se agenda por profesional, con comisiones y fidelización.', items: [['Corte clásico', '$18.000'], ['Corte + barba', '$28.000'], ['Perfilado de cejas', '$8.000']], kpis: [['Ventas de hoy', '$486.000', E], ['Citas hoy', '14', O]] },
  VETERINARIA: { biz: 'Huellitas', catalog: 'Servicios', accent: 'Citas por especialista y ficha de cada mascota.', items: [['Consulta general', '$45.000'], ['Vacuna múltiple', '$55.000'], ['Baño y peluquería', '$35.000']], kpis: [['Ventas de hoy', '$620.000', E], ['Citas hoy', '9', O]] },
  ODONTOLOGIA: { biz: 'Clínica Sonríe', catalog: 'Tratamientos', accent: 'Historia clínica por paciente, odontograma y consentimientos.', items: [['Consulta + diagnóstico', '$60.000'], ['Limpieza dental', '$90.000'], ['Resina (por diente)', '$130.000']], kpis: [['Ventas de hoy', '$1.180.000', E], ['Citas hoy', '11', O]] },
  GIMNASIO: { biz: 'PowerFit', catalog: 'Planes', accent: 'Membresías, reservas de clases y control de acceso.', items: [['Mensualidad', '$80.000'], ['Clase personalizada', '$35.000'], ['Pase por día', '$12.000']], kpis: [['Ventas de hoy', '$740.000', E], ['Reservas hoy', '22', O]] },
  LAVADO_VEHICULOS: { biz: 'Aqua Wash', catalog: 'Lavados', accent: 'Turnos por lavador, comisiones y fidelización.', items: [['Lavado básico', '$15.000'], ['Lavado + encerado', '$28.000'], ['Polichado completo', '$120.000']], kpis: [['Ventas de hoy', '$540.000', E], ['Turnos hoy', '18', O]] },
  LAVANDERIA: { biz: 'Burbujas', catalog: 'Servicios', accent: 'Órdenes por cliente, estados y avisos por WhatsApp.', items: [['Lavado x kilo', '$6.000'], ['Lavado en seco', '$18.000'], ['Planchado (prenda)', '$2.500']], kpis: [['Ventas de hoy', '$380.000', E], ['Órdenes hoy', '27', O]] },
  TALLER_MECANICO: { biz: 'MotorPro', catalog: 'Servicios', accent: 'Órdenes de trabajo por vehículo, repuestos y mano de obra.', items: [['Cambio de aceite', '$90.000'], ['Alineación y balanceo', '$70.000'], ['Revisión general', '$120.000']], kpis: [['Ventas de hoy', '$1.350.000', E], ['Órdenes hoy', '7', O]] },
  CANCHAS_SINTETICAS: { biz: 'Gol Center', catalog: 'Alquiler de cancha', accent: 'Cada cancha se reserva por hora, con venta de bebidas.', items: [['Cancha 1 · hora', '$90.000'], ['Cancha 2 · hora', '$90.000'], ['Alquiler de peto', '$3.000']], kpis: [['Ventas de hoy', '$1.080.000', E], ['Reservas hoy', '12', O]] },
  GUARDA_CASCOS: { biz: 'Casco Seguro', catalog: 'Guardados', accent: 'Guardado por uso o mensualidad, con venta de accesorios.', items: [['Guardado por día', '$2.000'], ['Mensualidad', '$25.000'], ['Candado', '$18.000']], kpis: [['Ventas de hoy', '$180.000', E], ['Usuarios activos', '64', O]] },
  PARQUEADERO: { biz: 'Parking Center', catalog: 'Tarifas', accent: 'Ingreso/salida con ticket, cobro por tiempo y factura. Mensualidades.', items: [['Carro · hora', '$4.000'], ['Moto · hora', '$2.000'], ['Mensualidad carro', '$120.000']], kpis: [['Ventas de hoy', '$680.000', E], ['Vehículos dentro', '23', O]] },
  RESTAURANTE: { biz: 'La Parrilla', catalog: 'Menú', accent: 'Mesas, comandas y pantalla de cocina (KDS).', items: [['Bandeja paisa', '$26.000'], ['Limonada de coco', '$9.000'], ['Postre del día', '$7.000']], kpis: [['Ventas de hoy', '$1.240.000', E], ['Mesas activas', '6', O]] },
  COMIDA_RAPIDA: { biz: 'Burger Town', catalog: 'Menú', accent: 'Pedidos rápidos, domicilios y pantalla de cocina.', items: [['Hamburguesa clásica', '$16.000'], ['Perro especial', '$12.000'], ['Papas + gaseosa', '$8.000']], kpis: [['Ventas de hoy', '$820.000', E], ['Pedidos hoy', '54', O]] },
  CAFETERIA: { biz: 'Café Aroma', catalog: 'Menú', accent: 'Carta por categorías, mesas y venta rápida.', items: [['Capuchino', '$6.500'], ['Croissant', '$5.000'], ['Sándwich', '$12.000']], kpis: [['Ventas de hoy', '$430.000', E], ['Mesas activas', '5', O]] },
  PIZZERIA: { biz: 'Napoli', catalog: 'Menú', accent: 'Menú, domicilios y cocina en pantalla.', items: [['Pizza margarita', '$32.000'], ['Pizza pepperoni', '$38.000'], ['Gaseosa 1.5L', '$7.000']], kpis: [['Ventas de hoy', '$960.000', E], ['Pedidos hoy', '31', O]] },
  BAR: { biz: 'La Terraza', catalog: 'Carta', accent: 'Mesas, comandas y cierre de caja por turno.', items: [['Cerveza nacional', '$6.000'], ['Cóctel de la casa', '$22.000'], ['Picada x2', '$38.000']], kpis: [['Ventas de hoy', '$1.560.000', E], ['Mesas activas', '9', O]] },
  PANADERIA: { biz: 'El Trigal', catalog: 'Inventario', accent: 'Venta rápida, producción e inventario.', items: [['Pan francés (u)', '$600'], ['Torta por porción', '$4.500'], ['Pan de bono (u)', '$1.500']], kpis: [['Ventas de hoy', '$680.000', E], ['Productos', '180', O]] },
  CARNICERIA: { biz: 'El Novillo', catalog: 'Inventario', accent: 'Venta por peso, proveedores y control de stock.', items: [['Lomo fino (kg)', '$32.000'], ['Pechuga (kg)', '$14.000'], ['Costilla (kg)', '$18.000']], kpis: [['Ventas de hoy', '$1.420.000', E], ['Productos', '90', O]] },
  PESCADERIA: { biz: 'Mar Azul', catalog: 'Inventario', accent: 'Venta por peso, cadena de frío e inventario.', items: [['Filete de tilapia (kg)', '$24.000'], ['Camarón (kg)', '$46.000'], ['Salmón (kg)', '$58.000']], kpis: [['Ventas de hoy', '$990.000', E], ['Productos', '60', O]] },
  FRUVER: { biz: 'La Huerta', catalog: 'Inventario', accent: 'Venta por peso, mermas y rotación.', items: [['Tomate (kg)', '$3.500'], ['Banano (kg)', '$2.800'], ['Aguacate (u)', '$2.500']], kpis: [['Ventas de hoy', '$760.000', E], ['Productos', '210', O]] },
  SUPERMERCADO: { biz: 'La Esquina', catalog: 'Inventario', accent: 'Venta rápida, proveedores y control de stock.', items: [['Arroz 500g', '$2.400'], ['Leche entera 1L', '$4.300'], ['Huevos x30', '$16.500']], kpis: [['Ventas de hoy', '$3.420.000', E], ['Productos', '2.100', O]] },
  DROGUERIA: { biz: 'Salud Total', catalog: 'Inventario', accent: 'Inventario, vencimientos y venta por unidad.', items: [['Acetaminofén x20', '$6.500'], ['Alcohol 700ml', '$5.000'], ['Vitamina C x30', '$18.000']], kpis: [['Ventas de hoy', '$1.120.000', E], ['Productos', '1.400', O]] },
  LICORERA: { biz: 'El Barril', catalog: 'Inventario', accent: 'Inventario, proveedores y venta rápida.', items: [['Aguardiente 750ml', '$42.000'], ['Ron 750ml', '$58.000'], ['Cerveza six-pack', '$18.000']], kpis: [['Ventas de hoy', '$2.260.000', E], ['Productos', '320', O]] },
  ROPA: { biz: 'Moda Urbana', catalog: 'Inventario', accent: 'Variantes por talla y color, con multi-sede.', items: [['Camiseta oversize · M', '$49.900'], ['Jean slim · 32', '$89.900'], ['Chaqueta · L', '$139.900']], kpis: [['Ventas de hoy', '$980.000', E], ['Referencias', '860', O]] },
  CALZADO: { biz: 'Pasos', catalog: 'Inventario', accent: 'Inventario por talla y color, con cambios y devoluciones.', items: [['Tenis running · 40', '$189.900'], ['Botín cuero · 38', '$249.900'], ['Sandalia dama · 37', '$79.900']], kpis: [['Ventas de hoy', '$1.120.000', E], ['Pares en stock', '540', O]] },
  PANALERIA: { biz: 'Mundo Bebé', catalog: 'Inventario', accent: 'Variantes por talla/etapa, marcas, fidelización y devoluciones.', items: [['Pañales etapa 3 x40', '$38.000'], ['Fórmula infantil 400g', '$42.000'], ['Body manga larga · 6m', '$24.900']], kpis: [['Ventas de hoy', '$1.240.000', E], ['Productos', '1.200', O]] },
  FERRETERIA: { biz: 'El Tornillo', catalog: 'Inventario', accent: 'Inventario, compras, cartera y fiado a la mano.', items: [['Tornillo 1/4" (100u)', '$12.000'], ['Pintura vinilo 1gl', '$62.000'], ['Cinta aislante', '$4.500']], kpis: [['Ventas de hoy', '$2.150.000', E], ['Por cobrar', '$1.8M', O]] },
  FLORISTERIA: { biz: 'Pétalos', catalog: 'Inventario', accent: 'Pedidos, domicilios y fechas especiales.', items: [['Ramo de rosas x12', '$55.000'], ['Girasoles x6', '$38.000'], ['Arreglo especial', '$90.000']], kpis: [['Ventas de hoy', '$520.000', E], ['Pedidos hoy', '14', O]] },
  PAPELERIA: { biz: 'El Lápiz', catalog: 'Inventario', accent: 'Venta rápida, inventario y servicios de impresión.', items: [['Resma carta', '$14.000'], ['Cuaderno 100h', '$4.500'], ['Impresión (hoja)', '$300']], kpis: [['Ventas de hoy', '$340.000', E], ['Productos', '900', O]] },
  PETSHOP: { biz: 'Mundo Mascota', catalog: 'Inventario', accent: 'Inventario, marcas y fidelización.', items: [['Concentrado 10kg', '$78.000'], ['Arena sanitaria', '$22.000'], ['Juguete mordedor', '$15.000']], kpis: [['Ventas de hoy', '$640.000', E], ['Productos', '480', O]] },
  TECNOLOGIA: { biz: 'TechStore', catalog: 'Inventario', accent: 'Inventario con series, garantías y variantes.', items: [['Audífonos BT', '$89.000'], ['Cargador USB-C', '$35.000'], ['Mouse inalámbrico', '$45.000']], kpis: [['Ventas de hoy', '$1.780.000', E], ['Referencias', '620', O]] },
  TELEVENTAS: { biz: 'EuropeaTV', catalog: 'Inventario', accent: 'Ventas por teléfono/online, despacho y cartera.', items: [['Smart TV 50"', '$1.450.000'], ['Parlante bafle', '$320.000'], ['Soporte TV', '$55.000']], kpis: [['Ventas de hoy', '$5.200.000', E], ['Pedidos hoy', '23', O]] },
  ECOMMERCE: { biz: 'ShopNow', catalog: 'Inventario', accent: 'Tienda online, pedidos y despachos integrados.', items: [['Producto estrella', '$79.000'], ['Combo del mes', '$120.000'], ['Accesorio', '$29.000']], kpis: [['Ventas de hoy', '$2.980.000', E], ['Pedidos hoy', '61', O]] },
  COMERCIO: { biz: 'Tienda La 15', catalog: 'Inventario', accent: 'Inventario, ventas, cartera y proveedores.', items: [['Producto A', '$12.000'], ['Producto B', '$25.000'], ['Producto C', '$8.000']], kpis: [['Ventas de hoy', '$1.240.000', E], ['Productos', '740', O]] },
  DISTRIBUCION: { biz: 'Distrimax', catalog: 'Inventario', accent: 'Ventas al por mayor, rutas, cartera y despachos.', items: [['Caja x24', '$96.000'], ['Pallet (unidad)', '$1.200.000'], ['Producto mayorista', '$18.000']], kpis: [['Ventas de hoy', '$8.600.000', E], ['Clientes', '320', O]] },
  FERIA: { biz: 'Puesto 12', catalog: 'Inventario', accent: 'Venta rápida con caja y reportes diarios.', items: [['Artesanía', '$25.000'], ['Snack', '$5.000'], ['Souvenir', '$12.000']], kpis: [['Ventas de hoy', '$280.000', E], ['Productos', '60', O]] },
};

// Genera un preset coherente para un tipo NUEVO sin ejemplo curado.
function genPreset(label, mode) {
  if (mode === 'booking') {
    return {
      biz: label, catalog: 'Servicios',
      accent: 'Agenda por profesional, con comisiones y fidelización.',
      items: [['Servicio 1', '$30.000'], ['Servicio 2', '$45.000'], ['Servicio 3', '$20.000']],
      kpis: [['Ventas de hoy', '$620.000', E], ['Citas hoy', '9', O]],
    };
  }
  if (mode === 'menu') {
    return {
      biz: label, catalog: 'Menú',
      accent: 'Carta por categorías, mesas y pantalla de cocina.',
      items: [['Plato del día', '$22.000'], ['Bebida', '$8.000'], ['Postre', '$7.000']],
      kpis: [['Ventas de hoy', '$1.240.000', E], ['Mesas activas', '6', O]],
    };
  }
  return {
    biz: label, catalog: 'Inventario',
    accent: 'Inventario, ventas, cartera y proveedores.',
    items: [['Producto 1', '$25.000'], ['Producto 2', '$48.000'], ['Producto 3', '$12.000']],
    kpis: [['Ventas de hoy', '$980.000', E], ['Productos', '860', O]],
  };
}

// Serie de 7 días (en miles de $) con una forma agradable + variación estable
// por tipo. No son datos reales: es el mockup del Inicio.
function weekData(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const base = [30, 300, 345, 300, 465, 185, 45];
  return base.map((b) => {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const jitter = (h % 110) - 55;
    return Math.max(10, Math.min(580, b + jitter));
  });
}

// Path suave (spline tipo Catmull-Rom → Bézier) a partir de puntos [x,y].
function smoothPath(pts) {
  if (pts.length < 2) return '';
  const d = [`M${pts[0][0]},${pts[0][1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(
      `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`,
    );
  }
  return d.join(' ');
}

// Fechas dd/MM de los últimos 7 días (termina hoy).
function last7Dates() {
  const out = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
    );
  }
  return out;
}

// Gráfica de "Ventas" igual a la del Inicio (curva suave, ejes con valores,
// fechas y línea azul marino con relleno sutil).
function MiniTrend({ seed }) {
  const data = weekData(seed);
  const dates = last7Dates();
  const total = data.reduce((a, b) => a + b, 0) * 1000;
  const fmtTotal =
    total >= 1_000_000
      ? `$${(total / 1_000_000).toFixed(1)}M`
      : `$${Math.round(total / 1000)}k`;

  const W = 328;
  const H = 116;
  const padL = 34;
  const padR = 8;
  const padT = 8;
  const padB = 18;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const ticks = [0, 150, 300, 450, 600];
  const maxV = 600;
  const x = (i) => padL + (i * plotW) / (data.length - 1);
  const y = (v) => padT + (1 - v / maxV) * plotH;
  const pts = data.map((v, i) => [x(i), y(v)]);
  const line = smoothPath(pts);
  const area = `${line} L${x(data.length - 1).toFixed(1)},${padT + plotH} L${x(0).toFixed(1)},${padT + plotH} Z`;

  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="text-gray-300">‹</span>
          <div>
            <p className="text-sm font-bold text-gray-700">Ventas</p>
            <p className="text-[11px] text-gray-400">
              {dates[0]} – {dates[6]} ·{' '}
              <span className="font-semibold text-gray-600">{fmtTotal}</span>
            </p>
          </div>
          <span className="text-gray-300">›</span>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
          {['Semana', 'Mes', 'Año'].map((p, i) => (
            <span
              key={p}
              className={`rounded-md px-2.5 py-0.5 text-[10px] font-medium ${
                i === 0 ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-400'
              }`}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Tendencia de ventas"
      >
        <defs>
          <linearGradient id="demoTrend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Rejilla + eje Y */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(t)}
              y2={y(t)}
              stroke="#f1f5f9"
              strokeWidth="1"
            />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill="#9ca3af">
              {t === 0 ? '$0' : `$${t}k`}
            </text>
          </g>
        ))}
        {/* Área + línea */}
        <path d={area} fill="url(#demoTrend)" />
        <path
          d={line}
          fill="none"
          stroke="#334155"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={pts[pts.length - 1][0]}
          cy={pts[pts.length - 1][1]}
          r="3.5"
          fill="#334155"
        />
        {/* Eje X (fechas) */}
        {dates.map((d, i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 5}
            textAnchor="middle"
            fontSize="8.5"
            fill="#9ca3af"
          >
            {d}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function VerticalShowcase() {
  const [types, setTypes] = useState([]);
  const [active, setActive] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/public/business-types`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (!cancel) setTypes(json?.data || []);
      } catch {
        if (!cancel) setTypes([]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // Construye las verticales a partir de los tipos del backend + presets.
  const verticals = useMemo(() => {
    return (types || []).map((t) => {
      const preset = PRESETS[t.type] || genPreset(t.label, t.mode);
      return {
        type: t.type,
        name: t.label,
        emoji: TYPE_EMOJI[t.type] || (t.mode === 'menu' ? '🍽️' : t.mode === 'booking' ? '📅' : '🛍️'),
        mods: menuModules(t.type, t.modules),
        ...preset,
      };
    });
  }, [types]);

  useEffect(() => {
    if (verticals.length && !verticals.some((x) => x.type === active)) {
      setActive(verticals[0].type);
    }
  }, [verticals, active]);

  const v = verticals.find((x) => x.type === active) || verticals[0];

  if (!v) {
    return (
      <p className="mt-8 text-center text-sm text-neutral-400">
        Cargando negocios…
      </p>
    );
  }
  const mods = v.mods;

  const panelBody = (
    <>
      <div className="grid grid-cols-2 gap-3">
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

      {/* Gráfica de ventas (igual a la del Inicio del CRM) */}
      <MiniTrend seed={v.type} />

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

      <p className="mt-3 text-[11px] text-gray-400">{v.accent}</p>
    </>
  );

  return (
    <div>
      {/* Selector de vertical (TODOS los tipos, dinámico desde el backend) */}
      <div className="flex flex-wrap justify-center gap-2">
        {verticals.map((x) => (
          <button
            key={x.type}
            type="button"
            onClick={() => setActive(x.type)}
            aria-pressed={x.type === active}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              x.type === active
                ? 'border-orange-400 bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-orange-300'
            }`}
          >
            <span aria-hidden>{x.emoji}</span> {x.name}
          </button>
        ))}
      </div>

      {/* ESCRITORIO */}
      <div className="mx-auto mt-8 hidden max-w-4xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl sm:block">
        <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-100 px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="mx-auto flex items-center gap-1 rounded-md bg-white px-3 py-0.5 text-[11px] text-neutral-400 ring-1 ring-neutral-200">
            🔒 app.pegazo.co
          </span>
        </div>

        <div className="grid grid-cols-[188px_1fr]">
          <aside className="border-r border-orange-500/10 bg-gradient-to-b from-[#0b0f19] to-[#05070d] p-3">
            <div className="mb-4 flex items-center gap-2 px-1">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 text-sm font-black text-white shadow">
                P
              </span>
              <span className="truncate text-sm font-bold text-white">
                Pegazo
              </span>
            </div>
            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-white/35">
              Tu menú · {mods.length} módulos
            </p>
            <ul className="max-h-[264px] space-y-1 overflow-y-auto pr-1 [scrollbar-color:rgba(249,115,22,.5)_transparent] [scrollbar-width:thin]">
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
          </aside>

          <div className="bg-gray-50 p-6">
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
            <div className="mt-4">{panelBody}</div>
          </div>
        </div>
      </div>

      {/* MÓVIL */}
      <div className="mx-auto mt-8 w-full max-w-[330px] sm:hidden">
        <div className="rounded-[2.2rem] border-4 border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl">
          <div className="relative h-[560px] overflow-hidden rounded-[1.8rem] bg-gray-50">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="absolute left-3 top-3 z-20 rounded-xl border border-orange-500/20 bg-[#0B0F19]/90 p-2 shadow-lg backdrop-blur"
            >
              <Bars3Icon className="h-5 w-5 text-orange-400" />
            </button>

            <div className="h-full overflow-y-auto px-3 pb-5 pt-14">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">
                    Hola 👋 · {v.biz}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Este es tu Inicio · {v.name}
                  </p>
                </div>
                <span className="flex-none rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-600">
                  {v.name}
                </span>
              </div>
              {panelBody}
            </div>

            {menuOpen && (
              <div
                onClick={() => setMenuOpen(false)}
                className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm"
              />
            )}

            <aside
              className={`absolute inset-y-0 left-0 z-40 flex w-[82%] max-w-[268px] flex-col border-r border-orange-500/10 bg-gradient-to-b from-[#0b0f19] to-[#05070d] text-white shadow-2xl transition-transform duration-300 ${
                menuOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="flex min-h-[60px] items-center gap-3 border-b border-orange-500/10 px-3 py-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-sm font-black text-white shadow">
                  P
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[13px] font-semibold">
                    {v.biz}
                  </span>
                  <span className="text-[10px] text-orange-400/60">Workspace</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-2 py-3 [scrollbar-color:rgba(249,115,22,.5)_transparent] [scrollbar-width:thin]">
                <ul className="space-y-1">
                  {mods.map((key, i) => {
                    const meta = MODULE_META[key] || [key, HomeIcon];
                    const label = meta[0];
                    const Icon = meta[1];
                    const activeItem = i === 0;
                    return (
                      <li
                        key={key}
                        className={`relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition ${
                          activeItem
                            ? 'bg-gradient-to-r from-orange-500/25 to-amber-500/10 text-white shadow-inner'
                            : 'text-white/60'
                        }`}
                      >
                        {activeItem && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-orange-400" />
                        )}
                        <Icon
                          className={`h-5 w-5 flex-none ${
                            activeItem ? 'text-orange-400' : 'text-white/45'
                          }`}
                        />
                        <span className="truncate">{label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="border-t border-white/10 px-2 py-3">
                <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-gray-300">
                  <MoonIcon className="h-5 w-5 flex-none text-orange-300" />
                  <span className="text-[13px] font-medium">Modo oscuro</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-neutral-400">
          Así se ve en tu celular · toca ☰ para abrir tu menú
        </p>
      </div>
    </div>
  );
}
