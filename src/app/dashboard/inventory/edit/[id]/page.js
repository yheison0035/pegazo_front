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
import { createStockRequest } from '@/lib/api/routes/stock-requests';

// Solo el dueño y el administrador pueden BAJAR stock directamente. Los demás
// roles solo pueden subir; para disminuir deben solicitarlo (con motivo) y el
// dueño/admin aprueba o rechaza. Aplica a todos los tipos de negocio.
const CAN_DECREASE_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export default function EditProduct() {
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const [images, setImages] = useState([]);
  const [showImages, setShowImages] = useState(false);
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  // Stock original por variante (para detectar disminuciones al guardar).
  const [originalStock, setOriginalStock] = useState({});
  // Modal de solicitud de disminución: guarda el payload y las líneas a pedir.
  const [decreaseReq, setDecreaseReq] = useState({
    open: false,
    reason: '',
    payload: null,
    lines: [],
    submitting: false,
  });
  const { id } = useParams();
  const auth = useAuth();
  const usuario = auth?.usuario;
  const canDecrease = CAN_DECREASE_ROLES.includes(usuario?.role);
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
      // Guardamos el stock original de cada variante para comparar al guardar.
      const map = {};
      (data?.variants || []).forEach((v) => {
        if (v.id != null) map[v.id] = Number(v.stock) || 0;
      });
      setOriginalStock(map);
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

    // Detecta variantes cuyo stock DISMINUYE respecto al original.
    const decreaseLines = (payload.variants || [])
      .filter((v) => v.id != null && originalStock[v.id] != null)
      .filter((v) => Number(v.stock) < Number(originalStock[v.id]))
      .map((v) => ({ variantId: v.id, requestedStock: Number(v.stock) }));

    // Si quien edita NO puede bajar stock y está intentando disminuir, no se
    // guarda la baja: se abre el modal para pedir el motivo y crear la solicitud.
    if (!canDecrease && decreaseLines.length > 0) {
      setDecreaseReq({
        open: true,
        reason: '',
        payload,
        lines: decreaseLines,
        submitting: false,
      });
      return;
    }

    await handleSubmitSafe(payload);
  };

  // Guarda el producto (y sube imágenes). Reutilizable desde el flujo normal y
  // desde el modal de solicitud de disminución.
  const doSave = async (payload, { silent = false } = {}) => {
    const response = await updateProduct(id, payload);
    const productId = response?.data?.id;
    if (!productId) throw new Error('No se pudo obtener el ID del producto');
    await uploadProductImages(productId, images);
    if (!silent) {
      setAlert({
        type: 'success',
        message: 'Producto actualizado correctamente.',
        url: '/dashboard/inventory',
      });
    }
    return productId;
  };

  const handleSubmitSafe = async (payload) => {
    try {
      await doSave(payload);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al actualizar producto',
      });
    }
  };

  // Confirma la solicitud de disminución: guarda los cambios permitidos
  // (aumentos y otros campos; el backend NO baja el stock) y crea la solicitud
  // con el motivo para que el dueño/admin la apruebe o rechace.
  const submitDecreaseRequest = async () => {
    const reason = decreaseReq.reason.trim();
    if (reason.length < 3) return;
    setDecreaseReq((s) => ({ ...s, submitting: true }));
    try {
      // 1) Guarda el resto de cambios (el backend conserva el stock actual).
      await doSave(decreaseReq.payload, { silent: true });
      // 2) Crea la solicitud de disminución.
      await createStockRequest({
        inventoryId: Number(id),
        reason,
        lines: decreaseReq.lines,
      });
      setDecreaseReq({
        open: false,
        reason: '',
        payload: null,
        lines: [],
        submitting: false,
      });
      setAlert({
        type: 'success',
        message:
          'Solicitud de disminución enviada. El dueño o administrador debe aprobarla.',
        url: '/dashboard/inventory',
      });
    } catch (err) {
      setDecreaseReq((s) => ({ ...s, submitting: false }));
      setAlert({
        type: 'error',
        message: err.message || 'No se pudo enviar la solicitud',
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

        {decreaseReq.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
              <div className="rounded-t-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                <h3 className="text-lg font-bold text-white">
                  Solicitar disminución de stock
                </h3>
                <p className="text-sm text-white/90">
                  No tienes permiso para bajar stock. Explica el motivo y el
                  dueño o administrador lo aprobará o rechazará.
                </p>
              </div>
              <div className="space-y-4 px-6 py-5">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
                  <p className="mb-2 font-semibold text-gray-700">
                    Cambios solicitados
                  </p>
                  <ul className="space-y-1">
                    {decreaseReq.lines.map((l) => {
                      const orig = Number(originalStock[l.variantId]) || 0;
                      const vv = (formData.variants || []).find(
                        (x) => x.id === l.variantId,
                      );
                      const label =
                        [vv?.color, vv?.size].filter(Boolean).join(' / ') ||
                        `Variante #${l.variantId}`;
                      return (
                        <li
                          key={l.variantId}
                          className="flex items-center justify-between text-gray-600"
                        >
                          <span>{label}</span>
                          <span className="font-medium">
                            {orig} → {l.requestedStock}{' '}
                            <span className="text-red-500">
                              ({l.requestedStock - orig})
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Motivo de la disminución{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={decreaseReq.reason}
                    onChange={(e) =>
                      setDecreaseReq((s) => ({ ...s, reason: e.target.value }))
                    }
                    placeholder="Ej: producto vencido, avería, ajuste por conteo físico…"
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 rounded-b-2xl border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() =>
                    setDecreaseReq({
                      open: false,
                      reason: '',
                      payload: null,
                      lines: [],
                      submitting: false,
                    })
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={
                    decreaseReq.reason.trim().length < 3 || decreaseReq.submitting
                  }
                  onClick={submitDecreaseRequest}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {decreaseReq.submitting ? 'Enviando…' : 'Enviar solicitud'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
