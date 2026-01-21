export function canSeeOldPrice(usuario) {
  if (!usuario) return false;

  // Caso 1: usuario tiene local directo
  if (usuario.localId === 3) return true;

  // Caso 2: admin que gestiona locales
  if (Array.isArray(usuario.managedLocals)) {
    return usuario.managedLocals.some((l) => l.id === 3);
  }

  return false;
}
