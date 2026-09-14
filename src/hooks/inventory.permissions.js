// ¿El usuario puede ver/editar el "Precio anterior" (para promociones/descuentos)?
// Es el dueño o el administrador. La disponibilidad REAL del campo por tipo de
// negocio la controla el product-field `oldPrice` (verticalProfiles), así que
// aquí solo se valida el rol. (Antes estaba fijado al local id 3 de EuropeaTV;
// eso rompía el multi-tenant.)
export function canSeeOldPrice(usuario) {
  if (!usuario) return false;
  return ["SUPER_ADMIN", "ADMIN"].includes(usuario.role);
}
