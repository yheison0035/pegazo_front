'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

import RoleGuard from '@/auth/roleGuard';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/authContext';

import Table from '@/components/dashboard/tables/table';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import ViewModal from '../../viewModal';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import AlertModal from '@/components/dashboard/modals/alertModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

import useColumnFilters from '@/components/dashboard/tables/hooks/useColumnFilters';
import { useDebounce } from '@/components/dashboard/tables/hooks/useDebounce';
import {
  getHeaderTableCompanies,
  viewModalConfig,
} from '@/lib/api/utils/companies.config';
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
  const [statusTarget, setStatusTarget] = useState(null);

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
  // Abre el diálogo de confirmación (activar/desactivar empresa).
  const handleToggleStatus = (company) => setStatusTarget(company);

  const confirmToggle = async () => {
    const company = statusTarget;
    const next = company.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await setCompanyStatus(company.id, next);
      setStatusTarget(null);
      setAlert({
        type: 'success',
        message: next === 'ACTIVO' ? 'Empresa activada' : 'Empresa desactivada',
      });
      fetchCompanies();
    } catch (err) {
      setStatusTarget(null);
      setAlert({ type: 'error', message: err.message || 'No se pudo cambiar el estado' });
    }
  };

  return (
    <RoleGuard allowedRoles={['SUPER_PLATFORM_ADMIN']}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
          <h1 className="text-2xl font-semibold">Empresas</h1>

          <Button variant="add" icon={PlusIcon} href="/platform/companies/new">
            Crear empresa
          </Button>
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
            viewModalConfig={viewModalConfig}
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

        <ConfirmModal
          open={!!statusTarget}
          title={
            statusTarget?.status === 'ACTIVO'
              ? '¿Desactivar empresa?'
              : '¿Reactivar empresa?'
          }
          message={
            statusTarget
              ? statusTarget.status === 'ACTIVO'
                ? `Se cortará el acceso a todos los usuarios de "${statusTarget.name}" (útil cuando no ha pagado).`
                : `Los usuarios de "${statusTarget.name}" podrán volver a ingresar.`
              : ''
          }
          confirmText={
            statusTarget?.status === 'ACTIVO' ? 'Desactivar' : 'Reactivar'
          }
          tone={statusTarget?.status === 'ACTIVO' ? 'danger' : 'primary'}
          onConfirm={confirmToggle}
          onCancel={() => setStatusTarget(null)}
        />
      </div>
    </RoleGuard>
  );
}
