import { describe, it, expect } from 'vitest';
import { PLAN_CHANGE_ENABLED, canChangePlan } from './planChange';

describe('Cambiar mi plan (oculto para todos mientras haya un solo plan)', () => {
  it('el módulo está apagado', () => expect(PLAN_CHANGE_ENABLED).toBe(false));
  it.each(['SUPER_ADMIN', 'ADMIN', 'CAJA', 'PROFESIONAL', 'SUPER_PLATFORM_ADMIN', null])('apagado: %s no lo ve', (r) => {
    expect(canChangePlan(r)).toBe(false);
  });
  it('cuando se reactive, solo el dueño (SUPER_ADMIN) lo verá', () => {
    expect(canChangePlan('SUPER_ADMIN', true)).toBe(true);
    for (const r of ['ADMIN', 'CAJA', 'PROFESIONAL', 'SUPER_PLATFORM_ADMIN']) expect(canChangePlan(r, true)).toBe(false);
  });
});
