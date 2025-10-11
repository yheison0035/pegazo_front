'use client';

import { useEffect, useState } from 'react';
import SideNavigation from '@/components/dashboard/sidenav/sidenav';
import RoleGuard from '@/auth/roleGuard';
import AlertMotivation from '@/components/dashboard/modals/alertMotivation';
import { useAuth } from '@/context/authContext';
import { Roles } from '@/config/roles';

export default function Layout({ children }) {
  const [showMotivation, setShowMotivation] = useState(false);
  const { usuario } = useAuth();

  useEffect(() => {
    if (usuario) {
      const hasSeen = localStorage.getItem('hasSeenMotivation');
      if (!hasSeen) {
        setShowMotivation(true);
        localStorage.setItem('hasSeenMotivation', 'true');
      }
    }
  }, [usuario]);

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
        <div className="w-full flex-none md:w-64">
          <SideNavigation />
        </div>
        <div className="grow p-6 md:overflow-y-auto md:p-12">{children}</div>
      </div>
      {showMotivation && (
        <AlertMotivation onClose={() => setShowMotivation(false)} />
      )}
    </RoleGuard>
  );
}
