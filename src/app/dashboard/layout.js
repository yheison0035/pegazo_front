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
import SubscriptionDueModal from '@/components/billing/SubscriptionDueModal';
import PaymentWall from '@/components/billing/PaymentWall';
import SupportWidget from '@/components/support/SupportWidget';
import QuickSearch from '@/components/search/QuickSearch';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import usePermissions from '@/hooks/usePermissions';
import { isDark, DARK_EVENT } from '@/lib/darkMode';
import { CRM_FONTS_BY_ID, googleFontHref } from '@/config/crmFonts';
import ImpersonationBanner from '@/components/platform/ImpersonationBanner';
import { isImpersonating } from '@/lib/impersonation';
import AnnouncementsFeed from '@/components/dashboard/AnnouncementsFeed';

export default function Layout({ children }) {
  const { usuario } = useAuth();
  const { can } = usePermissions();
  // El buscador global (⌘K) solo aplica a quien pueda ver inventario o clientes.
  const canQuickSearch = can('inventory', 'read') || can('customers', 'read');
  // El tema de diseño se aplica SOLO al panel (este contenedor), no al <html>,
  // para que el login y las páginas públicas queden siempre en el tema por
  // defecto. Los overrides de color en globals.css usan [data-crm-theme].
  const theme = usuario?.company?.crmTheme || 'orange';
  // Logo del negocio como marca de agua sutil de fondo en cada módulo.
  const logo = usuario?.company?.logo;
  const [imp, setImp] = useState(false);
  useEffect(() => setImp(isImpersonating()), []);
  // Fuente del panel elegida por el negocio.
  const fontId = usuario?.company?.crmFont || 'system';
  const fontStack = (CRM_FONTS_BY_ID[fontId] || CRM_FONTS_BY_ID.system).stack;

  // Carga la fuente de Google elegida (una sola vez por fuente).
  useEffect(() => {
    const href = googleFontHref(fontId);
    if (!href || typeof document === 'undefined') return;
    if (document.querySelector(`link[data-crm-font="${fontId}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-crm-font', fontId);
    document.head.appendChild(link);
  }, [fontId]);

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
      <ImpersonationBanner />
      {/* Muro de pago: si la empresa venció, bloquea todo el CRM. */}
      <PaymentWall />
      <div
        data-crm-theme={theme}
        data-theme={dark ? 'dark' : undefined}
        style={{ fontFamily: fontStack }}
      >
        <div
          className={`flex flex-col bg-gray-50 md:flex-row md:overflow-hidden ${
            imp ? 'mt-9 h-[calc(100vh-2.25rem)]' : 'h-screen'
          }`}
        >
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
              {canQuickSearch && (
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new Event('pegazo-open-search'))
                  }
                  className="mb-4 flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-left text-sm text-gray-400 shadow-sm transition hover:border-orange-300 hover:text-gray-600"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 flex-none text-gray-400" />
                  <span className="flex-1">
                    Buscar productos, clientes, código…
                  </span>
                  <kbd className="hidden rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-semibold text-gray-400 sm:inline">
                    ⌘K
                  </kbd>
                </button>
              )}
              <RenewalBanner />
              <DayBanner />
              <AnnouncementsFeed />
              {children}
            </div>
          </div>
        </div>
        <PlanUpgradeModal />
        <SubscriptionDueModal />
        <SupportWidget />
        <QuickSearch />
        <AppointmentsHub />
        <BankDepositNotifier />
        <PushRegister />
      </div>
    </RoleGuard>
  );
}
