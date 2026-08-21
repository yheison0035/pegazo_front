'use client';

import SideNavigation from '@/components/dashboard/sidenav/sidenav';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import PlanUpgradeModal from '@/components/plan/PlanUpgradeModal';
import AppointmentsHub from '@/components/appointments/AppointmentsHub';
import { useAuth } from '@/context/authContext';

export default function Layout({ children }) {
  const { usuario } = useAuth();
  // El tema de diseño se aplica SOLO al panel (este contenedor), no al <html>,
  // para que el login y las páginas públicas queden siempre en el tema por
  // defecto. Los overrides de color en globals.css usan [data-crm-theme].
  const theme = usuario?.company?.crmTheme || 'orange';

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div data-crm-theme={theme}>
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
      </div>
    </RoleGuard>
  );
}
