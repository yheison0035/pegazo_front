'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import CommentsHistory from '@/components/dashboard/comments/CommentsHistory';
import Variants from '@/components/dashboard/viewModal/variants';
import {
  formatCOP,
  formatDateSafe,
  formatDateOnly,
  getValueByPath,
  formatDateTime,
} from '@/lib/api/utils/utils';
import ImageGallery from '@/components/dashboard/viewModal/imageGallery';
import SaleItemsTable from '@/components/dashboard/viewModal/saleItemsTable';
import InventorySpecsView from '@/components/dashboard/viewModal/inventorySpecsView';
import { useAuth } from '@/context/authContext';
import { roleLabel } from '@/config/roleLabels';

export default function ViewModal({
  data,
  type,
  onClose,
  viewModalConfig,
  view = '',
}) {
  const { usuario } = useAuth();

  if (!data) return null;

  if (type === 'variants') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-200 transition cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <Variants data={data} view={view} />
        </div>
      </div>
    );
  }

  const config = viewModalConfig;
  if (!config) return null;

  const gridCols =
    config.columns === 2
      ? 'md:grid-cols-2'
      : config.columns === 3
        ? 'md:grid-cols-3'
        : 'md:grid-cols-1';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white hover:text-gray-200 transition cursor-pointer"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="bg-gradient-to-r from-orange-600 to-gray-900 text-white px-6 py-5 rounded-t-2xl shrink-0">
          <h2 className="text-2xl font-bold">{config.title}</h2>
          <p className="text-sm opacity-80">{config.subtitle}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className={`p-6 grid grid-cols-1 gap-8 ${gridCols}`}>
            {config.sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                {section.fields.map((field) => {
                  let value = getValueByPath(data, field.name);

                  if (
                    [
                      'purchasePrice',
                      'salePrice',
                      'oldPrice',
                      'totalAmount',
                      'amount',
                    ].includes(field.name)
                  ) {
                    value = formatCOP(value);
                  }

                  if (field.type === 'date') {
                    value = formatDateTime(value);
                  }

                  if (field.type === 'dateOnly') {
                    value = formatDateOnly(value);
                  }

                  if (field.type === 'role') {
                    value = roleLabel(value, usuario?.company);
                  }

                  if (field.type === 'status') {
                    return (
                      <div key={field.name}>
                        <p className="font-semibold text-gray-700">
                          {field.label}
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            value === 'INACTIVO'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {value}
                        </span>
                      </div>
                    );
                  }

                  if (field.type === 'locals') {
                    return (
                      <div key={field.name}>
                        <p className="font-semibold text-gray-700">
                          {field.label}
                        </p>
                        {data.locals?.length > 0 ? (
                          data.locals.map((local, i) => (
                            <p key={i} className="text-gray-500">
                              {local.name}
                            </p>
                          ))
                        ) : (
                          <p className="text-gray-400 italic">
                            Sin locales asignados
                          </p>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={field.name}>
                      <p className="font-semibold text-gray-700">
                        {field.label}
                      </p>
                      <p className="text-gray-500">{value || '-----'}</p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {Array.isArray(data.items) && data.items.length > 0 && (
            <SaleItemsTable items={data.items} />
          )}

          <InventorySpecsView title="Características" data={data.features} />
          <InventorySpecsView
            title="Especificaciones"
            data={data.specifications}
          />

          {type === 'inventory' && <ImageGallery images={data.images} />}

          {config.showComments && (
            <div className="border-t p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Historial de comentarios
              </h3>
              <CommentsHistory formData={data} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
