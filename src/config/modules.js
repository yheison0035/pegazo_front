// Módulos que la plataforma (superplatform) puede habilitar/deshabilitar por
// empresa con un check. 'dashboard' (Inicio) y 'settings' (Configuración)
// siempre están disponibles para el dueño, por eso no se listan aquí.
// La clave (key) es el último segmento de la ruta /dashboard/<key>.
//
// IMPORTANTE — los grupos y el orden aquí son LOS MISMOS que ve el dueño en su
// menú lateral (src/config/navigation.js): Atención → Ventas → Clientes →
// Catálogo → Finanzas → Administración → Tienda online. Así, al configurar un
// tipo de negocio, los módulos quedan organizados igual que como el dueño los
// verá, y es fácil de entender.
//
// NOTA: la sección "Contabilidad" (Activos, Plan de cuentas, Libros, Estados
// financieros, Calendario tributario, Resumen contable) y la DIAN (Facturación
// electrónica) NO se activan por tipo de negocio: se encienden por flags de la
// empresa (accountingEnabled / hasAccountant / isTestCompany) desde el panel de
// la empresa. Por eso no aparecen como checks aquí.
export const TOGGLEABLE_MODULES = [
  // ── Atención (agenda / salón / recurso) ──
  { key: 'appointments', label: 'Citas', group: 'Atención' },
  { key: 'clinical', label: 'Historia clínica (salud)', group: 'Atención' },
  { key: 'mesas', label: 'Mesas (restaurante)', group: 'Atención' },
  { key: 'kitchen', label: 'Cocina (KDS)', group: 'Atención' },
  { key: 'storage', label: 'Guarda cascos', group: 'Atención' },

  // ── Ventas ──
  { key: 'sales', label: 'Realizar factura (POS)', group: 'Ventas' },
  { key: 'delivered_sales', label: 'Ventas realizadas', group: 'Ventas' },
  { key: 'cash', label: 'Caja (abrir/cerrar)', group: 'Ventas' },
  { key: 'cartera', label: 'Cartera y fiado', group: 'Ventas' },
  { key: 'returns', label: 'Devoluciones', group: 'Ventas' },
  { key: 'quotes', label: 'Cotizaciones', group: 'Ventas' },

  // ── Clientes ──
  { key: 'customers', label: 'Clientes', group: 'Clientes' },
  { key: 'loyalty', label: 'Fidelización', group: 'Clientes' },
  { key: 'memberships', label: 'Membresías', group: 'Clientes' },

  // ── Catálogo (lo que vende + con qué se surte) ──
  { key: 'services', label: 'Servicios', group: 'Catálogo' },
  { key: 'inventory', label: 'Inventario', group: 'Catálogo' },
  { key: 'categories', label: 'Categorías', group: 'Catálogo' },
  { key: 'brands', label: 'Marcas', group: 'Catálogo' },
  { key: 'supplies', label: 'Insumos', group: 'Catálogo' },
  { key: 'providers', label: 'Proveedores', group: 'Catálogo' },
  { key: 'purchases', label: 'Compras', group: 'Catálogo' },

  // ── Finanzas ──
  { key: 'expenses', label: 'Gastos', group: 'Finanzas' },
  { key: 'payables', label: 'Cuentas por pagar', group: 'Finanzas' },
  { key: 'employee-charges', label: 'Cargos a empleados', group: 'Finanzas' },
  { key: 'bank', label: 'Consignaciones (banco)', group: 'Finanzas' },
  { key: 'impuestos', label: 'Impuestos (IVA)', group: 'Finanzas' },
  { key: 'statistics', label: 'Estadísticas y reportes', group: 'Finanzas' },
  { key: 'nomina-electronica', label: 'Nómina electrónica', group: 'Finanzas' },

  // ── Administración ──
  { key: 'users', label: 'Usuarios y roles', group: 'Administración' },
  { key: 'locals', label: 'Locales / sedes', group: 'Administración' },

  // ── Tienda online ──
  { key: 'website', label: 'Tienda online', group: 'Tienda online' },
  { key: 'orders', label: 'Pedidos de la tienda', group: 'Tienda online' },
];

export const MODULE_KEYS = TOGGLEABLE_MODULES.map((m) => m.key);

// Agrupadas para pintar la pantalla de checks por secciones (respeta el orden
// de aparición arriba, que es el mismo del menú del dueño).
export const MODULE_GROUPS = TOGGLEABLE_MODULES.reduce((acc, m) => {
  (acc[m.group] = acc[m.group] || []).push(m);
  return acc;
}, {});
