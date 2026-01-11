'use client';
import { useCallback, useEffect, useState } from 'react';
import DepartaCiudad from '@/components/dashboard/select/depart_ciud';
import BtnReturn from '../buttons/return';
import BtnSave from '../buttons/save';
import useUsers from '@/lib/api/hooks/useUsers';
import ColorSelect from './colorSelect';
import { formatCOP, formatPrice } from '@/lib/api/utils/utils';
import useLocals from '@/lib/api/hooks/useLocals';
import { getProviders } from '@/lib/api/routes/providers';
import { getCategories } from '@/lib/api/routes/categories';
import { getBrands } from '@/lib/api/routes/brands';
import ProductSelector from './productSelector';
import { getCustomers } from '@/lib/api/routes/customers';
import ImageUploader from '../inventory/imageUploader';
import { colorOptions } from '@/lib/api/utils/getColors';

export default function DinamicForm({
  formData,
  formFields,
  handleSubmit,
  setFormData,
  handleReset,
  isLocked = false,
  loading,
  mode = 'edit',
  module = 'inventory',
  images,
  setImages,
  showImages,
  setShowImages,
}) {
  const [dynamicOptions, setDynamicOptions] = useState({});
  const { getUsers } = useUsers();
  const { getLocals } = useLocals();

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (
      name === 'purchasePrice' ||
      name === 'salePrice' ||
      name === 'totalAmount'
    ) {
      formattedValue = formatPrice(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
      ...(name === 'department' ? { city: '' } : {}),
    }));
  };

  const handleColorChange = useCallback(
    (value) => {
      setFormData((prev) => ({
        ...prev,
        stock: value.reduce((acc, v) => acc + Number(v.stock || 0), 0),
        variants: value,
      }));
    },
    [setFormData]
  );

  const fetchDynamicOptions = useCallback(async () => {
    if (!Array.isArray(formFields)) return;

    const loaders = {
      users: getUsers,
      locals: getLocals,
      providers: getProviders,
      categories: getCategories,
      brands: getBrands,
      customers: getCustomers,
    };

    const results = {};

    for (const field of formFields) {
      if (field?.type === 'select' && loaders[field.source]) {
        const fetcher = loaders[field.source];
        const response = await fetcher();
        const data = Array.isArray(response) ? response : response?.data || [];

        results[field.name] = data.map((item) => ({
          id: item.id,
          name:
            item.name ||
            `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim(),
        }));
      }
    }

    setDynamicOptions(results);
  }, [formFields, getUsers, getLocals]);

  useEffect(() => {
    fetchDynamicOptions();
  }, [fetchDynamicOptions]);

  const hasDepartaCiudad = Array.isArray(formFields)
    ? formFields.some((f) => f.name === 'department' || f.name === 'city')
    : false;

  const isObject = (value) =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-8 ${loading ? 'pointer-events-none opacity-60' : ''}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(formFields) &&
          formFields.map((field) => {
            const {
              name,
              label,
              type = 'text',
              required = true,
              options,
              disabled,
            } = field;

            if (name === 'department' || name === 'city') return null;

            if (name === 'purchasePrice' || name === 'salePrice') {
              formData[name] = formatCOP(formData[name] || '');
            }

            if (type === 'colorSelect') {
              return (
                <div key={name} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  {formData.variants && formData.variants.length > 0 && (
                    <>
                      <div className="flex -space-x-1 mb-2">
                        {(formData.variants || []).slice(0, 50).map((v) => {
                          const opt = colorOptions.find(
                            (c) =>
                              c.name.toUpperCase() === v.color.toUpperCase()
                          );

                          return (
                            <span
                              key={v.color}
                              title={`${v.color} (${v.stock})`}
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: opt?.hex || '#ccc' }}
                            />
                          );
                        })}
                      </div>
                    </>
                  )}

                  <ColorSelect
                    value={formData.variants || []}
                    onChange={handleColorChange}
                    options={options}
                    disabled={isLocked}
                  />
                </div>
              );
            }

            if (type === 'productSelect') {
              return (
                <div key={name} className="flex flex-col col-span-full">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <ProductSelector
                    value={formData[name]}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        [name]: value,
                        totalAmount: value.reduce(
                          (acc, p) => acc + p.subtotal,
                          0
                        ),
                      }));
                    }}
                  />
                </div>
              );
            }

            if (type === 'textarea') {
              return (
                <div key={name} className="flex flex-col col-span-full">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <textarea
                    type={type}
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    disabled={isLocked}
                    required={required}
                    className={`w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none transition ${
                      isLocked
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                  />
                </div>
              );
            }
            if (type === 'select') {
              const fieldOptions = options || dynamicOptions[name] || [];
              return (
                <div key={name} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <select
                    name={name}
                    value={
                      isObject(formData[name])
                        ? formData[name].id ?? ''
                        : formData[name] ?? ''
                    }
                    onChange={handleChange}
                    disabled={isLocked || disabled}
                    required={required}
                    className={`w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none transition ${
                      isLocked || disabled
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                  >
                    <option value="">Seleccione una opción</option>
                    {fieldOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            return (
              <div key={name} className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <input
                  type={type}
                  name={name}
                  value={formData[name] || ''}
                  onChange={handleChange}
                  disabled={isLocked || disabled}
                  required={required}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none transition ${
                    isLocked || disabled
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                  }`}
                />
              </div>
            );
          })}
        {hasDepartaCiudad && (
          <DepartaCiudad
            formData={formData}
            handleChange={handleChange}
            isLocked={isLocked}
          />
        )}
        {module === 'inventory' && (
          <>
            <div className="col-span-full">
              <ImageUploader
                images={images}
                setImages={setImages}
                showImages={showImages}
                setShowImages={setShowImages}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end mt-6 gap-3">
        <BtnReturn route={`/CRM/dashboard/${module}`} disabled={loading} />
        {mode === 'new' && handleReset && (
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm shadow-sm hover:bg-gray-50 transition cursor-pointer"
          >
            Limpiar
          </button>
        )}
        <BtnSave disabled={loading} />
      </div>
    </form>
  );
}
