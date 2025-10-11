import usePermissions from '@/hooks/usePermissions';

export default function AssignAdvisor({
  rol,
  view,
  selectedIds,
  setShowModal,
}) {
  const { canAssign } = usePermissions();
  return (
    <>
      {canAssign && view === 'customers' && selectedIds.length > 0 && (
        <button
          onClick={() => setShowModal(true)}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
        >
          Asignar asesor{' '}
          <span className="font-semibold">{selectedIds.length}</span>
        </button>
      )}
    </>
  );
}
