'use client';

import { useState } from 'react';

// Demostración interactiva: el visitante elige un tipo de negocio y ve cómo el
// panel de Pegazo se adapta (menú, vocabulario y catálogo). Datos ilustrativos,
// alineados con la configuración real por vertical.
const VERTICALS = [
  {
    id: 'barberia', emoji: '💈', name: 'Barbería',
    accent: 'Se agenda por barbero, con comisiones y fidelización.',
    menu: ['Inicio', 'Citas', 'Servicios', 'Clientes', 'Caja', 'Fidelización', 'Estadísticas'],
    catalog: 'Servicios',
    items: [['Corte clásico', '$18.000'], ['Corte + barba', '$28.000'], ['Perfilado de cejas', '$8.000']],
    kpis: [['Citas hoy', '14'], ['Cortes del mes', '312']],
    person: 'Clientes',
  },
  {
    id: 'restaurante', emoji: '🍽️', name: 'Restaurante',
    accent: 'Mesas, comandas y pantalla de cocina (KDS).',
    menu: ['Inicio', 'Mesas', 'Cocina', 'Menú', 'Ventas', 'Caja', 'Insumos'],
    catalog: 'Menú',
    items: [['Bandeja paisa', '$26.000'], ['Limonada de coco', '$9.000'], ['Postre del día', '$7.000']],
    kpis: [['Mesas activas', '6'], ['Órdenes hoy', '48']],
    person: 'Clientes',
  },
  {
    id: 'ferreteria', emoji: '🔧', name: 'Ferretería',
    accent: 'Inventario, compras, cartera y fiado a la mano.',
    menu: ['Inicio', 'Inventario', 'Compras', 'Ventas', 'Clientes', 'Cartera', 'Caja'],
    catalog: 'Inventario',
    items: [['Tornillo 1/4" (100u)', '$12.000'], ['Pintura vinilo 1gl', '$62.000'], ['Cinta aislante', '$4.500']],
    kpis: [['Productos', '1.240'], ['Por cobrar', '$1.8M']],
    person: 'Clientes',
  },
  {
    id: 'veterinaria', emoji: '🐾', name: 'Veterinaria',
    accent: 'Citas por especialista y ficha de cada mascota.',
    menu: ['Inicio', 'Citas', 'Servicios', 'Pacientes', 'Inventario', 'Caja'],
    catalog: 'Servicios',
    items: [['Consulta general', '$45.000'], ['Vacuna múltiple', '$55.000'], ['Baño y peluquería', '$35.000']],
    kpis: [['Citas hoy', '9'], ['Pacientes', '540']],
    person: 'Pacientes',
  },
  {
    id: 'ropa', emoji: '👗', name: 'Tienda de ropa',
    accent: 'Variantes por talla y color, con multi-sede.',
    menu: ['Inicio', 'Inventario', 'Ventas', 'Clientes', 'Compras', 'Caja', 'Estadísticas'],
    catalog: 'Inventario',
    items: [['Camiseta oversize · M', '$49.900'], ['Jean slim · 32', '$89.900'], ['Chaqueta · L', '$139.900']],
    kpis: [['Referencias', '860'], ['Ventas del mes', '$14M']],
    person: 'Clientes',
  },
  {
    id: 'supermercado', emoji: '🛒', name: 'Minimercado',
    accent: 'Venta rápida, proveedores y control de stock.',
    menu: ['Inicio', 'Inventario', 'Compras', 'Ventas', 'Proveedores', 'Caja', 'Gastos'],
    catalog: 'Inventario',
    items: [['Arroz 500g', '$2.400'], ['Leche entera 1L', '$4.300'], ['Huevos x30', '$16.500']],
    kpis: [['Productos', '2.100'], ['Ventas hoy', '$980k']],
    person: 'Clientes',
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

      {/* Panel simulado */}
      <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl">
        {/* barra superior */}
        <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-400/70" />
          <span className="h-3 w-3 rounded-full bg-amber-400/70" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
          <span className="ml-3 truncate text-xs text-neutral-400">
            pegazo.co · {v.name}
          </span>
        </div>

        <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[180px_1fr]">
          {/* menú lateral */}
          <aside className="border-r border-neutral-800 p-3">
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className="text-lg" aria-hidden>{v.emoji}</span>
              <span className="truncate text-sm font-bold text-white">{v.name}</span>
            </div>
            <ul className="space-y-1">
              {v.menu.map((m, i) => (
                <li
                  key={m}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${
                    i === 0 ? 'bg-orange-500/15 text-orange-300' : 'text-neutral-400'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-orange-400' : 'bg-neutral-600'}`}
                  />
                  {m}
                </li>
              ))}
            </ul>
          </aside>

          {/* contenido */}
          <div className="p-4 sm:p-6">
            <p className="text-xs font-medium text-orange-400">{v.accent}</p>
            {/* KPIs */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {v.kpis.map(([label, val]) => (
                <div key={label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
                  <p className="text-[11px] text-neutral-500">{label}</p>
                  <p className="text-lg font-bold text-white">{val}</p>
                </div>
              ))}
            </div>
            {/* catálogo adaptado */}
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              {v.catalog}
            </p>
            <ul className="mt-2 divide-y divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800">
              {v.items.map(([name, price]) => (
                <li key={name} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="truncate text-neutral-300">{name}</span>
                  <span className="font-semibold text-white">{price}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-neutral-500">
              Y tus <span className="text-neutral-300">{v.person.toLowerCase()}</span>, caja,
              reportes y más — todo con el nombre y las funciones de tu negocio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
