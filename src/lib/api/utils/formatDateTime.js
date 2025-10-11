import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

export function formatDateTime(date, pattern = "dd 'de' MMMM yyyy, hh:mm a") {
  if (!date) return '---';
  try {
    return format(toZonedTime(new Date(date), 'America/Bogota'), pattern, {
      locale: es,
    });
  } catch {
    return '---';
  }
}
