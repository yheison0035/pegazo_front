'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Sistema único de notificaciones (toasts) para TODO el CRM. Reemplaza los
// modales de alerta que bloqueaban: ahora los mensajes aparecen abajo-derecha,
// con el mismo diseño, y se ocultan solos en tiempo real. Se usa con
// useToast().show({ type, message }) o, transparentemente, vía <AlertModal/>.

const ToastContext = createContext(null);

// Diseño por tipo: color de acento, icono y color del icono.
const TYPES = {
  success: {
    icon: CheckCircleIcon,
    ring: 'border-l-green-500',
    iconColor: 'text-green-500',
    title: 'Éxito',
  },
  error: {
    icon: XCircleIcon,
    ring: 'border-l-red-500',
    iconColor: 'text-red-500',
    title: 'Error',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    ring: 'border-l-amber-500',
    iconColor: 'text-amber-500',
    title: 'Advertencia',
  },
  info: {
    icon: InformationCircleIcon,
    ring: 'border-l-orange-500',
    iconColor: 'text-orange-500',
    title: 'Información',
  },
};

// Duración por tipo (los errores/advertencias se quedan un poco más).
const DURATION = { success: 3200, info: 3200, warning: 4200, error: 5200 };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const timers = useRef({});
  const router = useRouter();

  const dismiss = useCallback(
    (id) => {
      setToasts((list) => {
        const t = list.find((x) => x.id === id);
        // Navegación diferida (flujos "guardado → volver a la lista").
        if (t?.url) router.push(t.url);
        return list.filter((x) => x.id !== id);
      });
      if (timers.current[id]) {
        clearTimeout(timers.current[id]);
        delete timers.current[id];
      }
    },
    [router]
  );

  const show = useCallback(
    ({ type = 'info', message, url, title, duration } = {}) => {
      if (!message) return;
      const id = ++idRef.current;
      const safeType = TYPES[type] ? type : 'info';
      setToasts((list) => [...list, { id, type: safeType, message, url, title }]);
      // Con url (éxito + navegar) el toast dura menos para no demorar el salto.
      const ms = duration ?? (url ? 1600 : DURATION[safeType]);
      timers.current[id] = setTimeout(() => dismiss(id), ms);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function Toaster({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const meta = TYPES[t.type] || TYPES.info;
          const Icon = meta.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border border-gray-100 border-l-4 ${meta.ring} bg-white p-3.5 shadow-xl`}
            >
              <Icon className={`mt-0.5 h-6 w-6 flex-none ${meta.iconColor}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  {t.title || meta.title}
                </p>
                <p className="mt-0.5 break-words text-sm text-gray-600">
                  {t.message}
                </p>
              </div>
              <button
                onClick={() => onDismiss(t.id)}
                className="flex-none text-gray-300 transition hover:text-gray-600"
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  // Fallback seguro si algún árbol quedara fuera del provider.
  if (!ctx) return { show: () => {}, dismiss: () => {} };
  return ctx;
}
