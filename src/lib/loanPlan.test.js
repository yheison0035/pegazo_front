import { describe, it, expect } from 'vitest';
import {
  buildLoanPlan,
  computeMora,
  daysLate,
  nextDueDate,
  periodicRate,
  roundToMultiple,
  overdueTone,
} from './loanPlan';

const d = (y, m, day) => new Date(y, m - 1, day);
const ymd = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

// Paridad con el backend (loan-plan.util.spec.ts): mismos casos, mismos números.
describe('loanPlan (espejo del motor de préstamos)', () => {
  it('convierte la tasa mensual al periodo', () => {
    expect(periodicRate(3, 'MENSUAL')).toBeCloseTo(0.03, 10);
    expect(periodicRate(3, 'DIARIA')).toBeCloseTo(0.001, 10);
    expect(periodicRate(3, 'QUINCENAL')).toBeCloseTo(0.015, 10);
    expect(periodicRate(3, 'QUINCENAL', 'EFECTIVA')).toBeCloseTo(0.014889, 5);
    expect(periodicRate(0, 'DIARIA')).toBe(0);
  });

  it('fechas: mensual acotado al fin de mes y diaria sin domingos', () => {
    expect(ymd(nextDueDate(d(2026, 1, 31), 'MENSUAL'))).toBe('2026-02-28');
    expect(ymd(nextDueDate(d(2026, 1, 10), 'DIARIA', [0]))).toBe('2026-01-12');
    expect(ymd(nextDueDate(d(2026, 1, 10), 'QUINCENAL'))).toBe('2026-01-25');
  });

  it('SIMPLE: 1.000.000 al 10% a 10 meses → cuota 200.000, intereses 1.000.000', () => {
    const plan = buildLoanPlan({ principal: 1_000_000, interestRate: 10, termCount: 10, frequency: 'MENSUAL', disbursementDate: d(2026, 1, 5) });
    expect(plan.totalInterest).toBe(1_000_000);
    expect(plan.installmentAmount).toBe(200_000);
    expect(plan.installments).toHaveLength(10);
    expect(ymd(plan.firstDueDate)).toBe('2026-02-05');
    expect(plan.effectiveAnnualRatePercent).toBeCloseTo(213.84, 1);
  });

  it('paga diario: 1.000.000 al 20% a 30 días; sumas exactas y sin domingos', () => {
    const plan = buildLoanPlan({ principal: 1_000_000, interestRate: 20, termCount: 30, frequency: 'DIARIA', disbursementDate: d(2026, 1, 5), excludeWeekdays: [0] });
    expect(plan.totalInterest).toBe(200_000);
    expect(plan.installmentAmount).toBe(40_000);
    expect(sum(plan.installments.map((i) => i.capital))).toBe(1_000_000);
    expect(sum(plan.installments.map((i) => i.total))).toBe(1_200_000);
    expect(plan.installments.some((i) => i.dueDate.getDay() === 0)).toBe(false);
    expect(plan.installments[29].capital).toBe(33_343);
  });

  it('redondeo de cuota a múltiplos y última cuota cuadra', () => {
    const plan = buildLoanPlan({ principal: 500_000, interestRate: 5, termCount: 6, frequency: 'QUINCENAL', roundTo: 1000, disbursementDate: d(2026, 1, 1) });
    expect(plan.installments.slice(0, 5).every((i) => i.total === 96_000)).toBe(true);
    expect(plan.installments[5].total).toBe(95_000);
    expect(plan.totalAmount).toBe(575_000);
  });

  it('FRANCES: 1.000.000 al 2% a 12 → cuota 94.560 y cierra en 0', () => {
    const plan = buildLoanPlan({ principal: 1_000_000, interestRate: 2, termCount: 12, amortization: 'FRANCES', disbursementDate: d(2026, 1, 1) });
    expect(plan.installmentAmount).toBe(94_560);
    expect(plan.installments[0]).toMatchObject({ interest: 20_000, capital: 74_560 });
    expect(sum(plan.installments.map((i) => i.capital))).toBe(1_000_000);
    expect(plan.installments[11].balanceAfter).toBe(0);
  });

  it('ALEMAN: 1.200.000 al 3% a 3 → 436/424/412 mil', () => {
    const plan = buildLoanPlan({ principal: 1_200_000, interestRate: 3, termCount: 3, amortization: 'ALEMAN' });
    expect(plan.installments.map((i) => i.total)).toEqual([436_000, 424_000, 412_000]);
    expect(plan.totalInterest).toBe(72_000);
  });

  it('sin capital o sin plazo no hay plan (la UI no pinta nada)', () => {
    expect(buildLoanPlan({ principal: 0, termCount: 3 })).toBeNull();
    expect(buildLoanPlan({ principal: 100000, termCount: 0 })).toBeNull();
  });

  it('mora: días calendario, gracia y tasa', () => {
    const due = d(2026, 1, 1);
    expect(daysLate(due, d(2026, 1, 11))).toBe(10);
    expect(computeMora({ overdueCapital: 100_000, dueDate: due, now: d(2026, 1, 11), moraRate: 3, graceDays: 3 })).toBe(1_000);
    expect(computeMora({ overdueCapital: 100_000, dueDate: due, now: d(2026, 1, 3), moraRate: 3, graceDays: 3 })).toBe(0);
  });

  it('utilidades: redondeo y semáforo de mora', () => {
    expect(roundToMultiple(95_833, 1000)).toBe(96_000);
    expect(overdueTone(0).label).toBe('Al día');
    expect(overdueTone(1).label).toBe('1 día');
    expect(overdueTone(45).cls).toMatch(/red/);
  });
});
