// Marca a usar en facturas y comprobantes impresos.
//
// Regla acordada con el dueño: si la empresa tiene MÁS de una sede, cada local
// usa su propia información (logo, NIT, correo, teléfono, dirección y nombre),
// cayendo a los datos de la empresa cuando el local no tenga ese dato. Con una
// sola sede, se usan SIEMPRE los datos de la empresa registrada.
//
// `usuario` trae `company` (con `localCount`) desde /auth/me. `local` es el
// local de la VENTA (sale.local), no el del cajero.
export function resolveBranding(usuario, local) {
  const company = usuario?.company || {};
  const multi = Number(company.localCount || 0) > 1;
  const useLocal = !!(multi && local);
  const pick = (l, c) => (useLocal ? (l ?? c ?? null) : (c ?? null));
  return {
    name: useLocal ? local?.name || company.name || '' : company.name || '',
    logo: pick(local?.logo, company.logo),
    nit: pick(local?.nit, company.nit),
    email: pick(local?.email, company.email),
    phone: pick(local?.phone, company.phone),
    // La dirección siempre es la del local de la venta cuando existe.
    address: local?.address ?? null,
  };
}
