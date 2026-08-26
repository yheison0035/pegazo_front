'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
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
import { WIDGETS, DEFAULT_LAYOUT } from './widgets';

const REGISTRY = Object.fromEntries(WIDGETS.map((w) => [w.id, w]));
const KEY = (uid) => `pegazo_home_layout_v2_${uid || 'anon'}`;

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
      className={`group relative ${wide ? 'md:col-span-2' : ''} ${
        isDragging ? 'opacity-80' : ''
      }`}
    >
      {/* Controles: al hacer hover (escritorio) o en modo Organizar (móvil). */}
      <div
        className={`absolute right-2 top-2 z-10 flex items-center gap-1 transition ${
          editing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
          {/* Mano para mover (arrastra desde aquí) */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="Mover"
            className="cursor-grab touch-none rounded-lg bg-white/90 p-1 text-gray-400 shadow ring-1 ring-gray-200 hover:text-gray-600 active:cursor-grabbing"
          >
            <GripIcon className="h-4 w-4" />
          </button>
          {/* Quitar */}
          <button
            type="button"
            onClick={() => onRemove(id)}
            title="Quitar"
            className="rounded-lg bg-white/90 p-1 text-gray-400 shadow ring-1 ring-gray-200 hover:text-red-500"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
      </div>
      {children}
    </div>
  );
}

export default function WidgetBoard({ data, actions }) {
  const uid = data?.usuario?.id;
  // Widgets que aplican a este negocio/rol.
  const applicable = useMemo(
    () => WIDGETS.filter((w) => w.applies(data)).map((w) => w.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.isServices, data?.isAdmin, data?.showBank],
  );

  const [order, setOrder] = useState([]);
  const [editing, setEditing] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [ready, setReady] = useState(false);

  // Cargar layout guardado (o el por defecto), filtrado a lo aplicable.
  useEffect(() => {
    if (!uid) return;
    let saved = null;
    try {
      const raw = localStorage.getItem(KEY(uid));
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
      localStorage.setItem(KEY(uid), JSON.stringify({ order: next }));
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

  const onDragEnd = (e) => {
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
          onDragEnd={onDragEnd}
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
        </DndContext>
      )}
    </div>
  );
}
