'use client';

import SideNavigation from '@/components/dashboard/sidenav/sidenav';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';

export default function Layout({ children }) {
  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
        {/* Rail colapsado: reservamos solo su ancho; se expande al hover. */}
        <div className="w-full flex-none md:w-20">
          <SideNavigation />
        </div>
        <div className="grow p-6 pt-16 md:overflow-y-auto md:p-10 md:pt-10">
          {children}
        </div>
      </div>
    </RoleGuard>
  );
}
