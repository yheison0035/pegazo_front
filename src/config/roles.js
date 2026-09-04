export const Roles = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COORDINADOR: 'COORDINADOR',
  ADMIN: 'ADMIN',
  ASESOR: 'ASESOR',
  AUXILIAR: 'AUXILIAR',
  BODEGUERO: 'BODEGUERO',
  VENTAS: 'VENTAS',
  SUPER_PLATFORM_ADMIN: 'SUPER_PLATFORM_ADMIN',
  BARBERO: 'BARBERO',
  RECEPCIONISTA: 'RECEPCIONISTA',
  CAJA: 'CAJA',
  MESERO: 'MESERO',
  COCINERO: 'COCINERO',
  PROFESIONAL: 'PROFESIONAL',
};

// Roles "solo lo suyo": el barbero/profesional únicamente ve SU información
// (Inicio propio, sus citas, sus cargos). No accede a nada del negocio ni de
// otros compañeros.
export const SELF_ONLY_ROLES = [Roles.BARBERO, Roles.PROFESIONAL];

// Todos los roles EXCEPTO el barbero/profesional. Se usa en el RoleGuard de las
// páginas del negocio para que el barbero no las alcance ni por URL directa.
export const ALL_EXCEPT_BARBER = Object.values(Roles).filter(
  (r) => !SELF_ONLY_ROLES.includes(r),
);
