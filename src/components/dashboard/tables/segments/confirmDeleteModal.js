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
          ¿Estás segur@ de que quieres eliminar este {type}?
        </p>
        <h3 className="font-bold text-gray-600">{name}</h3>
        <p className="text-gray-600">Esta acción no se puede deshacer.</p>

        <div className="flex justify-end gap-3 mt-3">
          <button
            onClick={() => setShow(false)}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 cursor-pointer"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-white ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            } cursor-pointer`}
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
