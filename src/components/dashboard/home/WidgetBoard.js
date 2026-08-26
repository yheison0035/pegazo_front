'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { WIDGETS, DEFAULT_LAYOUT, WIDGET_AUDIENCE } from './widgets';

const REGISTRY = Object.fromEntries(WIDGETS.map((w) => [w.id, w]));
// Clave de layout distinta por audiencia (barbero vs dueño) para que no se
// mezclen si un usuario cambia de rol.
const KEY = (uid, aud) => `pegazo_home_layout_v3_${aud}_${uid || 'anon'}`;

// ¿El widget corresponde a la audiencia del usuario?
function audienceOk(id, isBarber) {
  const a = WIDGET_AUDIENCE[id] || 'all';
  if (a === 'all') return true;
  return a === 'barber' ? !!isBarber : !isBarber;
}

// Ícono de agarre (para la "mano" de mover).
function GripIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <circle cx="7" cy="5" r="1.6" />
      <circle cx="13" cy="5" r="1.6" />
      <circle cx="7" cy="10" r="1.6" />
      <circle cx="13" cy="10" r="1.6" />
      <circle cx="7" cy="15" r="1.6" />
      <circle cx="13" cy="15" r="1.6" />
    </svg>
  );
}

function SortableWidget({ id, wide, editing, onRemove, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-widget-id={id}
      className={`group relative ${wide ? 'md:col-span-2' : ''}`}
    >
      {/* Controles: pill flotante por ENCIMA del borde para no tapar el
          contenido del widget (títulos, "Ver detalle", etc.). Aparece al hacer
          hover (escritorio) o en modo Organizar (móvil). */}
      {!isDragging && (
        <div
          className={`absolute -top-3 right-3 z-30 flex items-center overflow-hidden rounded-full bg-white shadow-md ring-1 ring-gray-200 transition ${
            editing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {/* Mano para mover (arrastra desde aquí) */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="Mover"
            className="cursor-grab touch-none px-2 py-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 active:cursor-grabbing"
          >
            <GripIcon className="h-4 w-4" />
          </button>
          <span className="h-4 w-px bg-gray-200" />
          {/* Quitar */}
          <button
            type="button"
            onClick={() => onRemove(id)}
            title="Quitar"
            className="px-2 py-1 text-gray-400 hover:bg-red-500/60 hover:text-red-500"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {isDragging ? (
        // Recuadro (placeholder) que muestra DÓNDE va a quedar. Mantiene el
        // tamaño del widget con los hijos invisibles.
        <div className="rounded-2xl border-2 border-dashed border-orange-400 bg-orange-500/10">
          <div className="invisible">{children}</div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default function WidgetBoard({ data, actions }) {
  const uid = data?.usuario?.id;
  const isBarber = !!data?.isBarber;
  const layoutKey = KEY(uid, isBarber ? 'barber' : 'owner');
  // Widgets que aplican a este negocio/rol y audiencia.
  const applicable = useMemo(
    () =>
      WIDGETS.filter(
        (w) => audienceOk(w.id, isBarber) && w.applies(data),
      ).map((w) => w.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.isServices, data?.isAdmin, data?.showBank, isBarber],
  );

  const [order, setOrder] = useState([]);
  const [editing, setEditing] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState(null); // widget que se arrastra
  const [activeWidth, setActiveWidth] = useState(null); // ancho para el overlay

  // Cargar layout guardado (o el por defecto), filtrado a lo aplicable.
  useEffect(() => {
    if (!uid) return;
    let saved = null;
    try {
      const raw = localStorage.getItem(layoutKey);
      if (raw) saved = JSON.parse(raw);
    } catch {
      /* ignora */
    }
    const base = Array.isArray(saved?.order) ? saved.order : DEFAULT_LAYOUT;
    setOrder(base.filter((id) => REGISTRY[id] && applicable.includes(id)));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, applicable.join(',')]);

  const persist = (next) => {
    setOrder(next);
    try {
      localStorage.setItem(layoutKey, JSON.stringify({ order: next }));
    } catch {
      /* ignora */
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragStart = (e) => {
    setActiveId(e.active.id);
    // Medir el ancho del widget para que la copia flotante no se deforme.
    try {
      const el = document.querySelector(`[data-widget-id="${e.active.id}"]`);
      setActiveWidth(el ? el.getBoundingClientRect().width : null);
    } catch {
      setActiveWidth(null);
    }
  };

  const onDragEnd = (e) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = order.indexOf(active.id);
    const to = order.indexOf(over.id);
    if (from < 0 || to < 0) return;
    persist(arrayMove(order, from, to));
  };

  const removeWidget = (id) => persist(order.filter((x) => x !== id));
  const addWidget = (id) => {
    persist([...order, id]);
    setShowCatalog(false);
  };
  const resetLayout = () =>
    persist(DEFAULT_LAYOUT.filter((id) => applicable.includes(id)));

  const hidden = applicable.filter((id) => !order.includes(id));

  if (!ready) return null;

  return (
    <div>
      {/* Barra de acciones */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowCatalog((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4" /> Añadir widget
        </button>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            editing
              ? 'bg-orange-500 text-white'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {editing ? 'Listo' : 'Organizar'}
        </button>
      </div>

      {/* Catálogo de widgets ocultos */}
      {showCatalog && (
        <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold text-gray-500">
            ¿Quieres añadir otro widget?
          </p>
          {hidden.length === 0 ? (
            <p className="text-xs text-gray-400">
              Ya tienes todos los widgets visibles.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {hidden.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => addWidget(id)}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-orange-300 hover:bg-orange-50"
                >
                  <PlusIcon className="h-3.5 w-3.5" /> {REGISTRY[id].name}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={resetLayout}
            className="mt-3 text-[11px] font-medium text-gray-400 hover:text-gray-600"
          >
            Restablecer al diseño por defecto
          </button>
        </div>
      )}

      {order.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          No tienes widgets. Toca “Añadir widget” para empezar.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={order} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {order.map((id) => {
                const w = REGISTRY[id];
                if (!w) return null;
                const Render = w.Render;
                return (
                  <SortableWidget
                    key={id}
                    id={id}
                    wide={w.wide}
                    editing={editing}
                    onRemove={removeWidget}
                  >
                    <Render data={data} actions={actions} />
                  </SortableWidget>
                );
              })}
            </div>
          </SortableContext>

          {/* Copia limpia que sigue el dedo/cursor (no se deforma). */}
          <DragOverlay dropAnimation={null}>
            {activeId && REGISTRY[activeId] ? (
              <div
                style={activeWidth ? { width: activeWidth } : undefined}
                className="rotate-1 cursor-grabbing opacity-95 shadow-2xl"
              >
                {(() => {
                  const R = REGISTRY[activeId].Render;
                  return <R data={data} actions={actions} />;
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
