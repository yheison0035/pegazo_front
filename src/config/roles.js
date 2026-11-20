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
  CONTADOR: 'CONTADOR',
  // Préstamos (tipo FINANCIERA): analista de crédito y cobrador de campo.
  ANALISTA: 'ANALISTA',
  COBRADOR: 'COBRADOR',
};

// Roles "solo lo suyo": el barbero/profesional únicamente ve SU información
// (Inicio propio, sus citas, sus cargos). No accede a nada del negocio ni de
// otros compañeros.
export const SELF_ONLY_ROLES = [Roles.BARBERO, Roles.PROFESIONAL];

// Todos los roles EXCEPTO el barbero/profesional. Se usa en el RoleGuard de las
// páginas del negocio para que el barbero no las alcance ni por URL directa.
// Roles de campo con alcance propio (préstamos): el cobrador solo opera SU
// cartera desde el módulo de préstamos; no alcanza el resto del negocio.
export const FIELD_ROLES = [Roles.COBRADOR];

export const ALL_EXCEPT_BARBER = Object.values(Roles).filter(
  (r) => !SELF_ONLY_ROLES.includes(r) && !FIELD_ROLES.includes(r),
);
