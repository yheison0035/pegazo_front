// Interruptores de funcionalidad (feature flags).
//
// La factura electrónica todavía NO está conectada a la DIAN, así que en
// producción se mantiene OCULTA para no confundir a las empresas actuales.
// Para trabajarla, se activa poniendo NEXT_PUBLIC_EINVOICE_ENABLED=true en el
// entorno (local, preview o una versión de staging).
export const EINVOICE_ENABLED =
  process.env.NEXT_PUBLIC_EINVOICE_ENABLED === 'true';
