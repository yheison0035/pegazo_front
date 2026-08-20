export const BUSINESS_TYPES = {
  COMERCIO: [
    'locals',
    'categories',
    'brands',
    'providers',
    'inventory',
    'customers',
    'sales',
    'delivered_sales',
    'expenses',
    'statistics',
    'users',
  ],

  FERIA: ['inventory', 'customers', 'sales', 'expenses'],

  // Televentas: comercio completo (inventario, catálogo, proveedores…) con
  // gestión de pedidos como su operación central.
  TELEVENTAS: [
    'locals',
    'categories',
    'brands',
    'providers',
    'inventory',
    'customers',
    'orders',
    'sales',
    'delivered_sales',
    'expenses',
    'statistics',
    'users',
  ],

  RESTAURANTE: [
    'mesas',
    'kitchen',
    'sales',
    'inventory',
    'categories',
    'customers',
    'delivered_sales',
    'expenses',
    'statistics',
    'users',
    'locals',
  ],

  SERVICIOS: [
    'locals',
    'users',
    'categories',
    'brands',
    'providers',
    'customers',
    'inventory',
    'services',
    'appointments',
    'sales',
    'delivered_sales',
    'expenses',
    'statistics',
  ],

  ECOMMERCE: [
    'inventory',
    'orders',
    'customers',
    'sales',
    'shipping',
    'statistics',
  ],

  DISTRIBUCION: [
    'inventory',
    'providers',
    'customers',
    'sales',
    'expenses',
    'statistics',
  ],

  // ---- Verticales específicas ----

  // Salud con citas (odontología): pacientes, tratamientos (servicios) y agenda.
  ODONTOLOGIA: [
    'locals',
    'users',
    'categories',
    'providers',
    'inventory',
    'customers',
    'services',
    'appointments',
    'sales',
    'delivered_sales',
    'expenses',
    'statistics',
  ],

  // Retail con inventario + POS (código de barras).
  SUPERMERCADO: [
    'locals',
    'categories',
    'brands',
    'providers',
    'inventory',
    'customers',
    'sales',
    'delivered_sales',
    'expenses',
    'statistics',
    'users',
  ],

  DROGUERIA: [
    'locals',
    'categories',
    'brands',
    'providers',
    'inventory',
    'customers',
    'sales',
    'delivered_sales',
    'expenses',
    'statistics',
    'users',
  ],

  ROPA: [
    'locals',
    'categories',
    'brands',
    'providers',
    'inventory',
    'customers',
    'sales',
    'delivered_sales',
    'expenses',
    'statistics',
    'users',
  ],

  // Frutas y verduras: sin marcas.
  FRUVER: [
    'locals',
    'categories',
    'providers',
    'inventory',
    'customers',
    'sales',
    'delivered_sales',
    'expenses',
    'statistics',
    'users',
  ],

  // Floristería: retail + domicilios (envíos).
  FLORISTERIA: [
    'locals',
    'categories',
    'inventory',
    'customers',
    'sales',
    'delivered_sales',
    'shipping',
    'expenses',
    'statistics',
    'users',
  ],

  // Comidas rápidas: mesas/pedidos + cocina + inventario.
  COMIDA_RAPIDA: [
    'mesas',
    'kitchen',
    'sales',
    'inventory',
    'categories',
    'customers',
    'delivered_sales',
    'expenses',
    'statistics',
    'users',
  ],

  // Cafetería / panadería.
  CAFETERIA: [
    'locals',
    'categories',
    'inventory',
    'customers',
    'sales',
    'delivered_sales',
    'expenses',
    'statistics',
    'users',
  ],

  // Carnicería: venta por peso, perecederos (vencimiento), sin marcas.
  CARNICERIA: [
    'locals',
    'categories',
    'providers',
    'inventory',
    'customers',
    'sales',
    'delivered_sales',
    'expenses',
    'statistics',
    'users',
  ],
};
