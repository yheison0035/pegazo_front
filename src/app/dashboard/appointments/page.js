'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon,
  CalendarDaysIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import AppointmentsCalendar from '@/components/dashboard/appointments/AppointmentsCalendar';
import Button from '@/components/ui/Button';

import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import useTerms from '@/hooks/useTerms';

import Table from '@/components/dashboard/tables/table';
import Pagination from '@/components/dashboard/tables/segments/pagination';
import ViewModal from '../../viewModal';
import ConfirmDeleteModal from '@/components/dashboard/tables/segments/confirmDeleteModal';
import AlertModal from '@/components/dashboard/modals/alertModal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

import {
  getHeaderTableAppointments,
  viewModalConfig,
} from '@/lib/api/utils/appointments.config';

import useColumnFilters from '@/components/dashboard/tables/hooks/useColumnFilters';
import { useDebounce } from '@/components/dashboard/tables/hooks/useDebounce';
import useAppointments from '@/lib/api/hooks/useAppointments';

export default function Appointments() {
  const { getAppointments, deleteAppointment, loading } = useAppointments();

  const [appointments, setAppointments] = useState([]);
  const [meta, setMeta] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [view, setView] = useState('calendar'); // 'calendar' | 'list'

  const [selectedAppointments, setSelectedAppointments] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert, setAlert] = useState({});
  const auth = useAuth();
  const t = useTerms();
  const usuario = auth?.usuario;

  const { filters, handleFilterChange } = useColumnFilters({
    name: '',
    address: '',
    city: '',
    managerId: '',
    phone: '',
    status: '',
  });

  const debouncedFilters = useDebounce(filters, 400);

  const fetchAppointments = useCallback(async () => {
    const res = await getAppointments({
      page,
      limit,
      ...debouncedFilters,
    });

    setAppointments(res.data);
    setMeta(res.meta);
  }, [getAppointments, page, limit, debouncedFilters]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name, type: 'esta cita' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await deleteAppointment(deleteTarget.id);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    fetchAppointments();
  };

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
          <h1 className="text-2xl font-semibold">
            {['BARBERO', 'PROFESIONAL'].includes(usuario?.role)
              ? 'Mis citas'
              : 'Listado de Citas'}
          </h1>

          <div className="flex items-center gap-3">
            {/* Switch Calendario / Lista */}
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5">
              <button
                onClick={() => setView('calendar')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  view === 'calendar'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <CalendarDaysIcon className="h-4 w-4" /> Calendario
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  view === 'list'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ListBulletIcon className="h-4 w-4" /> Lista
              </button>
            </div>

            {/* El barbero solo visualiza: no puede crear citas. */}
            {!['BARBERO', 'PROFESIONAL'].includes(usuario?.role) && (
              <Button
                variant="add"
                icon={PlusIcon}
                href="/dashboard/appointments/new"
              >
                Agregar cita
              </Button>
            )}
          </div>
        </div>

        {view === 'calendar' && <AppointmentsCalendar />}

        {view === 'list' && (
        <div className="bg-white rounded-lg shadow relative">
          <LoadingOverlay show={loading} text="Cargando citas..." />

          <Table
            header={getHeaderTableAppointments(t)}
            info={appointments}
            view="appointments"
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
            setSelected={setSelectedAppointments}
            handleDeleteClick={handleDeleteClick}
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
        )}

        {selectedAppointments && (
          <ViewModal
            data={selectedAppointments}
            type="appointments"
            onClose={() => setSelectedAppointments(null)}
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
      </div>
    </RoleGuard>
  );
}
