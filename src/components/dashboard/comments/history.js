export default function CommentsHistory({ customer }) {
  console.log(customer);
  return (
    <>
      <label className="block text-sm font-medium text-gray-700">
        Historial de comentarios
      </label>
      <div className="mt-2 border rounded-md p-3 max-h-100 overflow-y-auto bg-gray-50">
        {customer?.comments?.length > 0 ? (
          customer?.comments.map((c, index) => (
            <div key={index} className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                  {customer?.advisor?.charAt(0) || '?'}
                </div>
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  {customer.advisor || 'Asesor desconocido'}
                </p>
                <p className="text-xs text-gray-500">{c.date}</p>
                <p className="mt-1 text-sm text-gray-700">{c.description}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No hay comentarios</p>
        )}
      </div>
    </>
  );
}
