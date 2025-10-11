export default function ModalAdvisor({
  selectedAdvisor,
  setSelectedAdvisor,
  setShowModal,
  handleAssignMultiple,
  loading,
  advisors = [],
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">Seleccionar asesor</h2>
        <select
          value={selectedAdvisor}
          onChange={(e) => setSelectedAdvisor(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4 cursor-pointer"
          disabled={loading}
        >
          <option value="">Selecciona un asesor</option>
          {advisors.map((advisor) => (
            <option key={advisor.id} value={advisor.id}>
              {advisor.name}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 border rounded hover:bg-gray-100 cursor-pointer"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleAssignMultiple}
            className={`px-4 py-2 text-white rounded cursor-pointer ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={loading}
          >
            {loading ? 'Asignando...' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  );
}
