'use client';

import { useEffect, useState } from 'react';
import SideNavigation from '@/components/dashboard/sidenav/sidenav';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import PlanUpgradeModal from '@/components/plan/PlanUpgradeModal';
import AppointmentsHub from '@/components/appointments/AppointmentsHub';
import BankDepositNotifier from '@/components/bank/BankDepositNotifier';
import SplashScreen from '@/components/pwa/SplashScreen';
import PushRegister from '@/components/pwa/PushRegister';
import { useAuth } from '@/context/authContext';
import DayBanner from '@/components/pos/DayBanner';
import RenewalBanner from '@/components/billing/RenewalBanner';
import { isDark, DARK_EVENT } from '@/lib/darkMode';

export default function Layout({ children }) {
  const { usuario } = useAuth();
  // El tema de diseño se aplica SOLO al panel (este contenedor), no al <html>,
  // para que el login y las páginas públicas queden siempre en el tema por
  // defecto. Los overrides de color en globals.css usan [data-crm-theme].
  const theme = usuario?.company?.crmTheme || 'orange';
  // Logo del negocio como marca de agua sutil de fondo en cada módulo.
  const logo = usuario?.company?.logo;

  // Modo oscuro (preferencia personal por dispositivo). Se aplica con
  // data-theme="dark" solo a este contenedor del panel.
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const sync = () => setDark(isDark());
    sync();
    window.addEventListener(DARK_EVENT, sync);
    return () => window.removeEventListener(DARK_EVENT, sync);
  }, []);

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <SplashScreen />
      <div data-crm-theme={theme} data-theme={dark ? 'dark' : undefined}>
        <div className="flex h-screen flex-col bg-gray-50 md:flex-row md:overflow-hidden">
          {/* El sidebar vive fijo y colapsado (solo iconos); aquí reservamos el
              ancho del rail para que el contenido ocupe el resto. Al hacer hover
              el menú se expande por encima sin mover el contenido. */}
          <div className="w-full flex-none md:w-20">
            <SideNavigation />
          </div>
          <div className="relative isolate grow bg-gray-50 p-6 pt-16 text-gray-800 md:overflow-y-auto md:p-10 md:pt-10">
            {logo && (
              <div
                aria-hidden
                className="pointer-events-none fixed inset-y-0 left-0 right-0 z-0 md:left-20"
                style={{
                  backgroundImage: `url(${logo})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  backgroundSize: 'min(460px, 46%)',
                  opacity: 0.04,
                }}
              />
            )}
            <div className="relative z-10">
              <RenewalBanner />
              <DayBanner />
              {children}
            </div>
          </div>
        </div>
        <PlanUpgradeModal />
        <AppointmentsHub />
        <BankDepositNotifier />
        <PushRegister />
      </div>
    </RoleGuard>
  );
}
