// El catálogo (negocios de productos/retail) usa la MISMA página pública
// universal que /booking y /menu; solo cambia el prefijo de la URL y el mensaje
// de la vista previa al compartir (catálogo, no "reserva tu cita").
import { buildPublicMetadata } from '@/app/booking/[slug]/publicMetadata';

export { default } from '@/app/booking/[slug]/page';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return buildPublicMetadata(slug, 'catalog');
}
