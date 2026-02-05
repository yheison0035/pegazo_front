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
import InventorySpecsModal from '@/components/dashboard/inventory/inventorySpecsModal';
import { PencilIcon } from '@heroicons/react/24/outline';
import { canSeeOldPrice } from '@/hooks/inventory.permissions';

export default function EditProduct() {
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const [images, setImages] = useState([]);
  const [showImages, setShowImages] = useState(false);
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const { id } = useParams();
  const { usuario } = useAuth();
  const showOldPrice = canSeeOldPrice(usuario);

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
      oldPrice: parseCOPToNumber(formData.oldPrice),
    };

    try {
      const response = await updateProduct(id, payload);
      const productId = response?.data?.id;

      if (!productId) {
        throw new Error('No se pudo obtener el ID del producto');
      }

      await uploadProductImages(productId, images);

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

  const canOpenSpecsModal = () => {
    setShowSpecsModal(true);
  };

  return (
    <>
      <LoadingOverlay
        show={loading}
        text="Cargando producto, por favor espera..."
      />
      <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Editar Producto
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Modifica la información del producto según sea necesario.
            </p>
          </div>
          {showOldPrice && (
            <button
              type="button"
              onClick={canOpenSpecsModal}
              className="flex items-center gap-2 cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              <PencilIcon className="w-4 h-4" />
              Características y especificaciones
            </button>
          )}
        </div>

        <DinamicForm
          formData={formData}
          formFields={getFormFieldsInventory(usuario)}
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
