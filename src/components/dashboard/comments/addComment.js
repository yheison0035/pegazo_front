export default function AddComment({
  newComment,
  setNewComment,
  handleAddComment,
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        Agregar comentario
      </label>
      <div className="flex gap-3 mt-1">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          rows="2"
          placeholder="Escriba un comentario..."
        />
        <button
          type="button"
          onClick={handleAddComment}
          disabled={!newComment.trim()}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2 rounded-xl shadow-md 
             hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}
