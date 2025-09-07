"use client";

import { useEffect, useState } from "react";
import SideNavigation from "@/components/dashboard/sidenav/sidenav";
import RoleGuard from "@/components/auth/roleGuard";
import AlertMotivation from "@/components/dashboard/modals/alertMotivation";
import { useAuth } from "@/context/authContext";

export default function Layout({ children }) {
  const [showMotivation, setShowMotivation] = useState(false);
  const { usuario } = useAuth();

  useEffect(() => {
    if (usuario) {
      const hasSeen = localStorage.getItem("hasSeenMotivation");
      if (!hasSeen) {
        setShowMotivation(false);
        localStorage.setItem("hasSeenMotivation", "true");
      }
    }
  }, [usuario]);

  return (
    <RoleGuard allowedRoles={["Administrador", "Asesor"]}>
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
