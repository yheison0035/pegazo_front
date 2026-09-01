'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import { useAuth } from '@/context/authContext';
import useProducts from '@/lib/api/hooks/useProducts';
import {
  getFormFieldsInventory,
  validateProductVariants,
} from '@/lib/api/utils/inventory.config';
import { parseCOPToNumber } from '@/lib/api/utils/utils';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Button from '@/components/ui/Button';
import InventorySpecsModal from '@/components/dashboard/inventory/inventorySpecsModal';
import RecipeModal from '@/components/dashboard/inventory/recipeModal';
import { PencilIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { canSeeOldPrice } from '@/hooks/inventory.permissions';
import { isFoodBusiness } from '@/lib/appointmentsAccess';

export default function EditProduct() {
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const [images, setImages] = useState([]);
  const [showImages, setShowImages] = useState(false);
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const { id } = useParams();
  const auth = useAuth();
  const usuario = auth?.usuario;
  const showOldPrice = canSeeOldPrice(usuario);
  // La receta solo aplica a platos elaborados (sin stock) en verticales de comida.
  const isFood = isFoodBusiness(usuario);
  const showRecipe = isFood && formData?.trackStock === false;

  const { getProductById, updateProduct, uploadProductImages, loading } =
    useProducts();

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getProductById(Number(id));
      // Precarga el "precio de compra total" = unitario × cantidad, para que el
      // dueño lo vea (el auto-cálculo lo mantiene sincronizado al editar).
      const qty = Array.isArray(data?.variants)
        ? data.variants.reduce((a, v) => a + (Number(v.stock) || 0), 0)
        : 0;
      const unit = Number(data?.purchasePrice) || 0;
      setFormData({
        ...data,
        purchaseTotal: qty > 0 && unit ? Math.round(unit * qty) : '',
      });
      setImages(data.images || []);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/dashboard/inventory',
      });
    }
  }, [getProductById, id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Los elaborados sin control de stock (platos) no exigen cantidad/color.
    const noStock = formData.trackStock === false;
    if (!noStock) {
      const check = validateProductVariants(formData.variants, usuario);
      if (!check.ok) {
        return setAlert({ type: 'warning', message: check.message });
      }
    }

    // Enviamos SOLO los campos que el backend acepta. El producto cargado trae
    // extras (id, companyId, taxRate, relaciones, fechas…) que la validación
    // rechaza; por eso armamos un payload limpio en vez de reenviar todo.
    const numOrUndef = (v) =>
      v === '' || v === null || v === undefined ? undefined : Number(v);

    const payload = {
      name: formData.name,
      barcode: formData.barcode || undefined,
      description: formData.description ?? undefined,
      purchasePrice: parseCOPToNumber(formData.purchasePrice) || 0,
      salePrice: parseCOPToNumber(formData.salePrice) ?? undefined,
      oldPrice: parseCOPToNumber(formData.oldPrice) ?? undefined,
      minStock: numOrUndef(formData.minStock),
      unit: formData.unit || undefined,
      trackStock: formData.trackStock,
      expiryDate: formData.expiryDate || undefined,
      lot: formData.lot || undefined,
      status: formData.status || undefined,
      localId: numOrUndef(formData.localId),
      providerId: numOrUndef(formData.providerId),
      categoryId: numOrUndef(formData.categoryId),
      brandId: numOrUndef(formData.brandId),
      variants: (formData.variants || []).map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        color: String(v.color || '').trim() || 'ÚNICO',
        ...(v.size ? { size: v.size } : {}),
        stock: Number(v.stock) || 0,
      })),
      features: (formData.features || []).map((f) => ({
        title: f.title,
        ...(f.order != null ? { order: f.order } : {}),
      })),
      specifications: (formData.specifications || []).map((s) => ({
        key: s.key,
        value: s.value,
        ...(s.order != null ? { order: s.order } : {}),
      })),
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
        url: '/dashboard/inventory',
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
          <div className="flex flex-wrap gap-2">
            {showRecipe && (
              <Button
                variant="add"
                icon={BeakerIcon}
                type="button"
                onClick={() => setShowRecipeModal(true)}
              >
                Receta (insumos)
              </Button>
            )}
            {showOldPrice && (
              <Button
                variant="add"
                icon={PencilIcon}
                type="button"
                onClick={canOpenSpecsModal}
              >
                Características y especificaciones
              </Button>
            )}
          </div>
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

        <RecipeModal
          open={showRecipeModal}
          onClose={() => setShowRecipeModal(false)}
          inventoryId={id}
          dishName={formData?.name}
        />
      </div>
    </>
  );
}
