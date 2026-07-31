'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

import RoleGuard from '@/auth/roleGuard';
import { useAuth } from '@/context/authContext';

import Table from '@/components/dashboard/tables/table';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import ViewModal from '../../viewModal';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

import useColumnFilters from '@/components/dashboard/tables/hooks/useColumnFilters';
import { useDebounce } from '@/components/dashboard/tables/hooks/useDebounce';
import { getHeaderTableCompanies } from '@/lib/api/utils/companies.config';
import useCompanies from '@/lib/api/hooks/useCompanies';

export default function Companies() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const { getCompanies, deleteCompany, setCompanyStatus, loading } =
    useCompanies();

  const [companies, setCompanies] = useState([]);
  const [meta, setMeta] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({});

  const { filters, handleFilterChange } = useColumnFilters({
    name: '',
    status: '',
  });

  const debouncedFilters = useDebounce(filters, 400);

  const fetchCompanies = useCallback(async () => {
    const res = await getCompanies({
      page,
      limit,
      ...debouncedFilters,
    });

    setCompanies(res.data);
    setMeta(res.meta);
  }, [getCompanies, page, limit, debouncedFilters]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'esta empresa' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await deleteCompany(deleteTarget.id);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    fetchCompanies();
  };

  // Activar / desactivar empresa (suspensión por impago). Es reversible, pero
  // desactivar corta el acceso a todo el negocio, así que se confirma.
  const handleToggleStatus = async (company) => {
    const next = company.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    const ok = window.confirm(
      next === 'INACTIVO'
        ? `¿Desactivar "${company.name}"? Se cortará el acceso a todos sus usuarios (útil cuando no ha pagado).`
        : `¿Reactivar "${company.name}"? Sus usuarios podrán volver a ingresar.`
    );
    if (!ok) return;

    try {
      await setCompanyStatus(company.id, next);
      setAlert({
        type: 'success',
        message: next === 'ACTIVO' ? 'Empresa activada' : 'Empresa desactivada',
      });
      fetchCompanies();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'No se pudo cambiar el estado' });
    }
  };

  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
          <h1 className="text-2xl font-semibold">Empresas</h1>

          <Link
            href="/platform/companies/new"
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Crear empresa
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow relative">
          <LoadingOverlay show={loading} text="Cargando empresas..." />

          <Table
            header={getHeaderTableCompanies()}
            info={companies}
            view="companies"
            rol={usuario?.role}
            meta={meta}
            limit={limit}
            setPage={setPage}
            setLimit={setLimit}
            loading={loading}
            filters={filters}
            handleFilterChange={(name, value) => {
              setPage(1);
              handleFilterChange(name, value);
            }}
            setSelected={setSelectedCompany}
            handleDeleteClick={handleDeleteClick}
            handleToggleStatus={handleToggleStatus}
          />

          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              limit={limit}
              setPage={setPage}
              setLimit={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          )}
        </div>

        {selectedCompany && (
          <ViewModal
            data={selectedCompany}
            type="companies"
            onClose={() => setSelectedCompany(null)}
            viewModalConfig={viewModalConfigCompanies}
          />
        )}

        {showDeleteModal && (
          <ConfirmDeleteModal
            show={showDeleteModal}
            setShow={setShowDeleteModal}
            type={deleteTarget?.type}
            name={deleteTarget?.name}
            onConfirm={confirmDelete}
            loading={loading}
          />
        )}

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({})}
        />
      </div>
    </RoleGuard>
  );
}
