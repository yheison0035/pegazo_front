// Banco de textos: adapta el vocabulario según el tipo de negocio.
// Cada tipo sobreescribe solo lo que cambia; lo demás usa el DEFAULT.
// A futuro, una empresa puede tener su propio `company.terminology` (overrides
// por empresa) para casos finos (barbería vs. estética, ambos SERVICIOS).

const DEFAULT = {
  attendant: 'Vendedor',
  attendantPlural: 'Vendedores',
  service: 'Servicio',
  servicePlural: 'Servicios',
  product: 'Producto',
  productPlural: 'Productos',
  sale: 'Venta',
  salePlural: 'Ventas',
  appointment: 'Cita',
  appointmentPlural: 'Citas',
  customer: 'Cliente',
  customerPlural: 'Clientes',
};

const TERMS_BY_TYPE = {
  SERVICIOS: {
    attendant: 'Barbero',
    attendantPlural: 'Barberos',
    // El módulo se llama "Servicios" (usa el vocabulario por defecto).
  },
  COMERCIO: {
    attendant: 'Cajero',
    attendantPlural: 'Cajeros',
  },
  RESTAURANTE: {
    attendant: 'Mesero',
    attendantPlural: 'Meseros',
    service: 'Plato',
    servicePlural: 'Platos',
    product: 'Plato',
    productPlural: 'Platos',
    catalogLabel: 'Menú', // nombre del módulo (antes "Inventario")
    sale: 'Pedido',
    salePlural: 'Pedidos',
    appointment: 'Reserva',
    appointmentPlural: 'Reservas',
  },
  TELEVENTAS: {
    attendant: 'Asesor',
    attendantPlural: 'Asesores',
    sale: 'Pedido',
    salePlural: 'Pedidos',
  },
  ECOMMERCE: {
    attendant: 'Asesor',
    attendantPlural: 'Asesores',
    sale: 'Pedido',
    salePlural: 'Pedidos',
  },
  DISTRIBUCION: {
    attendant: 'Vendedor',
    attendantPlural: 'Vendedores',
    sale: 'Pedido',
    salePlural: 'Pedidos',
  },

  // ---- Verticales específicas ----
  ODONTOLOGIA: {
    attendant: 'Doctor',
    attendantPlural: 'Doctores',
    customer: 'Paciente',
    customerPlural: 'Pacientes',
    service: 'Tratamiento',
    servicePlural: 'Tratamientos',
  },
  SUPERMERCADO: {
    attendant: 'Cajero',
    attendantPlural: 'Cajeros',
  },
  DROGUERIA: {
    attendant: 'Cajero',
    attendantPlural: 'Cajeros',
    product: 'Medicamento',
    productPlural: 'Medicamentos',
  },
  ROPA: {
    attendant: 'Vendedor',
    attendantPlural: 'Vendedores',
    product: 'Prenda',
    productPlural: 'Prendas',
  },
  FRUVER: {
    attendant: 'Cajero',
    attendantPlural: 'Cajeros',
  },
  FLORISTERIA: {
    attendant: 'Vendedor',
    attendantPlural: 'Vendedores',
    product: 'Arreglo',
    productPlural: 'Arreglos',
  },
  COMIDA_RAPIDA: {
    attendant: 'Cajero',
    attendantPlural: 'Cajeros',
    product: 'Plato',
    productPlural: 'Platos',
    catalogLabel: 'Menú', // nombre del módulo (antes "Inventario")
    sale: 'Pedido',
    salePlural: 'Pedidos',
  },
  CAFETERIA: {
    attendant: 'Cajero',
    attendantPlural: 'Cajeros',
  },
  CARNICERIA: {
    attendant: 'Cajero',
    attendantPlural: 'Cajeros',
    product: 'Corte',
    productPlural: 'Cortes',
  },

  // ---- Servicios con agenda / recurso ----
  LAVADO_VEHICULOS: {
    attendant: 'Lavador',
    attendantPlural: 'Lavadores',
    service: 'Lavado',
    servicePlural: 'Lavados',
    appointment: 'Turno',
    appointmentPlural: 'Turnos',
  },
  CANCHAS_SINTETICAS: {
    // El "recurso" que se reserva es la cancha (ocupa la columna de agenda).
    attendant: 'Cancha',
    attendantPlural: 'Canchas',
    service: 'Alquiler de cancha',
    servicePlural: 'Alquileres de cancha',
    appointment: 'Reserva',
    appointmentPlural: 'Reservas',
  },
  GUARDA_CASCOS: {
    attendant: 'Encargado',
    attendantPlural: 'Encargados',
    service: 'Guardado',
    servicePlural: 'Guardados',
    customer: 'Usuario',
    customerPlural: 'Usuarios',
  },
};

// Devuelve los términos para una empresa: DEFAULT + por tipo + overrides propios.
export function getTerms(company) {
  const type = company?.type;
  // Vocabulario del tipo: primero el configurado en BD por la plataforma
  // (company.typeTerminology), y si no hay, el mapa por defecto del código.
  const typeTerms =
    company?.typeTerminology && Object.keys(company.typeTerminology).length
      ? company.typeTerminology
      : TERMS_BY_TYPE[type] || {};
  return {
    ...DEFAULT,
    ...typeTerms,
    ...(company?.terminology || {}),
  };
}
