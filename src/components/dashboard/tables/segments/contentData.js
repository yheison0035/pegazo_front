import { CheckIcon } from '@heroicons/react/24/outline';
import Actions from './actions';
import ConfirmDeleteModal from './confirmDeleteModal';
import { formatDateTime } from '@/lib/api/utils/formatDateTime';
import usePermissions from '@/hooks/usePermissions';

export default function ContentData({
  paginatedData,
  getCustomerLockState,
  rol,
  view,
  setSelected,
  toggleCheckbox,
  selectedIds,
  handleDeleteClick,
  showDeleteModal,
  setShowDeleteModal,
  deleteTarget,
  confirmDelete,
  deleting,
  setShowModalChangeAdvisor,
}) {
  const { canAssign, canViewAll } = usePermissions();

  return (
    <>
      {paginatedData.map((info, index) => {
        const isLocked = getCustomerLockState(index, info);
        return (
          <tr
            key={info.id}
            className={`border-b ${
              isLocked
                ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50'
            }`}
          >
            {canAssign && view === 'customers' && (
              <td className="px-4 py-3 text-center">
                {info.advisor ? (
                  <CheckIcon className="w-5 h-5 text-green-600 mx-auto" />
                ) : (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(info.id)}
                    onChange={() => toggleCheckbox(info)}
                    className="w-4 h-4 cursor-pointer"
                  />
                )}
              </td>
            )}

            {canViewAll && (view === 'customers' || view === 'delivered') && (
              <td className="px-4 py-3">
                {info.advisor?.name || 'Sin Asignar'}
              </td>
            )}

            {canViewAll && view === 'advisors' && (
              <td className="px-4 py-3">{info.role}</td>
            )}

            <td className="px-4 py-3">{info.name}</td>

            {view === 'delivered' && (
              <>
                <td className="px-4 py-3">
                  {info.deliveryDate
                    ? formatDateTime(info.deliveryDate)
                    : '---'}
                </td>
                <td className="px-4 py-3">{info.plateNumber || '---'}</td>
              </>
            )}

            <td className="px-4 py-3">{info.email}</td>
            <td className="px-4 py-3">
              {view === 'customers' || view === 'delivered' ? (
                info.phone ? (
                  <a
                    href={`https://wa.me/${info.phone.replace(
                      /\s+/g,
                      ''
                    )}?text=${encodeURIComponent(
                      'Hola, te contacto desde MotoRenting ---'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-green-600 hover:underline"
                  >
                    {/* Ícono de WhatsApp */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M12 2C6.48 2 2 6.24 2 11.5c0 1.98.64 3.81 1.73 5.34L2 22l5.34-1.7c1.5.9 3.2 1.4 4.99 1.4 5.52 0 10-4.24 10-9.5S17.52 2 12 2zm0 17.5c-1.58 0-3.1-.43-4.42-1.25l-.32-.2-3.17 1.01.97-3.07-.21-.32C4.28 14.18 3.8 12.86 3.8 11.5 3.8 7.64 7.47 4.5 12 4.5s8.2 3.14 8.2 7S16.53 19.5 12 19.5zm4.7-5.57c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.57.12-.17.25-.65.8-.8.97-.15.17-.3.19-.55.06-.25-.12-1.04-.38-1.98-1.22-.73-.64-1.22-1.43-1.37-1.68-.15-.25-.02-.39.11-.51.12-.12.25-.3.37-.45.12-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.12-.57-1.38-.78-1.88-.2-.48-.4-.42-.57-.43h-.48c-.17 0-.45.06-.68.32-.23.25-.9.88-.9 2.15s.92 2.5 1.05 2.67c.12.17 1.8 2.76 4.36 3.87 2.56 1.11 2.56.74 3.02.7.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z" />
                    </svg>

                    <span>{info.phone}</span>
                  </a>
                ) : (
                  '---'
                )
              ) : (
                info.phone || '---'
              )}
            </td>

            {view === 'customers' && (
              <td className="px-4 py-3">{info.state?.name}</td>
            )}

            <td className="px-4 py-3 text-center">
              <Actions
                isLocked={isLocked}
                rol={rol}
                info={info}
                view={view}
                setSelected={setSelected}
                handleDelete={() =>
                  handleDeleteClick(
                    info.id,
                    info.name,
                    view === 'customers' ? 'cliente' : 'cliente entregado'
                  )
                }
                setShowModalChangeAdvisor={(e) => setShowModalChangeAdvisor(e)}
              />

              {showDeleteModal && (
                <ConfirmDeleteModal
                  show={showDeleteModal}
                  setShow={setShowDeleteModal}
                  type={deleteTarget?.type}
                  name={deleteTarget?.name}
                  onConfirm={confirmDelete}
                  loading={deleting}
                />
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
}
