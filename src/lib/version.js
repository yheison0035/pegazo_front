// Identificador del build desplegado. Vercel inyecta el SHA del commit en
// VERCEL_GIT_COMMIT_SHA (y NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA si se expone).
// Sirve para comprobar, con un solo GET, qué commit está realmente en producción.
export function pickCommitSha(env = {}) {
  const sha =
    env.VERCEL_GIT_COMMIT_SHA ||
    env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    env.GIT_COMMIT_SHA ||
    '';
  const clean = String(sha).trim();
  return {
    sha: clean || 'unknown',
    short: clean ? clean.slice(0, 7) : 'unknown',
  };
}
