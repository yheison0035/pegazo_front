// Quién puede usar el chat de soporte con Pegazo: SOLO el dueño (SUPER_ADMIN) y
// el administrador (ADMIN), en todos los tipos de negocio. Es un canal de
// mantenimiento/dudas del negocio, no para cajeros, barberos ni meseros.
export const SUPPORT_CHAT_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export function canUseSupportChat(role) {
  return SUPPORT_CHAT_ROLES.includes(String(role || ''));
}
