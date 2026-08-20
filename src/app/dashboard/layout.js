'use client';

import SideNavigation from '@/components/dashboard/sidenav/sidenav';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import PlanUpgradeModal from '@/components/plan/PlanUpgradeModal';
import AppointmentsHub from '@/components/appointments/AppointmentsHub';

export default function Layout({ children }) {
  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
        {/* El sidebar vive fijo y colapsado (solo iconos); aquí reservamos el
            ancho del rail para que el contenido ocupe el resto. Al hacer hover
            el menú se expande por encima sin mover el contenido. */}
        <div className="w-full flex-none md:w-20">
          <SideNavigation />
        </div>
        <div className="grow p-6 pt-16 md:overflow-y-auto md:p-10 md:pt-10">
          {children}
        </div>
      </div>
      <PlanUpgradeModal />
      <AppointmentsHub />
    </RoleGuard>
  );
}
