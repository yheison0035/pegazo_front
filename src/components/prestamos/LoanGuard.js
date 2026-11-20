'use client';

import RoleGuard from '@/auth/roleGuard';
import { useAuth } from '@/context/authContext';
import { effectiveModules } from '@/lib/appointmentsAccess';
import EmptyState from '@/components/ui/EmptyState';
import { LockClosedIcon } from '@heroicons/react/24/outline';

// Roles que operan el módulo de préstamos (el COBRADOR solo su cartera).
export const LOAN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR', 'ANALISTA', 'CAJA', 'COBRADOR', 'CONTADOR'];
export const LOAN_OWNER_ROLES = ['SUPER_ADMIN', 'ADMIN'];

// ¿La empresa tiene habilitado el módulo 'prestamos' (tipo / manual)?
export function hasLoansModule(usuario) {
  return effectiveModules(usuario).includes('prestamos');
}

// Guard de las páginas de préstamos: rol permitido Y módulo habilitado para la
// empresa. Así nadie entra por URL directa a un módulo que su tipo no tiene.
export default function LoanGuard({ roles = LOAN_ROLES, children }) {
  const { usuario } = useAuth();
  const enabled = hasLoansModule(usuario);
  return (
    <RoleGuard allowedRoles={roles}>
      {enabled ? (
        children
      ) : (
        <div className="p-6">
          <EmptyState
            icon={LockClosedIcon}
            title="El módulo de préstamos no está habilitado para tu negocio"
            subtitle="Este módulo es para empresas de créditos (tipo Financiera). Si lo necesitas, escríbenos para activarlo."
          />
        </div>
      )}
    </RoleGuard>
  );
}
