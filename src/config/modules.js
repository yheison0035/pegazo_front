// Módulos que la plataforma (superplatform) puede habilitar/deshabilitar por
// empresa con un check. 'dashboard' (Inicio) y 'settings' (Configuración)
// siempre están disponibles para el dueño, por eso no se listan aquí.
// La clave (key) es el último segmento de la ruta /dashboard/<key>.
export const TOGGLEABLE_MODULES = [
  { key: 'sales', label: 'Realizar factura (POS)', group: 'Ventas' },
  { key: 'delivered_sales', label: 'Ventas realizadas', group: 'Ventas' },
  { key: 'cash', label: 'Caja (abrir/cerrar)', group: 'Ventas' },
  { key: 'cartera', label: 'Cartera y fiado', group: 'Ventas' },
  { key: 'returns', label: 'Devoluciones', group: 'Ventas' },
  { key: 'quotes', label: 'Cotizaciones', group: 'Ventas' },
  { key: 'impuestos', label: 'Impuestos (IVA)', group: 'Ventas' },

  { key: 'inventory', label: 'Inventario', group: 'Inventario' },
  { key: 'categories', label: 'Categorías', group: 'Inventario' },
  { key: 'brands', label: 'Marcas', group: 'Inventario' },
  { key: 'providers', label: 'Proveedores', group: 'Inventario' },
  { key: 'purchases', label: 'Compras', group: 'Inventario' },
  { key: 'supplies', label: 'Insumos', group: 'Inventario' },

  { key: 'customers', label: 'Clientes', group: 'Clientes' },
  { key: 'loyalty', label: 'Fidelización', group: 'Clientes' },
  { key: 'appointments', label: 'Citas', group: 'Clientes' },
  { key: 'services', label: 'Servicios', group: 'Clientes' },

  { key: 'mesas', label: 'Mesas (restaurante)', group: 'Restaurante' },
  { key: 'kitchen', label: 'Cocina (KDS)', group: 'Restaurante' },

  { key: 'expenses', label: 'Gastos', group: 'Gestión' },
  { key: 'employee-charges', label: 'Cargos a empleados', group: 'Gestión' },
  { key: 'statistics', label: 'Estadísticas y reportes', group: 'Gestión' },
  { key: 'users', label: 'Usuarios y roles', group: 'Gestión' },
  { key: 'locals', label: 'Locales / sedes', group: 'Gestión' },
  { key: 'bank', label: 'Consignaciones (banco)', group: 'Gestión' },

  { key: 'website', label: 'Tienda online', group: 'Tienda online' },
  { key: 'orders', label: 'Pedidos de la tienda', group: 'Tienda online' },
];

export const MODULE_KEYS = TOGGLEABLE_MODULES.map((m) => m.key);

// Agrupadas para pintar la pantalla de checks por secciones.
export const MODULE_GROUPS = TOGGLEABLE_MODULES.reduce((acc, m) => {
  (acc[m.group] = acc[m.group] || []).push(m);
  return acc;
}, {});
