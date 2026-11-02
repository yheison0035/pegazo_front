import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import AppointmentNotifier from '../AppointmentNotifier';

const sound = vi.hoisted(() => ({ chime: vi.fn(), speak: vi.fn(), primeAudio: vi.fn() }));
vi.mock('@/lib/bankSound', () => sound);
vi.mock('@/lib/appointmentsAccess', () => ({ usesAppointments: () => true }));
const routerPush = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: routerPush }) }));
vi.mock('@/context/authContext', () => ({
  useAuth: () => ({ usuario: { role: 'RECEPCIONISTA', company: { enabledModules: ['appointments'], plan: 'ORBITA' } } }),
}));
const api = vi.hoisted(() => ({
  getRecentPendingAppointments: vi.fn(async () => ({ data: [] })),
}));
vi.mock('@/lib/api/routes/appointments', () => api);

const APPT = {
  id: 55,
  date: '2026-11-10T00:00:00.000Z',
  startTime: '10:00 a. m.',
  status: 'PENDIENTE',
  customer: { name: 'Carla Vendedora' },
  service: { name: 'Corte' },
  barber: { name: 'Luis' },
};

describe('AppointmentNotifier · aviso de nueva cita', () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch { /* noop */ }
    api.getRecentPendingAppointments.mockResolvedValue({ data: [APPT] });
    sound.speak.mockClear();
    routerPush.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('anuncia por voz y muestra la tarjeta con Ver y Confirmar', async () => {
    await act(async () => {
      render(<AppointmentNotifier />);
    });
    expect(await screen.findByText('Nueva cita')).toBeInTheDocument();
    expect(screen.getByText('Carla Vendedora')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver más/ })).toBeInTheDocument();
    // La confirmación es automática: no hay botón "Confirmar".
    expect(screen.queryByRole('button', { name: /Confirmar/ })).toBeNull();
    // Voz + campana con el dato de la cita.
    await waitFor(() => expect(sound.speak).toHaveBeenCalledTimes(1));
    expect(sound.speak.mock.calls[0][0]).toMatch(/Carla Vendedora/);
  });

  it('Ver navega a la agenda de citas', async () => {
    await act(async () => {
      render(<AppointmentNotifier />);
    });
    await screen.findByText('Nueva cita');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ver más/ }));
    });
    expect(routerPush).toHaveBeenCalledWith('/dashboard/appointments');
  });

  it('no re-anuncia la misma cita en el siguiente sondeo', async () => {
    await act(async () => {
      render(<AppointmentNotifier />);
    });
    await screen.findByText('Nueva cita');
    expect(sound.speak).toHaveBeenCalledTimes(1);
    // Cierra la tarjeta y simula otro ciclo con la MISMA cita.
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Cerrar'));
      await new Promise((r) => setTimeout(r, 5200));
    });
    expect(sound.speak).toHaveBeenCalledTimes(1); // no vuelve a sonar
  });
});
