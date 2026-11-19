// La carta/menú (negocios de comida) usa la MISMA página pública universal que
// /booking y /catalog; solo cambia el prefijo de la URL y el mensaje de la vista
// previa al compartir (carta/menú, no "reserva tu cita").
import { buildPublicMetadata } from '@/app/booking/[slug]/publicMetadata';

export { default } from '@/app/booking/[slug]/page';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return buildPublicMetadata(slug, 'menu');
}

export const dynamic = 'force-dynamic';
