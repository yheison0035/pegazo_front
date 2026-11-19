// Layout SERVIDOR del panel: declara render dinámico para todo /dashboard (así
// las páginas de cliente no se intentan prerender-ar) y delega la UI al shell de
// cliente. Esto permite que la landing y el blog sí sean estáticos (más rápido y
// mejor SEO) sin afectar el panel.
export const dynamic = 'force-dynamic';

import DashboardShell from './DashboardShell';

export default function Layout({ children }) {
  return <DashboardShell>{children}</DashboardShell>;
}
