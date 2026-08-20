'use client';

import Link from 'next/link';
import { canSeeOldPrice } from '@/hooks/inventory.permissions';
import { getProductFields } from '@/config/verticalProfiles';
import Actions from './actions';
import PhoneContentData from './contentData/phone';
import WhatsappLink from './contentData/whatsappLink';
import LastAudit from './contentData/lastAudit';
import ConfirmClientButton from '@/components/appointments/ConfirmClientButton';
import {
  formatCOP,
  formatDateTime,
  formatDateSafe,
  formatDateOnly,
  toggleCase,
} from '@/lib/api/utils/utils';
import { useAuth } from '@/context/authContext';

export default function ContentData({
  paginatedData = [],
  rol,
  view,
  setSelected,
  setSelectedVariants,
  handleDeleteClick,
  handleToggleStatus,
  setPrinterInvoice,
  setShowModalChangeAdvisor,
}) {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const pf = getProductFields(usuario?.company?.type);
  const showOldPrice = canSeeOldPrice(usuario) && pf.oldPrice;

  return (
    <>
      {paginatedData.map((info, index) => {
        const isLocked = false;

        return (
          <tr
            key={info.id}
            className={`
              group transition-colors
              ${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
              ${isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-orange-50'}
            `}
          >
            <td className="sticky left-0 z-10 bg-inherit px-5 py-4 text-center shadow-[inset_-10px_0_8px_-8px_rgba(0,0,0,0.06)]">
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
                handleToggle={() => handleToggleStatus?.(info)}
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
                <td className="px-5 py-4">
                  <LastAudit audit={info.lastAudit} />
                </td>
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
                {pf.barcode && (
                  <td className="px-5 py-4 whitespace-nowrap">
                    {info.barcode || '---'}
                  </td>
                )}

                <td className="px-5 py-4 text-center">
                  {(() => {
                    const min = Number(info.minStock) || 0;
                    const s = Number(info.stock) || 0;
                    let cls;
                    let low = false;
                    if (min > 0) {
                      if (s <= min) {
                        cls = 'bg-red-50 text-red-600';
                        low = true;
                      } else if (s <= min * 2) {
                        cls = 'bg-yellow-50 text-yellow-600';
                      } else {
                        cls = 'bg-green-50 text-green-600';
                      }
                    } else {
                      cls =
                        s <= 3
                          ? 'bg-red-50 text-red-600'
                          : s <= 6
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-green-50 text-green-600';
                    }
                    return (
                      <span className="inline-flex flex-col items-center">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full font-medium ${cls}`}
                        >
                          {info.stock ?? '---'}
                        </span>
                        {low && (
                          <span className="mt-0.5 text-[10px] font-semibold text-red-500">
                            Stock bajo
                          </span>
                        )}
                      </span>
                    );
                  })()}
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  {info.local?.name || '---'}
                </td>
                {pf.provider && (
                  <td className="px-5 py-4 whitespace-nowrap">
                    {info.provider?.name || '---'}
                  </td>
                )}
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
                <td className="px-5 py-4">
                  <LastAudit audit={info.lastAudit} />
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
                <td className="px-5 py-4">
                  <LastAudit audit={info.lastAudit} />
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
                <td className="px-5 py-4 whitespace-nowrap">
                  <Link
                    href={`/dashboard/customers/${info.id}`}
                    className="font-medium text-orange-600 hover:underline"
                  >
                    {info.name}
                  </Link>
                </td>
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
                <td className="px-5 py-4">
                  <LastAudit audit={info.lastAudit} />
                </td>
              </>
            )}

            {view === 'delivered_sales' && (
              <>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.code || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div>{info.customer?.name || '---'}</div>
                  {info.customer?.document !== '222222222222' && (
                    <WhatsappLink
                      phone={info.customer?.phone}
                      className="mt-1 text-xs"
                    />
                  )}
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
                <td className="px-5 py-4">
                  <LastAudit audit={info.lastAudit} />
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
                  {formatDateOnly(info.expenseDate) || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.status || '---'}
                </td>
                <td className="px-5 py-4">
                  <LastAudit audit={info.lastAudit} />
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
                  {info.adminEmail ? (
                    <a
                      href={`mailto:${info.adminEmail}`}
                      className="font-medium text-orange-600 hover:underline"
                    >
                      {info.adminEmail}
                    </a>
                  ) : (
                    <span className="text-gray-400">sin admin</span>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.phone || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.status || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.plan ? (
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                      {info.plan}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.domain ? (
                    <a
                      href={`https://${info.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-orange-600 hover:underline"
                    >
                      {info.domain}
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {formatDateOnly(info.startDate || info.createdAt) || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.paidUntil ? (
                    <span
                      className={
                        new Date(info.paidUntil) < new Date()
                          ? 'font-semibold text-red-600'
                          : 'text-gray-700'
                      }
                    >
                      {formatDateOnly(info.paidUntil)}
                      {new Date(info.paidUntil) < new Date() && ' (vencido)'}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </>
            )}

            {view === 'services' && (
              <>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.description || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.duration ? `${info.duration} min` : '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.status || '---'}
                </td>
                <td className="px-5 py-4">
                  <LastAudit audit={info.lastAudit} />
                </td>
              </>
            )}

            {view === 'appointments' && (
              <>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium
                    ${
                      info.status === 'COMPLETADA'
                        ? 'bg-green-100 text-green-700'
                        : info.status === 'PENDIENTE'
                          ? 'bg-orange-100 text-orange-700'
                          : info.status === 'CANCELADA'
                            ? 'bg-red-100 text-red-700'
                            : info.status === 'CONFIRMADA'
                              ? 'bg-blue-100 text-blue-700'
                              : info.status === 'EN_PROCESO'
                                ? 'bg-purple-100 text-purple-700'
                                : info.status === 'NO_ASISTIO'
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {toggleCase(info.status, 'uppercase') || '---'}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {formatDateOnly(info.date) || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.startTime || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.service?.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.barber?.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.customer?.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.customer?.document !== '222222222222' &&
                  info.customer?.phone ? (
                    <ConfirmClientButton appt={info} />
                  ) : (
                    '---'
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.local?.name || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.notes || '---'}
                </td>
                <td className="px-5 py-4">
                  <LastAudit audit={info.lastAudit} />
                </td>
              </>
            )}
          </tr>
        );
      })}
    </>
  );
}
