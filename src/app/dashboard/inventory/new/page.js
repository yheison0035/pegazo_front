'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AlertModal from '@/components/dashboard/modals/alertModal';
import { useAuth } from '@/context/authContext';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import {
  getEmptyInventory,
  getFormFieldsInventory,
} from '@/lib/api/utils/inventory.config';
import useProducts from '@/lib/api/hooks/useProducts';
import { parseCOPToNumber } from '@/lib/api/utils/utils';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Button from '@/components/ui/Button';
import InventorySpecsModal from '@/components/dashboard/inventory/inventorySpecsModal';
import {
  PlusIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { canSeeOldPrice } from '@/hooks/inventory.permissions';
import { getCategories } from '@/lib/api/routes/categories';
import { getBrands } from '@/lib/api/routes/brands';
import { getProviders } from '@/lib/api/routes/providers';
import { getLocals } from '@/lib/api/routes/locals';
import { getProductFields } from '@/config/verticalProfiles';

export default function NewProduct() {
  const [formData, setFormData] = useState(getEmptyInventory());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const [images, setImages] = useState([]);
  const [showImages, setShowImages] = useState(false);
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [deps, setDeps] = useState({ loading: true, missing: [] });
  const auth = useAuth();
  const usuario = auth?.usuario;
  const showOldPrice = canSeeOldPrice(usuario);

  // En verticales por peso (carnicería, fruver, súper) el producto arranca en kg.
  useEffect(() => {
    if (getProductFields(usuario?.company?.type).variantType === 'weight') {
      setFormData((prev) =>
        prev.unit === 'UNIDAD' ? { ...prev, unit: 'KG' } : prev
      );
    }
  }, [usuario]);

  const { createProduct, uploadProductImages, loading } = useProducts();

  // Precheck: antes de dejar llenar el formulario, verifica que la empresa ya
  // tenga sedes, categorías, marcas y proveedores. Si falta algo, se avisa con
  // enlaces directos para crearlos y no obligar a devolverse a mitad de camino.
  const checkDependencies = async () => {
    setDeps((d) => ({ ...d, loading: true }));
    try {
      const [locs, cats, brs, provs] = await Promise.all([
        getLocals({ all: true }),
        getCategories({ all: true }),
        getBrands({ all: true }),
        getProviders({ all: true }),
      ]);
      const pf = getProductFields(usuario?.company?.type);
      const missing = [];
      if (!locs?.data?.length)
        missing.push({ label: 'Sedes / locales', href: '/dashboard/locals/new' });
      if (!cats?.data?.length)
        missing.push({ label: 'Categorías', href: '/dashboard/categories/new' });
      if (pf.brand && !brs?.data?.length)
        missing.push({ label: 'Marcas', href: '/dashboard/brands/new' });
      if (pf.provider && !provs?.data?.length)
        missing.push({ label: 'Proveedores', href: '/dashboard/providers/new' });
      setDeps({ loading: false, missing });
    } catch {
      // Si el chequeo falla (red/permiso), no bloqueamos: se muestra el form.
      setDeps({ loading: false, missing: [] });
    }
  };

  useEffect(() => {
    checkDependencies();
  }, []);

  const handleReset = () => {
    setFormData(getEmptyInventory());
    setImages([]);
    setShowImages(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.variants || formData.variants.length === 0) {
      return setAlert({
        type: 'warning',
        message: 'Debes indicar la cantidad del producto.',
      });
    }

    if (showOldPrice) {
      if (
        !formData.features ||
        (formData.features.length === 0 && !formData.specifications) ||
        formData.specifications.length === 0
      ) {
        return setAlert({
          type: 'warning',
          message: 'Debes incluirle sus caracteristicas y especificaciones.',
        });
      }
    }

    const invalidVariant = formData.variants.find(
      (v) => !v.color || !v.stock || v.stock <= 0
    );

    if (invalidVariant) {
      return setAlert({
        type: 'warning',
        message: 'La cantidad debe ser mayor a 0.',
      });
    }

    const payload = {
      ...formData,
      purchasePrice: parseCOPToNumber(formData.purchasePrice),
      salePrice: parseCOPToNumber(formData.salePrice),
      oldPrice: parseCOPToNumber(formData.oldPrice),
    };

    try {
      const response = await createProduct(payload);
      const productId = response?.data?.id;

      if (!productId) {
        throw new Error('No se pudo obtener el ID del producto');
      }

      await uploadProductImages(productId, images);

      setAlert({
        type: 'success',
        message: 'Producto creado correctamente.',
        url: '/dashboard/inventory',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear producto',
      });
    }
  };

  const canOpenSpecsModal = () => {
    if (!formData.name || !formData.salePrice) {
      setAlert({
        type: 'warning',
        message:
          'Completa todos los campos para incluirle sus caracteristicas y especificaciones.',
      });
      return;
    }
    setShowSpecsModal(true);
  };

  // Mientras verifica las dependencias.
  if (deps.loading) {
    return (
      <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
        <p className="text-sm text-gray-500">Verificando requisitos previos...</p>
      </div>
    );
  }

  // Faltan requisitos: se avisa con enlaces para crearlos antes de continuar.
  if (deps.missing.length > 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">
          Antes de crear un producto
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Para registrar productos primero necesitas tener esto creado. Así no
          tendrás que devolverte a mitad del formulario.
        </p>

        <div className="mt-6 space-y-3">
          {deps.missing.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 transition hover:border-orange-400"
            >
              <span className="font-medium text-gray-800">
                Registra tus <span className="text-orange-600">{m.label}</span>
              </span>
              <ArrowRightIcon className="h-5 w-5 text-orange-600" />
            </Link>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="primary"
            type="button"
            onClick={checkDependencies}
          >
            Ya los creé, reintentar
          </Button>
          <Button
            variant="secondary"
            icon={ArrowLeftIcon}
            href="/dashboard/inventory"
          >
            Volver al inventario
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay
        show={loading}
        text="Creando producto, por favor espera..."
      />
      <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Crear Producto Nuevo
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Ingrese la información del producto para registrar un nuevo
              producto.
            </p>
          </div>
          {showOldPrice && (
            <Button
              variant="add"
              icon={PlusIcon}
              type="button"
              onClick={canOpenSpecsModal}
            >
              Características y especificaciones
            </Button>
          )}
        </div>

        <DinamicForm
          formData={formData}
          formFields={getFormFieldsInventory(usuario)}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          handleReset={handleReset}
          loading={loading}
          mode="new"
          usuario={usuario}
          module="inventory"
          images={images}
          setImages={setImages}
          showImages={showImages}
          setShowImages={setShowImages}
        />

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '', url: '' })}
          url={alert.url}
        />

        <InventorySpecsModal
          open={showSpecsModal}
          onClose={() => setShowSpecsModal(false)}
          formData={formData}
          setFormData={setFormData}
        />
      </div>
    </>
  );
}
