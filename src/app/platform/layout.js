// Layout SERVIDOR de la plataforma: render dinámico para todo /platform; la UI
// la maneja el shell de cliente.
export const dynamic = 'force-dynamic';

import PlatformShell from './PlatformShell';

export default function Layout({ children }) {
  return <PlatformShell>{children}</PlatformShell>;
}
