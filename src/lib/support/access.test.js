import { describe, it, expect } from 'vitest';
import { canUseSupportChat } from './access';

describe('canUseSupportChat (burbuja de soporte solo dueño/admin)', () => {
  it.each(['SUPER_ADMIN', 'ADMIN'])('%s puede', (r) => expect(canUseSupportChat(r)).toBe(true));
  it.each(['SUPER_PLATFORM_ADMIN', 'CAJA', 'RECEPCIONISTA', 'ASESOR', 'VENTAS', 'BODEGUERO', 'AUXILIAR', 'MESERO', 'COCINERO', 'PROFESIONAL', 'BARBERO', 'CONTADOR', 'COORDINADOR', '', null, undefined])('%s NO puede', (r) => {
    expect(canUseSupportChat(r)).toBe(false);
  });
});
