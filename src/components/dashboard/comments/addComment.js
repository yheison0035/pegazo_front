import Button from '@/components/ui/Button';
import { PlusIcon } from '@heroicons/react/24/outline';

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
        <Button
          type="button"
          variant="add"
          icon={PlusIcon}
          onClick={handleAddComment}
          disabled={!newComment.trim()}
        >
          Agregar
        </Button>
      </div>
    </div>
  );
}
