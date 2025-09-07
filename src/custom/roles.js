export const Roles = {
  ADMIN: "Administrador",
  ADVISOR: "Asesor",
};

export const getRole = (key) => {
  return Roles[key] || null;
};
