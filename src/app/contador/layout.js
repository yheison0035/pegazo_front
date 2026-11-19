// Layout SERVIDOR del portal de contadores: render dinámico; la UI la maneja el
// shell de cliente.
export const dynamic = 'force-dynamic';

import ContadorShell from './ContadorShell';

export default function Layout({ children }) {
  return <ContadorShell>{children}</ContadorShell>;
}
