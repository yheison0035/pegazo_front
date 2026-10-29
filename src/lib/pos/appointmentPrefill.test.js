import { describe, it, expect } from 'vitest';
import { prefillFromAppointment, servicePriceForLocal, canChargeAppointment } from './appointmentPrefill';

const appt = {
  id: 44, localId: 2, barberId: 9, status: 'CONFIRMADA',
  customer: { id: 5, name: 'Ana' },
  service: { id: 7, name: 'Corte', taxRate: '0', serviceLocals: [{ localId: 1, price: 20000 }, { localId: 2, price: 25000 }] },
};

describe('servicePriceForLocal', () => {
  it('usa el precio de la sede de la cita', () => expect(servicePriceForLocal(appt.service, 2)).toBe(25000));
  it('si la sede no tiene precio, usa el primero; sin precios → 0', () => {
    expect(servicePriceForLocal(appt.service, 99)).toBe(20000);
    expect(servicePriceForLocal({ serviceLocals: [] }, 1)).toBe(0);
    expect(servicePriceForLocal(null, 1)).toBe(0);
  });
});

describe('prefillFromAppointment (agenda → POS)', () => {
  it('arma carrito con el servicio, cliente, atendedor y sede, enlazando la cita', () => {
    const p = prefillFromAppointment(appt);
    expect(p.appointmentId).toBe(44);
    expect(p.localId).toBe(2);
    expect(p.sellerId).toBe(9);
    expect(p.customer).toEqual({ id: 5, name: 'Ana' });
    expect(p.cart).toEqual([
      { key: 's7', type: 'service', refId: 7, name: 'Corte', price: 25000, taxRate: 0, unit: 'UNIDAD', quantity: 1, discount: 0 },
    ]);
  });
  it('sin cita o sin servicio devuelve null', () => {
    expect(prefillFromAppointment(null)).toBeNull();
    expect(prefillFromAppointment({ id: 1 })).toBeNull();
  });
});

describe('canChargeAppointment', () => {
  it('se cobra si no está cancelada/no asistida y no tiene venta', () => {
    expect(canChargeAppointment(appt)).toBe(true);
    expect(canChargeAppointment({ ...appt, status: 'CANCELADA' })).toBe(false);
    expect(canChargeAppointment({ ...appt, status: 'NO_ASISTIO' })).toBe(false);
    expect(canChargeAppointment({ ...appt, sales: [{ id: 1 }] })).toBe(false);
    expect(canChargeAppointment({ ...appt, status: 'COMPLETADA' })).toBe(true);
  });
});
