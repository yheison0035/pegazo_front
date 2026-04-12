'use client';

import { canSeeOldPrice } from '@/hooks/inventory.permissions';
import Actions from './actions';
import PhoneContentData from './contentData/phone';
import { formatCOP, formatDateTime } from '@/lib/api/utils/utils';
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
            className={`
              group transition-all
              ${isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}
            `}
          >
            <td className="px-5 py-4 text-center">
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
            {view === 'locals' && (
              <>
                <td className="px-5 py-4 whitespace-nowrap">{info.name}</td>
                <td className="px-5 py-4 whitespace-nowrap">{info.address}</td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.city || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.manager?.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info?.status || '---'}
                </td>
                <PhoneContentData info={info} />
              </>
            )}

            {view === 'providers' && (
              <>
                <td className="px-5 py-4 whitespace-nowrap">{info.name}</td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.contactName}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.productType || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">{info.address}</td>
                <td className="px-5 py-4 whitespace-nowrap">{info.city}</td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info?.status || '---'}
                </td>
                <PhoneContentData info={info} />
              </>
            )}

            {view === 'inventory' && (
              <>
                <td className="px-5 py-4">
                  <div className="w-[60px] h-[70px] rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <img
                      src={info?.images?.[0]?.url || '/images/no-image.png'}
                      alt={info.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  {info.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.barcode || '---'}
                </td>

                <td className="px-5 py-4 text-center">
                  <span
                    className={`px-2.5 py-1 text-xs rounded-full font-medium
                      ${
                        info.stock <= 3
                          ? 'bg-red-50 text-red-600'
                          : info.stock <= 6
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-green-50 text-green-600'
                      }`}
                  >
                    {info.stock ?? '---'}
                  </span>
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  {info.local?.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.provider?.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {formatCOP(info.salePrice) || '---'}
                </td>

                {showOldPrice && (
                  <td className="px-5 py-4 whitespace-nowrap">
                    {formatCOP(info.oldPrice || 0) || '---'}
                  </td>
                )}

                <td className="px-5 py-4 whitespace-nowrap">
                  {info.status || '---'}
                </td>
              </>
            )}

            {(view === 'brands' || view === 'categories') && (
              <>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.description || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.status || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.local?.name || '---'}
                </td>
              </>
            )}

            {view === 'users' && (
              <>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.role || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.managedLocals?.length
                    ? info.managedLocals.map((l) => l.name).join(' - ')
                    : '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.local?.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.document || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.email || '---'}
                </td>
                <PhoneContentData info={info} />
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.address || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.status || '---'}
                </td>
              </>
            )}

            {view === 'customers' && (
              <>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.type_document}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">{info.document}</td>
                <td className="px-5 py-4 whitespace-nowrap">{info.name}</td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.email || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.local?.name || '---'}
                </td>
                <PhoneContentData info={info} />
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.city || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.status || '---'}
                </td>
              </>
            )}

            {view === 'delivered_sales' && (
              <>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.code || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.customer?.name || '---'}
                </td>
                <td className="px-5 py-4 font-semibold whitespace-nowrap">
                  {formatCOP(info.totalAmount) || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.paymentMethod || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.local?.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.user?.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.paymentStatus || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {formatDateTime(info.saleDate) || '---'}
                </td>
              </>
            )}

            {view === 'expenses' && (
              <>
                <td className="px-5 py-4 whitespace-nowrap">{info.concept}</td>
                <td className="px-5 py-4 whitespace-nowrap">{info.type}</td>
                <td className="px-5 py-4 font-semibold whitespace-nowrap">
                  {formatCOP(info.amount)}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.paymentMethod || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.paidTo || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.local?.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.provider?.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {formatDateTime(info.expenseDate) || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.status || '---'}
                </td>
              </>
            )}

            {view === 'companies' && (
              <>
                <td className="px-5 py-4">
                  <div className="w-[120px] h-[130px] rounded-xl overflow-hidden flex items-center justify-center">
                    <img
                      src={info?.logo || '/images/no-image.png'}
                      alt={info.name}
                      className="object-cover bg-[#0B0F19]"
                    />
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.type || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.manager || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.phone || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.status || '---'}
                </td>
              </>
            )}
          </tr>
        );
      })}
    </>
  );
}
