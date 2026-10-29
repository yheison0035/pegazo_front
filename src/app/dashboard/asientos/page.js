'use client';

import { useCallback, useMemo, useState } from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import AlertModal from '@/components/dashboard/modals/alertModal';
import JournalEntriesPanel from '@/components/accounting/JournalEntriesPanel';
import {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  importEntries,
  uploadAccountingDoc,
} from '@/lib/api/routes/accounting';
import { getLedgerAccounts } from '@/lib/api/routes/ledgerAccounts';
import { updateBooksClose } from '@/lib/api/routes/company';

// Contabilidad · Asientos manuales de la empresa (dueño, admin o contador
// interno): registrar, editar, importar/exportar Excel, saldos iniciales,
// nómina y cierre de periodo. Misma herramienta que usa el contador externo
// en su portal.
export default function AsientosPage() {
  const auth = useAuth();
  const usuario = auth?.usuario;
  const setUsuario = auth?.setUsuario;
  const [alert, setAlert] = useState({});

  const api = useMemo(
    () => ({
      listEntries: getEntries,
      createEntry,
      updateEntry,
      deleteEntry,
      importEntries,
      uploadDoc: uploadAccountingDoc,
      getAccounts: getLedgerAccounts,
      setClose: updateBooksClose,
    }),
    [],
  );

  const onCloseChange = useCallback(
    (until) => {
      if (setUsuario && usuario) {
        const merged = {
          ...usuario,
          company: { ...usuario.company, booksClosedUntil: until || null },
        };
        setUsuario(merged);
        try {
          localStorage.setItem('usuario', JSON.stringify(merged));
        } catch {
          /* noop */
        }
      }
    },
    [setUsuario, usuario],
  );

  return (
    <RoleGuard allowedRoles={[Roles.SUPER_ADMIN, Roles.ADMIN, Roles.CONTADOR]}>
      <div className="relative mx-auto w-full max-w-5xl p-4">
        <div className="mb-4">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
            <PencilSquareIcon className="h-6 w-6 text-orange-500" /> Asientos contables
          </h1>
          <p className="text-sm text-gray-500">
            Lo que no sale de tus ventas, compras y gastos se registra aquí: ajustes,
            saldos iniciales, nómina, préstamos… Todo entra a los libros y a los estados financieros.
          </p>
        </div>

        <JournalEntriesPanel
          api={api}
          companyName={usuario?.company?.name || ''}
          booksClosedUntil={usuario?.company?.booksClosedUntil || null}
          onCloseChange={onCloseChange}
          onError={(message) => setAlert({ type: 'error', message })}
        />

        <AlertModal type={alert.type} message={alert.message} onClose={() => setAlert({})} />
      </div>
    </RoleGuard>
  );
}
