import { canSeeOldPrice } from '@/hooks/inventory.permissions';
import Actions from './actions';
import PhoneContentData from './contentData/phone';
import { formatCOP, formatDateDMY } from '@/lib/api/utils/utils';
import { useAuth } from '@/context/authContext';

export default function ContentData({
  paginatedData = [],
  rol,
  view,
  setSelected,
  setSelectedVariants,
  handleDeleteClick,
  setPrinterInvoice,
  setShowModalChangeAdvisor,
}) {
  const { usuario } = useAuth();
  const showOldPrice = canSeeOldPrice(usuario);

  return (
    <>
      {paginatedData.map((info, index) => {
        const isLocked =
          view === 'customers' &&
          rol === 'ASESOR' &&
          !info.comments?.length &&
          index > 0;

        return (
          <tr
            key={info.id}
            className={`border-b border-gray-300 ${
              isLocked
                ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50'
            }`}
          >
            {view === 'locals' && (
              <>
                <td className="px-4 py-3">{info.name}</td>
                <td className="px-4 py-3">{info.address}</td>
                <td className="px-4 py-3">{info.city || '-----'}</td>
                <td className="px-4 py-3">{info.manager?.name || '-----'}</td>
                <td className="px-4 py-3">{info?.status || '-----'}</td>
                <PhoneContentData info={info} />
              </>
            )}

            {view === 'providers' && (
              <>
                <td className="px-4 py-3">{info.name}</td>
                <td className="px-4 py-3">{info.contactName}</td>
                <td className="px-4 py-3">{info.productType || '-----'}</td>
                <td className="px-4 py-3">{info.address}</td>
                <td className="px-4 py-3">{info.city}</td>
                <td className="px-4 py-3">{info?.status || '-----'}</td>
                <PhoneContentData info={info} />
              </>
            )}

            {view === 'inventory' && (
              <>
                <td className="flex justify-center items-center p-0 m-2">
                  <div className="w-[70px] h-[80px] rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm">
                    <img
                      src={info?.images?.[0]?.url || '/images/no-image.png'}
                      alt={info.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </td>

                <td className="px-4 py-3">{info.name || '-----'}</td>
                <td className="px-4 py-3">{info.barcode || '-----'}</td>

                <td
                  className={`px-4 py-3 font-semibold text-center ${
                    info.stock <= 3
                      ? 'text-red-700'
                      : info.stock <= 6
                        ? 'text-orange-700'
                        : 'text-green-700'
                  }`}
                >
                  {info.stock ?? '-----'}
                </td>

                <td className="px-4 py-3">{info.local?.name || '-----'}</td>
                <td className="px-4 py-3">{info.provider?.name || '-----'}</td>
                <td className="px-4 py-3">
                  {formatCOP(info.salePrice) || '-----'}
                </td>

                {showOldPrice && (
                  <td className="px-4 py-3">
                    {formatCOP(info.oldPrice || 0) || '-----'}
                  </td>
                )}

                <td className="px-4 py-3">{info.status || '-----'}</td>
              </>
            )}

            {(view === 'brands' || view === 'categories') && (
              <>
                <td className="px-4 py-3">{info.name || '-----'}</td>
                <td className="px-4 py-3">{info.description || '-----'}</td>
                <td className="px-4 py-3">{info.status || '-----'}</td>
                <td className="px-4 py-3">{info.local?.name || '-----'}</td>
              </>
            )}

            {view === 'users' && (
              <>
                <td className="px-4 py-3">{info.role || '-----'}</td>
                <td className="px-4 py-3">{info.name || '-----'}</td>
                <td className="px-4 py-3">
                  {info.managedLocals?.length
                    ? info.managedLocals.map((l) => l.name).join(' - ')
                    : '-----'}
                </td>
                <td className="px-4 py-3">{info.local?.name || '-----'}</td>
                <td className="px-4 py-3">{info.document || '-----'}</td>
                <td className="px-4 py-3">{info.email || '-----'}</td>
                <PhoneContentData info={info} />
                <td className="px-4 py-3">{info.address || '-----'}</td>
                <td className="px-4 py-3">{info.status || '-----'}</td>
              </>
            )}

            {view === 'customers' && (
              <>
                <td className="px-4 py-3">{info.type_document}</td>
                <td className="px-4 py-3">{info.document}</td>
                <td className="px-4 py-3">{info.name}</td>
                <td className="px-4 py-3">{info.email || '-----'}</td>
                <td className="px-4 py-3">{info.local?.name || '-----'}</td>
                <PhoneContentData info={info} />
                <td className="px-4 py-3">{info.city || '-----'}</td>
                <td className="px-4 py-3">{info.status || '-----'}</td>
              </>
            )}

            {view === 'delivered_sales' && (
              <>
                <td className="px-4 py-3">{info.code || '-----'}</td>
                <td className="px-4 py-3">{info.customer?.name || '-----'}</td>
                <td className="px-4 py-3 font-bold">
                  {formatCOP(info.totalAmount) || '-----'}
                </td>
                <td className="px-4 py-3">{info.paymentMethod || '-----'}</td>
                <td className="px-4 py-3">{info.local?.name || '-----'}</td>
                <td className="px-4 py-3">{info.user?.name || '-----'}</td>
                <td className="px-4 py-3">{info.paymentStatus || '-----'}</td>
                <td className="px-4 py-3">
                  {formatDateDMY(info.saleDate) || '-----'}
                </td>
              </>
            )}

            {view === 'expenses' && (
              <>
                <td className="px-4 py-3">{info.concept}</td>
                <td className="px-4 py-3">{info.type}</td>
                <td className="px-4 py-3 font-bold">
                  {formatCOP(info.amount)}
                </td>
                <td className="px-4 py-3">{info.paymentMethod || '-----'}</td>
                <td className="px-4 py-3">{info.paidTo || '-----'}</td>
                <td className="px-4 py-3">{info.local?.name || '-----'}</td>
                <td className="px-4 py-3">{info.provider?.name || '-----'}</td>
                <td className="px-4 py-3">
                  {formatDateDMY(info.expenseDate) || '-----'}
                </td>
                <td className="px-4 py-3">{info.status || '-----'}</td>
              </>
            )}

            <td className="px-4 py-3 text-center">
              <Actions
                isLocked={isLocked}
                rol={rol}
                info={info}
                view={view}
                setSelected={setSelected}
                setSelectedVariants={setSelectedVariants}
                setPrinterInvoice={setPrinterInvoice}
                handleDelete={() =>
                  handleDeleteClick(info.id, info.name || info.code)
                }
                setShowModalChangeAdvisor={setShowModalChangeAdvisor}
              />
            </td>
          </tr>
        );
      })}
    </>
  );
}
