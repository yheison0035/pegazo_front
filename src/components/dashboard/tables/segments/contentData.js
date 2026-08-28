'use client';

import Link from 'next/link';
import { canSeeOldPrice } from '@/hooks/inventory.permissions';
import { getProductFields } from '@/config/verticalProfiles';
import { roleLabel } from '@/config/roleLabels';
import Actions from './actions';
import PhoneContentData from './contentData/phone';
import { customerWhatsappMessage } from '@/lib/loyaltyMessage';
import WhatsappLink from './contentData/whatsappLink';
import LastAudit, { VIEW_TO_ENTITY } from './contentData/lastAudit';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmClientButton from '@/components/appointments/ConfirmClientButton';
import {
  formatCOP,
  formatDateTime,
  formatDateSafe,
  formatDateOnly,
} from '@/lib/api/utils/utils';
import { useAuth } from '@/context/authContext';

// Origen del cliente: creado en el CRM o registrado desde la tienda online.
function CustomerSourceBadge({ source }) {
  const isEcommerce = source === 'ECOMMERCE';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isEcommerce
          ? 'bg-blue-500/10 text-blue-600'
          : 'bg-gray-500/10 text-gray-600'
      }`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          isEcommerce ? 'bg-blue-500' : 'bg-gray-400'
        }`}
      />
      {isEcommerce ? 'Tienda online' : 'CRM'}
    </span>
  );
}

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
        const auditEntity = VIEW_TO_ENTITY[view];

        return (
          <tr
            key={info.id}
            className={`
              group bg-white transition-colors
              ${isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-orange-50'}
            `}
          >
            <td className="sticky left-0 z-10 bg-white px-5 py-4 text-center transition-colors group-hover:bg-orange-50 shadow-[inset_-10px_0_8px_-8px_rgba(0,0,0,0.05)]">
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
                  <StatusBadge status={info.status} />
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
                  <StatusBadge status={info.status} />
                </td>
                <PhoneContentData info={info} />
                <td className="px-5 py-4">
                  <LastAudit
                    audit={info.lastAudit}
                    entity={auditEntity}
                    id={info.id}
                  />
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
                  <StatusBadge status={info.status} />
                </td>
                <td className="px-5 py-4">
                  <LastAudit
                    audit={info.lastAudit}
                    entity={auditEntity}
                    id={info.id}
                  />
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
                  <StatusBadge status={info.status} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.local?.name || '---'}
                </td>
                <td className="px-5 py-4">
                  <LastAudit
                    audit={info.lastAudit}
                    entity={auditEntity}
                    id={info.id}
                  />
                </td>
              </>
            )}

            {view === 'users' && (
              <>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.role ? roleLabel(info.role, usuario?.company) : '---'}
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
                  <StatusBadge status={info.status} />
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
                <PhoneContentData
                  info={info}
                  message={
                    info.document !== '222222222222'
                      ? customerWhatsappMessage(info)
                      : undefined
                  }
                />
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.city || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <StatusBadge status={info.status} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <CustomerSourceBadge source={info.source} />
                </td>
                <td className="px-5 py-4">
                  <LastAudit
                    audit={info.lastAudit}
                    entity={auditEntity}
                    id={info.id}
                  />
                </td>
              </>
            )}

            {view === 'delivered_sales' && (
              <>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.code || '---'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {info.customer?.id &&
                  info.customer?.document !== '222222222222' ? (
                    <Link
                      href={`/dashboard/customers/${info.customer.id}`}
                      className="font-medium text-orange-600 hover:underline"
                      title="Ver historial del cliente"
                    >
                      {info.customer.name}
                    </Link>
                  ) : (
                    <div>{info.customer?.name || '---'}</div>
                  )}
                  {info.customer?.document !== '222222222222' && (
                    <WhatsappLink
                      phone={info.customer?.phone}
                      message={customerWhatsappMessage(info.customer)}
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
                  <StatusBadge status={info.paymentStatus} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {formatDateTime(info.saleDate) || '---'}
                </td>
                <td className="px-5 py-4">
                  <LastAudit
                    audit={info.lastAudit}
                    entity={auditEntity}
                    id={info.id}
                  />
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
                  <StatusBadge status={info.status} />
                </td>
                <td className="px-5 py-4">
                  <LastAudit
                    audit={info.lastAudit}
                    entity={auditEntity}
                    id={info.id}
                  />
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
                  <StatusBadge status={info.status} />
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
                    (() => {
                      // Días hasta el vencimiento (por día calendario).
                      const t = new Date(info.paidUntil);
                      const now = new Date();
                      const a = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate(),
                      );
                      const b = new Date(
                        t.getFullYear(),
                        t.getMonth(),
                        t.getDate(),
                      );
                      const days = Math.round(
                        (b - a) / (1000 * 60 * 60 * 24),
                      );
                      let badge, label;
                      if (days < 0) {
                        badge = 'bg-red-50 text-red-700 ring-red-600/20';
                        label = `Vencido (${Math.abs(days)}d)`;
                      } else if (days <= 7) {
                        badge =
                          'bg-amber-50 text-amber-700 ring-amber-600/20';
                        label = days === 0 ? 'Vence hoy' : `Vence en ${days}d`;
                      } else {
                        badge =
                          'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
                        label = 'Al día';
                      }
                      return (
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badge}`}
                          >
                            {label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateOnly(info.paidUntil)}
                          </span>
                        </div>
                      );
                    })()
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
                  <StatusBadge status={info.status} />
                </td>
                <td className="px-5 py-4">
                  <LastAudit
                    audit={info.lastAudit}
                    entity={auditEntity}
                    id={info.id}
                  />
                </td>
              </>
            )}

            {view === 'appointments' && (
              <>
                <td className="px-5 py-4 whitespace-nowrap">
                  <StatusBadge status={info.status} />
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
                  <LastAudit
                    audit={info.lastAudit}
                    entity={auditEntity}
                    id={info.id}
                  />
                </td>
              </>
            )}
          </tr>
        );
      })}
    </>
  );
}
