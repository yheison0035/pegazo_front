import { WEIGHT_UNITS, unitShortLabel } from '@/config/verticalProfiles';

// Un producto se vende POR PESO (cantidades decimales: 1,5 kg) si su unidad es
// cualquiera de las de peso (PESO del catálogo o KG/LIBRA/ARROBA del formulario).
// Antes solo se aceptaba 'PESO' y un corte guardado en KG se vendía por enteros.
export function isWeightUnit(unit) {
  return WEIGHT_UNITS.includes(String(unit || '').toUpperCase());
}

// Si el ítem no trae unidad, manda el tipo de negocio (fruver/carnicería/súper).
export function isByWeightItem(item, isWeightVertical) {
  return item?.unit ? isWeightUnit(item.unit) : !!isWeightVertical;
}

// "12 kg" / "3 lb" para productos por peso; el número tal cual para unidades.
export function stockLabel(stock, unit) {
  const s = stock ?? '---';
  const u = unitShortLabel(String(unit || '').toUpperCase());
  return isWeightUnit(unit) && u ? `${s} ${u}` : s;
}
