'use client';
import { useCallback, useEffect, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import DepartaCiudad from '@/components/dashboard/select/depart_ciud';
import BtnReturn from '../buttons/return';
import BtnSave from '../buttons/save';
import useUsers from '@/lib/api/hooks/useUsers';
import {
  formatCOP,
  normalizeDateForInput,
  normalizeDateTimeForInput,
  formatPrice,
  toggleCase,
} from '@/lib/api/utils/utils';
import useLocals from '@/lib/api/hooks/useLocals';
import { getProviders } from '@/lib/api/routes/providers';
import { getCategories } from '@/lib/api/routes/categories';
import { getBrands } from '@/lib/api/routes/brands';
import { getCustomers } from '@/lib/api/routes/customers';
import { getExpenseCategories } from '@/lib/api/routes/expenseCategories';
import { getUnitsOfMeasure } from '@/lib/api/routes/unitsOfMeasure';
import { getCustomerSegments } from '@/lib/api/routes/customerSegments';
import ImageUploader from '../inventory/imageUploader';
import LogoUploader from '@/components/ui/LogoUploader';
import { colorOptions } from '@/lib/api/utils/getColors';
import useEnums from '@/lib/api/hooks/useEnums';
import SearchableSelect from './fields/SearchSelectField/searchableSelect';
import ProductSelector from './fields/ProductSelectField/productSelector';
import ColorSelect from './fields/colorSelect';
import ServiceLocalsField from '../services/serviceLocalsField';
import useServices from '@/lib/api/hooks/useServices';
import useAppointments from '@/lib/api/hooks/useAppointments';
import { validateField, validateForm } from '@/lib/api/utils/validators';
import NewCustomerModal from '@/components/dashboard/modals/newCustomerModal';
import { useAuth } from '@/context/authContext';
import { roleLabel, assignableRolesForType } from '@/config/roleLabels';

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
  const [showPassword, setShowPassword] = useState(false);
  const [productError, setProductError] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [createdCustomers, setCreatedCustomers] = useState([]);

  const { usuario } = useAuth();
  const company = usuario?.company;

  const { getUsers, getUsersByRole } = useUsers();
  const { getLocals } = useLocals();
  const { getServices } = useServices();
  const { getAvailability } = useAppointments();
  const {
    getRoles,
    getStatus,
    getPaymentMethods,
    getPaymentStatus,
    getTypeExpenses,
    getTypeCompanies,
  } = useEnums();

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (
      name === 'purchasePrice' ||
      name === 'salePrice' ||
      name === 'oldPrice' ||
      name === 'totalAmount'
    ) {
      formattedValue = formatPrice(value);
    }

    // expenseDate es solo fecha; saleDate es datetime-local y se guarda tal cual
    // (con hora), sin recortarla.
    if (name === 'expenseDate') {
      formattedValue = normalizeDateForInput(value);
    }

    if (
      name === 'name' ||
      name === 'firstName' ||
      name === 'lastName' ||
      name === 'concept' ||
      name === 'paidTo'
    ) {
      formattedValue = toggleCase(value, 'uppercase');
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
      ...(name === 'department' ? { city: '' } : {}),
    }));

    // Validación en tiempo real: valida el campo con su nuevo valor y muestra
    // (o limpia) el mensaje debajo al instante.
    const field = Array.isArray(formFields)
      ? formFields.find((f) => f.name === name)
      : null;
    const fieldError = field ? validateField(field, formattedValue) : null;
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  // Se llama al crear un cliente desde el modal en la factura: lo agrega a las
  // opciones y lo deja seleccionado, sin borrar lo ya diligenciado en la venta.
  const handleCustomerCreated = (customer) => {
    if (!customer?.id) return;

    // Se guarda aparte para que SIEMPRE esté en las opciones aunque se
    // recarguen (así no se pierde la selección).
    setCreatedCustomers((prev) => [
      { id: customer.id, name: customer.name },
      ...prev.filter((c) => String(c.id) !== String(customer.id)),
    ]);

    setFormData((prev) => ({ ...prev, customerId: customer.id }));
    setShowNewCustomer(false);
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

  // Producto sin variantes de color: una sola variante que solo lleva cantidad
  // (unidad o peso). Conserva el id de la variante existente al editar.
  const handleSingleQty = useCallback(
    (raw) => {
      const stock = Number(raw) || 0;
      setFormData((prev) => {
        const existing = (prev.variants || [])[0];
        return {
          ...prev,
          stock,
          variants: [
            {
              ...(existing?.id ? { id: existing.id } : {}),
              color: existing?.color || 'ÚNICO',
              stock,
            },
          ],
        };
      });
    },
    [setFormData]
  );

  const ALL_SOURCES = [
    'brands',
    'categories',
    'providers',
    'services',
    'customers',
  ];

  const fetchDynamicOptions = useCallback(async () => {
    if (!Array.isArray(formFields)) return;

    const loaders = {
      users: (params) =>
        getUsers({ ...params, status: 'ACTIVO', limit: 1000 }),
      locals: getLocals,
      providers: getProviders,
      categories: getCategories,
      brands: getBrands,
      customers: getCustomers,
      roles: async () => {
        const res = await getRoles();
        const data = Array.isArray(res) ? res : res?.data || [];
        const allowed = assignableRolesForType(company?.type);
        // Se ofrecen los roles de la vertical. El rol que ya trae el usuario
        // (al editar) se conserva aunque sea heredado, para no vaciar el select.
        const current = formData?.role;
        return data
          .filter((r) => allowed.includes(r.id) || r.id === current)
          .map((r) => ({ id: r.id, name: roleLabel(r.id, company) }));
      },
      status: getStatus,
      paymentMethod: getPaymentMethods,
      paymentStatus: getPaymentStatus,
      expenses: getTypeExpenses,
      expenseCategories: getExpenseCategories,
      unitsOfMeasure: getUnitsOfMeasure,
      customerSegments: getCustomerSegments,
      typeCompanies: getTypeCompanies,
      services: getServices,
      getUsersByRole: async () => {
        if (!formData.localId) return [];

        const res = await getUsersByRole({
          role: 'barbero',
          localId: formData.localId,
        });

        const data = Array.isArray(res) ? res : res.data || [];

        return data.map((item) => ({
          id: item.id,
          name: item.name,
        }));
      },

      getAvailability: async () => {
        if (
          !formData.localId ||
          !formData.serviceId ||
          !formData.date ||
          !formData.barberId
        ) {
          return [];
        }

        const res = await getAvailability({
          appointmentId: formData.id,
          localId: formData.localId,
          serviceId: formData.serviceId,
          barberId: formData.barberId,
          date: formData.date,
        });

        // Profesional de descanso ese día: una sola opción informativa (no
        // seleccionable como hora válida).
        if (res?.off) {
          return [
            {
              id: '',
              name: `🌙 De descanso ese día — ${res.reason || 'no atiende'}`,
            },
          ];
        }

        const data = res?.slots || (Array.isArray(res) ? res : res.data || []);

        return data.map((time) => ({
          id: time,
          name: time,
        }));
      },
    };

    const results = {};

    for (const field of formFields) {
      if (
        (field?.type === 'select' || field?.type === 'searchSelect') &&
        field.source &&
        loaders[field.source]
      ) {
        const fetcher = loaders[field.source];

        const params = ALL_SOURCES.includes(field.source) ? { all: true } : {};

        try {
          const response = await fetcher(params);

          const data = Array.isArray(response)
            ? response
            : response?.data || [];

          results[field.name] = data.map((item) => ({
            id: item.id,
            name:
              item.name ||
              `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim(),
          }));
        } catch (err) {
          // Si una fuente falla (p. ej. 403 por permisos), no debe dejar
          // vacíos los demás selects: se deja lista vacía y se continúa.
          console.error(`Error cargando opciones de "${field.source}":`, err);
          results[field.name] = [];
        }
      }
    }

    setDynamicOptions(results);

    // Valor por defecto de ciertos selects AL CREAR (ej: unidad = UNIDAD).
    if (!formData.id) {
      const patch = {};
      for (const field of formFields) {
        if (field.defaultOptionName && !formData[field.name]) {
          const opt = (results[field.name] || []).find(
            (o) =>
              String(o.name).toUpperCase() ===
              String(field.defaultOptionName).toUpperCase(),
          );
          if (opt) patch[field.name] = opt.id;
        }
      }
      if (Object.keys(patch).length) {
        setFormData((prev) => ({ ...prev, ...patch }));
      }
    }
  }, [
    formFields,
    formData.localId,
    formData.serviceId,
    formData.barberId,
    formData.date,
    getUsers,
    getLocals,
    getCustomers,
    getRoles,
    getStatus,
    getPaymentMethods,
    getPaymentStatus,
    getServices,
    getTypeExpenses,
    getTypeCompanies,
  ]);

  useEffect(() => {
    fetchDynamicOptions();
  }, [fetchDynamicOptions]);

  const hasDepartaCiudad = Array.isArray(formFields)
    ? formFields.some((f) => f.name === 'department' || f.name === 'city')
    : false;

  const isObject = (value) =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const onSubmit = (e) => {
    setHasSubmitted(true);
    if (
      module === 'sales' &&
      (!formData.items || formData.items.length === 0)
    ) {
      e.preventDefault();
      setProductError('Debes añadir productos');
      return;
    }

    const requiredSearchFields = formFields.filter(
      (f) => f.type === 'searchSelect' && f.required
    );

    for (const field of requiredSearchFields) {
      if (!formData[field.name]) {
        e.preventDefault();
        return;
      }
    }

    const validationErrors = validateForm(formFields, formData);
    if (Object.keys(validationErrors).length > 0) {
      e.preventDefault();
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    setProductError('');
    handleSubmit(e);
  };

  return (
    <form onSubmit={onSubmit}>
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

            // Ocultar condicionalmente según el estado del formulario.
            if (field.hideWhen && field.hideWhen(formData)) return null;

            const inputValue =
              type === 'datetime-local'
                ? normalizeDateTimeForInput(formData[name])
                : type === 'date'
                  ? normalizeDateForInput(formData[name])
                  : name === 'purchasePrice' ||
                    name === 'salePrice' ||
                    name === 'oldPrice' ||
                    name === 'amount' ||
                    name === 'price'
                  ? formatCOP(formData[name] || '')
                  : name === 'stock'
                    ? (formData[name] ?? 0)
                    : formData[name] || '';

            if (type === 'checkbox') {
              const checked = !!formData[name];
              return (
                <div key={name} className="col-span-full">
                  <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [name]: e.target.checked,
                        }))
                      }
                      className="mt-0.5 h-5 w-5 flex-none accent-orange-500 cursor-pointer"
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">
                        {label}
                      </span>
                      {field.helperText && (
                        <span className="text-xs text-gray-500">
                          {field.helperText}
                        </span>
                      )}
                    </span>
                  </label>
                </div>
              );
            }

            if (type === 'logo') {
              return (
                <div key={name} className="flex flex-col col-span-full">
                  <LogoUploader
                    label={label}
                    value={formData[name] || ''}
                    onChange={(url) =>
                      setFormData((prev) => ({ ...prev, [name]: url }))
                    }
                  />
                </div>
              );
            }

            if (type === 'colorSelect') {
              return (
                <div key={name} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>

                  {formData.variants?.some((v) => v.stock > 0) && (
                    <div className="flex -space-x-1 mb-2">
                      {formData.variants
                        .filter((v) => v.stock > 0)
                        .slice(0, 50)
                        .map((v) => {
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

            if (type === 'variantQty') {
              const isWeight = field.weight;
              const unit = formData.unit;
              const unitLabel = isWeight
                ? unit === 'LIBRA'
                  ? 'lb'
                  : unit === 'ARROBA'
                    ? '@'
                    : 'kg'
                : 'und';
              const current = (formData.variants || [])[0]?.stock ?? '';
              return (
                <div key={name} className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    {label} {isWeight ? `(${unitLabel})` : ''}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step={isWeight ? 0.001 : 1}
                      value={current}
                      disabled={isLocked}
                      onChange={(e) => handleSingleQty(e.target.value)}
                      placeholder={isWeight ? 'Ej: 12.5' : 'Ej: 20'}
                      className="w-40 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    <span className="text-sm font-medium text-gray-400">
                      {unitLabel}
                    </span>
                  </div>
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

                      if (value.length > 0) {
                        setProductError('');
                      }
                    }}
                    onTyping={() => {
                      if (productError) setProductError('');
                    }}
                  />

                  {productError && (
                    <p className="mt-2 text-sm text-red-600 font-medium">
                      {productError}
                    </p>
                  )}
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
                    name={name}
                    value={inputValue}
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

            if (type === 'searchSelect') {
              const isCustomerField = name === 'customerId';
              let fieldOptions = options || dynamicOptions[name] || [];
              if (isCustomerField && createdCustomers.length) {
                const existing = new Set(fieldOptions.map((o) => String(o.id)));
                fieldOptions = [
                  ...createdCustomers.filter((c) => !existing.has(String(c.id))),
                  ...fieldOptions,
                ];
              }
              return (
                <div key={name} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>

                  <SearchableSelect
                    label={`Seleccionar ${label.toLowerCase()}`}
                    name={name}
                    value={
                      isObject(formData[name])
                        ? (formData[name].id ?? '')
                        : (formData[name] ?? '')
                    }
                    options={fieldOptions}
                    onChange={handleChange}
                    disabled={isLocked || disabled}
                    placeholder={`Buscar ${label.toLowerCase()}...`}
                    required={required}
                  />

                  {isCustomerField && (
                    <button
                      type="button"
                      onClick={() => setShowNewCustomer(true)}
                      className="mt-2 self-start text-sm font-medium text-orange-600 hover:underline"
                    >
                      + Crear cliente nuevo
                    </button>
                  )}

                  {required && hasSubmitted && !formData[name] && (
                    <p className="mt-1 text-sm text-red-600 font-medium">
                      Este campo es obligatorio
                    </p>
                  )}

                  {isCustomerField && showNewCustomer && (
                    <NewCustomerModal
                      localId={formData.localId}
                      onClose={() => setShowNewCustomer(false)}
                      onCreated={handleCustomerCreated}
                    />
                  )}
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
                    value={inputValue}
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
                    {fieldOptions.map((opt, index) => (
                      <option
                        key={`${name}-${opt.id ?? index}`}
                        value={opt.id ?? ''}
                      >
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  {errors[name] && (
                    <p className="mt-1 text-sm font-medium text-red-600">
                      {errors[name]}
                    </p>
                  )}
                </div>
              );
            }

            if (type === 'password') {
              return (
                <div key={name} className="flex flex-col relative">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>

                  <input
                    type={showPassword ? 'text' : 'password'}
                    name={name}
                    value={inputValue}
                    onChange={handleChange}
                    disabled={isLocked || disabled}
                    placeholder={
                      mode === 'create'
                        ? 'Ingrese la contraseña'
                        : 'Dejar en blanco si no desea cambiarla'
                    }
                    required={mode === 'create'}
                    className={`w-full border border-gray-200 rounded-xl px-4 py-2 pr-10 text-sm shadow-sm focus:outline-none transition ${
                      isLocked || disabled
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
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
                  value={inputValue}
                  onChange={handleChange}
                  disabled={isLocked || disabled}
                  required={required}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none transition ${
                    isLocked || disabled
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                  }`}
                />
                {errors[name] && (
                  <p className="mt-1 text-sm font-medium text-red-600">
                    {errors[name]}
                  </p>
                )}
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
          <div className="col-span-full">
            <ImageUploader
              images={images}
              setImages={setImages}
              showImages={showImages}
              setShowImages={setShowImages}
            />
          </div>
        )}

        {module === 'services' && (
          <ServiceLocalsField
            value={formData.locals}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, locals: val }))
            }
          />
        )}
      </div>

      <div className="flex justify-end mt-6 gap-3">
        {module !== 'sales' && (
          <BtnReturn route={`/dashboard/${module}`} disabled={loading} />
        )}
        {mode !== 'edit' && handleReset && (
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm shadow-sm hover:bg-gray-50 transition cursor-pointer"
          >
            Limpiar
          </button>
        )}
        <BtnSave disabled={loading} module={module} />
      </div>
    </form>
  );
}
