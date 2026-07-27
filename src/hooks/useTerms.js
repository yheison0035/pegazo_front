'use client';

import { useAuth } from '@/context/authContext';
import { getTerms } from '@/config/terminology';

// Devuelve los términos del negocio actual (según company.type).
// Uso: const t = useTerms();  ->  t.attendant, t.servicePlural, etc.
export default function useTerms() {
  const auth = useAuth();
  return getTerms(auth?.usuario?.company);
}
