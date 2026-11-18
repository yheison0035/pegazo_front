import { describe, it, expect } from 'vitest';
import { nextMonthlyPaymentDate } from '../utils';

const todayISO = () => {
  const n = new Date();
  const p = (x) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
};

// La "próxima fecha de pago (calculada)" se ancla al DÍA de "Cliente desde" y se
// actualiza al cambiarlo (antes se quedaba pegada al "pago hasta").
describe('nextMonthlyPaymentDate · ancla al día del ciclo', () => {
  it('sin pago vigente: devuelve la próxima fecha con el día de "Cliente desde", de hoy en adelante', () => {
    const r = nextMonthlyPaymentDate('2020-03-19', ''); // día 19, en el pasado
    expect(r).toMatch(/^\d{4}-\d{2}-19$/);
    expect(r >= todayISO()).toBe(true);
  });

  it('cambiar el día de "Cliente desde" cambia la próxima fecha', () => {
    const r19 = nextMonthlyPaymentDate('2020-03-19', '');
    const r05 = nextMonthlyPaymentDate('2020-03-05', '');
    expect(r19.endsWith('-19')).toBe(true);
    expect(r05.endsWith('-05')).toBe(true);
    expect(r19).not.toBe(r05);
  });

  it('con pago vigente (futuro): la próxima es la del ciclo DESPUÉS de lo ya pagado', () => {
    const r = nextMonthlyPaymentDate('2099-03-19', '2099-05-10');
    expect(r).toBe('2099-05-19'); // primer día 19 posterior al 2099-05-10
  });

  it('si lo pagado cae justo en el día del ciclo, pasa al mes siguiente', () => {
    const r = nextMonthlyPaymentDate('2099-03-19', '2099-05-19');
    expect(r).toBe('2099-06-19');
  });

  it('fecha de inicio inválida → vacío', () => {
    expect(nextMonthlyPaymentDate('', '')).toBe('');
    expect(nextMonthlyPaymentDate('no-fecha', '')).toBe('');
  });
});
