export default function ModalAdvisor({
  selectedAdvisor,
  setSelectedAdvisor,
  setShowModal,
  assignAdvisor,
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">Seleccionar asesor</h2>
        <select
          value={selectedAdvisor}
          onChange={(e) => setSelectedAdvisor(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4 cursor-pointer"
        >
          <option value="">Selecciona un asesor</option>
          <option value="maria_manrrique">Maria manrrique</option>
          <option value="jorge_espinosa">Jorge Espinosa</option>
          <option value="luisa_crespo">Luisa Crespo</option>
        </select>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 border rounded hover:bg-gray-100 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={assignAdvisor}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
          >
            Asignar
          </button>
        </div>
      </div>
    </div>
  );
}
