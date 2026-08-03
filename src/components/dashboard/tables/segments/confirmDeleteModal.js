import { TrashIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function ConfirmDeleteModal({
  show,
  setShow,
  onConfirm,
  type,
  name,
  loading = false,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Confirmar eliminación
        </h2>
        <p className="text-gray-600">
          ¿Estás segur@ de que quieres eliminar {type}?
        </p>
        <h3 className="font-bold text-gray-600">{name}</h3>
        <p className="text-gray-600">Esta acción no se puede deshacer.</p>

        <div className="flex justify-end gap-3 mt-3">
          <Button
            variant="secondary"
            onClick={() => setShow(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            icon={TrashIcon}
            onClick={onConfirm}
            loading={loading}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}
