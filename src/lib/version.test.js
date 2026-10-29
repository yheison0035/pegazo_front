import { describe, it, expect } from 'vitest';
import { pickCommitSha } from './version';

describe('pickCommitSha', () => {
  it('prefiere el SHA de Vercel y devuelve el corto de 7', () => {
    expect(pickCommitSha({ VERCEL_GIT_COMMIT_SHA: 'ad36c7f1234567890' })).toEqual({ sha: 'ad36c7f1234567890', short: 'ad36c7f' });
  });
  it('cae a la variable pública o genérica; sin nada → unknown', () => {
    expect(pickCommitSha({ NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: 'abc1234xyz' }).short).toBe('abc1234');
    expect(pickCommitSha({ GIT_COMMIT_SHA: ' b32baab99 ' }).short).toBe('b32baab');
    expect(pickCommitSha({})).toEqual({ sha: 'unknown', short: 'unknown' });
  });
});
