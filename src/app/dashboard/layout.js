'use client';

import { useEffect, useState } from 'react';
import SideNavigation from '@/components/dashboard/sidenav/sidenav';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import PlanUpgradeModal from '@/components/plan/PlanUpgradeModal';
import AppointmentsHub from '@/components/appointments/AppointmentsHub';
import BankDepositNotifier from '@/components/bank/BankDepositNotifier';
import AppointmentNotifier from '@/components/appointments/AppointmentNotifier';
import SplashScreen from '@/components/pwa/SplashScreen';
import PushRegister from '@/components/pwa/PushRegister';
import { useAuth } from '@/context/authContext';
import DayBanner from '@/components/pos/DayBanner';
import RenewalBanner from '@/components/billing/RenewalBanner';
import SubscriptionDueModal from '@/components/billing/SubscriptionDueModal';
import PaymentWall from '@/components/billing/PaymentWall';
import SupportWidget from '@/components/support/SupportWidget';
import QuickSearch from '@/components/search/QuickSearch';
import { LocalScopeProvider } from '@/context/localScopeContext';
import GlobalLocalSelect from '@/components/dashboard/GlobalLocalSelect';
import { isDark, DARK_EVENT } from '@/lib/darkMode';
import { CRM_FONTS_BY_ID, googleFontHref } from '@/config/crmFonts';
import ImpersonationBanner from '@/components/platform/ImpersonationBanner';
import AnnouncementsFeed from '@/components/dashboard/AnnouncementsFeed';

export default function Layout({ children }) {
  const { usuario } = useAuth();
  // El tema de diseño se aplica SOLO al panel (este contenedor), no al <html>,
  // para que el login y las páginas públicas queden siempre en el tema por
  // defecto. Los overrides de color en globals.css usan [data-crm-theme].
  // Apariencia POR LOCAL: cada usuario ve el tema/fuente de SU sede; si la sede
  // no tiene uno propio, hereda el de la empresa. El dueño (sin sede asignada)
  // ve el valor por defecto de la empresa.
  const theme =
    usuario?.local?.crmTheme || usuario?.company?.crmTheme || 'orange';
  // Logo del negocio como marca de agua sutil de fondo en cada módulo.
  const logo = usuario?.company?.logo;
  // Fuente del panel: la de la sede del usuario o, si no tiene, la de la empresa.
  const fontId =
    usuario?.local?.crmFont || usuario?.company?.crmFont || 'system';
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
      <LocalScopeProvider>
      <SplashScreen />
      <ImpersonationBanner />
      {/* Muro de pago: si la empresa venció, bloquea todo el CRM. */}
      <PaymentWall />
      <div
        data-crm-theme={theme}
        data-theme={dark ? 'dark' : undefined}
        style={{ fontFamily: fontStack }}
      >
        {/* Deja sitio arriba al banner de "modo soporte" por su altura REAL
            (--support-banner-h = 0 cuando no hay banner). Así nada queda tapado,
            también si el aviso se parte en dos líneas en móvil. */}
        <div
          className="flex flex-col bg-gray-50 md:flex-row md:overflow-hidden"
          style={{
            marginTop: 'var(--support-banner-h, 0px)',
            height: 'calc(100vh - var(--support-banner-h, 0px))',
          }}
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
              <RenewalBanner />
              <DayBanner />
              <AnnouncementsFeed />
              <GlobalLocalSelect />
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
        <AppointmentNotifier />
        <PushRegister />
      </div>
      </LocalScopeProvider>
    </RoleGuard>
  );
}
