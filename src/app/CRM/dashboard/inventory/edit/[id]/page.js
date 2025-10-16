'use client';

import { useState, useEffect, useCallback } from 'react';
import { redirect, useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import UsersForm from '@/components/dashboard/form/usersForm';
import useProducts from '@/lib/api/hooks/useProducts';

export default function EditInventory() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { getProductById, updateProduct, loading } = useProducts();

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getProductById(Number(id));
      setProduct(data);
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

  if (!product)
    return (
      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => redirect('/CRM/dashboard/inventory')}
        url={alert.url}
      />
    );

  return (
    <>
      <UsersForm
        mode="edit"
        loading={loading}
        initialData={product}
        onSubmit={(data) => updateProduct(Number(id), data)}
      />
    </>
  );
}
