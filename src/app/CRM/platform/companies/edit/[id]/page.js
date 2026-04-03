'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/dashboard/modals/alertModal';
import DinamicForm from '@/components/dashboard/form/DinamicForm';
import { useAuth } from '@/context/authContext';
import useCompanies from '@/lib/api/hooks/useCompanies';
import { getFormFieldsCompanies } from '@/lib/api/utils/companies.config';

export default function EditCompany() {
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const { id } = useParams();
  const { usuario } = useAuth();
  const { getCompanyById, updateCompany, loading } = useCompanies();

  const fetchCompany = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await getCompanyById(Number(id));
      setFormData(data);
    } catch (err) {
      setAlert({
        type: 'warning',
        message: err.message || 'No tienes permisos',
        url: '/CRM/platform/companies',
      });
    }
  }, [getCompanyById, id]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCompany(id, formData);
      setAlert({
        type: 'success',
        message: 'Empresa actualizada correctamente.',
        url: '/CRM/platform/companies',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al crear empresa',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Editar Empresa</h2>
      <p className="text-sm text-gray-500 mb-6">
        Modifica la información de la empresa según sea necesario.
      </p>

      <DinamicForm
        formData={formData}
        formFields={getFormFieldsCompanies()}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        loading={loading}
        mode="edit"
        usuario={usuario}
        module="locals"
      />

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '', url: '' })}
        url={alert.url}
      />
    </div>
  );
}
