'use client';

import { useState } from 'react';
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

export default function NewProduct() {
  const [formData, setFormData] = useState(getEmptyInventory());
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const [images, setImages] = useState([]);
  const [showImages, setShowImages] = useState(false);
  const { usuario } = useAuth();

  const { createProduct, uploadProductImages, loading } = useProducts();

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
        message: 'Debes agregar al menos un color con stock.',
      });
    }

    const invalidVariant = formData.variants.find(
      (v) => !v.color || !v.stock || v.stock <= 0
    );

    if (invalidVariant) {
      return setAlert({
        type: 'warning',
        message: 'Todas las variantes deben tener color y stock mayor a 0.',
      });
    }

    const payload = {
      ...formData,
      purchasePrice: parseCOPToNumber(formData.purchasePrice),
      salePrice: parseCOPToNumber(formData.salePrice),
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
        url: '/CRM/dashboard/inventory',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear producto',
      });
    }
  };

  return (
    <>
      <LoadingOverlay
        show={loading}
        text="Creando producto, por favor espera..."
      />
      <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Crear Producto Nuevo
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Ingrese la información del producto para registrar un nuevo producto.
        </p>

        <DinamicForm
          formData={formData}
          formFields={getFormFieldsInventory()}
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
      </div>
    </>
  );
}
