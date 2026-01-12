'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import { useAuth } from '@/context/authContext';
import useProducts from '@/lib/api/hooks/useProducts';
import { getFormFieldsInventory } from '@/lib/api/utils/inventory.config';
import { parseCOPToNumber } from '@/lib/api/utils/utils';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

export default function EditProduct() {
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const [images, setImages] = useState([]);
  const [showImages, setShowImages] = useState(false);
  const { id } = useParams();
  const { usuario } = useAuth();

  const { getProductById, updateProduct, uploadProductImages, loading } =
    useProducts();

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getProductById(Number(id));
      setFormData(data);
      setImages(data.images || []);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/CRM/dashboard/inventory',
      });
    }
  }, [getProductById, id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.variants || formData.variants.length === 0) {
      return setAlert({
        type: 'warning',
        message: 'Debes mantener al menos un color con stock.',
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
      const response = await updateProduct(id, payload);
      const productId = response?.data?.id;

      if (!productId) {
        throw new Error('No se pudo obtener el ID del producto');
      }

      const hasNewImages = images.some((img) => img.file);
      const hasRemovedImages = images.some((img) => img._removed);

      if (hasNewImages || hasRemovedImages) {
        await uploadProductImages(productId, images);
      }

      setAlert({
        type: 'success',
        message: 'Producto actualizado correctamente.',
        url: '/CRM/dashboard/inventory',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al actualizar producto',
      });
    }
  };

  return (
    <>
      <LoadingOverlay
        show={loading}
        text="Actualizando producto, por favor espera..."
      />
      <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Editar Producto
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Modifica la información del producto según sea necesario.
        </p>

        <DinamicForm
          formData={formData}
          formFields={getFormFieldsInventory()}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          loading={loading}
          mode="edit"
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
