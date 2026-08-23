'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

// Diálogo de confirmación con el diseño del CRM (reemplaza los window.confirm
// nativos del navegador). Bloqueante a propósito: pide confirmar una acción.
export default function ConfirmModal({
  open,
  title = '¿Confirmar?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  tone = 'danger', // 'danger' | 'primary'
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCancel}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${
                  tone === 'danger'
                    ? 'bg-red-50 text-red-500'
                    : 'bg-orange-50 text-orange-500'
                }`}
              >
                <ExclamationTriangleIcon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                {message && (
                  <p className="mt-1 text-sm text-gray-600">{message}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={onCancel} disabled={loading}>
                {cancelText}
              </Button>
              <Button
                variant={tone === 'danger' ? 'danger' : 'primary'}
                onClick={onConfirm}
                loading={loading}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
