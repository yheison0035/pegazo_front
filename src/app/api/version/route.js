import { NextResponse } from 'next/server';
import { pickCommitSha } from '@/lib/version';

// GET /api/version → { sha, short, env }. Público y sin datos sensibles: solo
// identifica el commit desplegado para verificar despliegues.
export const dynamic = 'force-dynamic';

export async function GET() {
  const v = pickCommitSha(process.env);
  return NextResponse.json(
    { ...v, env: process.env.VERCEL_ENV || 'local' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
