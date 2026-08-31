// Módulos (ítems de menú) que lleva CADA tipo de negocio. Lista curada y
// explícita: cada vertical incluye SOLO lo que necesita "sí o sí" para operar.
//
//  - 'settings' (Configuración) siempre está disponible para el dueño (ver
//    useNavigation), no hace falta listarlo aquí.
//  - 'website' (Tienda online) y 'orders' (Pedidos) NO se listan por vertical:
//    aparecen SOLO cuando la plataforma ya montó el sitio del cliente, es decir
//    cuando la empresa tiene `websiteEnabled` Y un `domain` cargado (ver
//    useNavigation). Antes de eso el dueño no ve el módulo.
//
// Claves de módulo disponibles:
//   locals, users, categories, brands, providers, inventory, supplies, purchases,
//   customers, cartera, loyalty, services, appointments, sales, orders,
//   delivered_sales, returns, quotes, cash, mesas, kitchen, expenses, statistics.

// Módulos ocultos temporalmente en TODOS los negocios: aún no están 100%
// terminados y comprobados. Para reactivar uno, quítalo de este conjunto.
//   - (mesas / kitchen ya están activos: flujo de restaurante completo —
//      mesero toma pedidos como tarjetas con estado, cocina en KDS, caja
//      cobra toda la mesa en una venta. Solo los listan RESTAURANTE y
//      COMIDA_RAPIDA, así que solo aparecen ahí.)
//
// La Tienda online (website) y Pedidos (orders) NO se ocultan aquí: tienen su
// propio gateo doble → solo aparecen si la empresa tiene `websiteEnabled` y el
// plan requerido (website: ALTURA+). Ver useNavigation + lib/plans.
export const HIDDEN_MODULES = new Set([]);

export const BUSINESS_TYPES = {
  // ---------- RETAIL (mostrador con productos) ----------
  COMERCIO: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'cartera', 'impuestos', 'sales', 'delivered_sales',
    'returns', 'cash', 'expenses', 'payables', 'statistics',
  ],

  SUPERMERCADO: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'cartera', 'impuestos', 'sales', 'delivered_sales',
    'returns', 'cash', 'expenses', 'payables', 'statistics',
  ],

  DROGUERIA: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'cartera', 'impuestos', 'sales', 'delivered_sales',
    'returns', 'cash', 'expenses', 'payables', 'statistics',
  ],

  ROPA: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'cartera', 'impuestos', 'sales', 'delivered_sales',
    'returns', 'cash', 'expenses', 'payables', 'statistics',
  ],

  // Perecederos por peso: sin marcas, sin devoluciones (producto perecedero).
  FRUVER: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'cartera', 'impuestos', 'sales', 'delivered_sales', 'cash',
    'expenses', 'payables', 'statistics',
  ],

  CARNICERIA: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'cartera', 'impuestos', 'sales', 'delivered_sales', 'cash',
    'expenses', 'payables', 'statistics',
  ],

  CAFETERIA: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'cartera', 'impuestos', 'sales', 'delivered_sales', 'cash',
    'expenses', 'payables', 'statistics',
  ],

  // Floristería: cotiza arreglos para eventos (domicilios: módulo futuro).
  FLORISTERIA: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'cartera', 'impuestos', 'quotes', 'sales', 'delivered_sales',
    'cash', 'expenses', 'payables', 'statistics',
  ],

  // Puesto/stand de feria o evento: operación de venta simple.
  FERIA: [
    'locals', 'users', 'categories', 'inventory', 'purchases', 'customers', 'cartera', 'impuestos',
    'sales', 'delivered_sales', 'returns', 'cash', 'expenses', 'payables', 'statistics',
  ],

  // ---------- COMIDA (salón + cocina) ----------
  RESTAURANTE: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'supplies', 'purchases',
    'customers', 'cartera', 'impuestos', 'mesas', 'kitchen', 'sales', 'delivered_sales',
    'cash', 'expenses', 'payables', 'statistics',
  ],

  COMIDA_RAPIDA: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'supplies', 'purchases',
    'customers', 'cartera', 'impuestos', 'mesas', 'kitchen', 'sales', 'delivered_sales',
    'cash', 'expenses', 'payables', 'statistics',
  ],

  // ---------- SERVICIOS CON AGENDA ----------
  // Barbería / spa / estética: NO usa cotizaciones ni devoluciones.
  SERVICIOS: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'cartera', 'impuestos', 'loyalty', 'services', 'appointments',
    'sales', 'delivered_sales', 'cash', 'expenses', 'payables', 'employee-charges', 'statistics',
  ],

  // Odontología: presupuestos de tratamiento (quotes) + agenda de pacientes.
  ODONTOLOGIA: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'cartera', 'impuestos', 'loyalty', 'services', 'appointments', 'quotes',
    'sales', 'delivered_sales', 'cash', 'expenses', 'payables', 'employee-charges', 'statistics',
  ],

  // ---------- CANALES DE VENTA (remoto / online / mayorista) ----------
  // Televentas: pedidos por teléfono/redes, con cotización previa.
  TELEVENTAS: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'cartera', 'impuestos','quotes', 'sales',
    'delivered_sales', 'returns', 'expenses', 'payables', 'statistics',
  ],

  // Ecommerce: pedidos web + devoluciones (el estado de envío se gestiona en Pedidos).
  ECOMMERCE: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'cartera', 'impuestos','sales', 'delivered_sales',
    'returns', 'expenses', 'payables', 'statistics',
  ],

  // Distribución / mayorista: pedidos B2B con cotización.
  DISTRIBUCION: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'cartera', 'impuestos','quotes', 'sales', 'delivered_sales',
    'returns', 'expenses', 'payables', 'statistics',
  ],

  // ---------- ESPECIALES ----------
  // Interno de la empresa: set completo de comercio.
  ZORVEX: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'cartera', 'impuestos', 'sales', 'delivered_sales', 'returns',
    'cash', 'expenses', 'payables', 'statistics',
  ],
};
