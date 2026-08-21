// Módulos (ítems de menú) que lleva CADA tipo de negocio. Lista curada y
// explícita: cada vertical incluye SOLO lo que necesita "sí o sí" para operar.
//
//  - 'settings' (Configuración) siempre está disponible para el dueño (ver
//    useNavigation), no hace falta listarlo aquí.
//  - 'website' (Tienda online) y 'orders' (Pedidos) se activan cuando la
//    plataforma habilita la tienda online de la empresa (websiteEnabled).
//
// Claves de módulo disponibles:
//   locals, users, categories, brands, providers, inventory, purchases,
//   customers, loyalty, services, appointments, sales, orders, delivered_sales,
//   returns, quotes, cash, mesas, kitchen, expenses, statistics.

// Módulos ocultos temporalmente en TODOS los negocios: aún no están 100%
// terminados y comprobados. Para reactivar uno, quítalo de este conjunto.
//   - website / orders : tienda online + pedidos (storefront/checkout pendiente)
//   - mesas / kitchen  : flujo de restaurante (sin verificar de punta a punta)
export const HIDDEN_MODULES = new Set([
  'website',
  'orders',
  'mesas',
  'kitchen',
]);

export const BUSINESS_TYPES = {
  // ---------- RETAIL (mostrador con productos) ----------
  COMERCIO: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'sales', 'delivered_sales',
    'returns', 'cash', 'expenses', 'statistics',
  ],

  SUPERMERCADO: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'sales', 'delivered_sales',
    'returns', 'cash', 'expenses', 'statistics',
  ],

  DROGUERIA: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'sales', 'delivered_sales',
    'returns', 'cash', 'expenses', 'statistics',
  ],

  ROPA: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'sales', 'delivered_sales',
    'returns', 'cash', 'expenses', 'statistics',
  ],

  // Perecederos por peso: sin marcas, sin devoluciones (producto perecedero).
  FRUVER: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'sales', 'delivered_sales', 'cash',
    'expenses', 'statistics',
  ],

  CARNICERIA: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'sales', 'delivered_sales', 'cash',
    'expenses', 'statistics',
  ],

  CAFETERIA: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'sales', 'delivered_sales', 'cash',
    'expenses', 'statistics',
  ],

  // Floristería: cotiza arreglos para eventos (domicilios: módulo futuro).
  FLORISTERIA: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'quotes', 'sales', 'delivered_sales',
    'cash', 'expenses', 'statistics',
  ],

  // Puesto/stand de feria o evento: operación de venta simple.
  FERIA: [
    'locals', 'users', 'categories', 'inventory', 'purchases', 'customers',
    'sales', 'delivered_sales', 'returns', 'cash', 'expenses', 'statistics',
  ],

  // ---------- COMIDA (salón + cocina) ----------
  RESTAURANTE: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'mesas', 'kitchen', 'sales', 'delivered_sales',
    'cash', 'expenses', 'statistics',
  ],

  COMIDA_RAPIDA: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'mesas', 'kitchen', 'sales', 'delivered_sales',
    'cash', 'expenses', 'statistics',
  ],

  // ---------- SERVICIOS CON AGENDA ----------
  // Barbería / spa / estética: NO usa cotizaciones ni devoluciones.
  SERVICIOS: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'loyalty', 'services', 'appointments',
    'sales', 'delivered_sales', 'cash', 'expenses', 'statistics',
  ],

  // Odontología: presupuestos de tratamiento (quotes) + agenda de pacientes.
  ODONTOLOGIA: [
    'locals', 'users', 'categories', 'providers', 'inventory', 'purchases',
    'customers', 'loyalty', 'services', 'appointments', 'quotes',
    'sales', 'delivered_sales', 'cash', 'expenses', 'statistics',
  ],

  // ---------- CANALES DE VENTA (remoto / online / mayorista) ----------
  // Televentas: pedidos por teléfono/redes, con cotización previa.
  TELEVENTAS: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'orders', 'quotes', 'sales',
    'delivered_sales', 'returns', 'expenses', 'statistics',
  ],

  // Ecommerce: pedidos web + devoluciones (el estado de envío se gestiona en Pedidos).
  ECOMMERCE: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'orders', 'sales', 'delivered_sales',
    'returns', 'expenses', 'statistics',
  ],

  // Distribución / mayorista: pedidos B2B con cotización.
  DISTRIBUCION: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'orders', 'quotes', 'sales', 'delivered_sales',
    'returns', 'expenses', 'statistics',
  ],

  // ---------- ESPECIALES ----------
  // Interno de la empresa: set completo de comercio.
  ZORVEX: [
    'locals', 'users', 'categories', 'brands', 'providers', 'inventory',
    'purchases', 'customers', 'sales', 'delivered_sales', 'returns',
    'cash', 'expenses', 'statistics',
  ],
};
