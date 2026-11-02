import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import AppointmentsCalendar from '../AppointmentsCalendar';

// El tiempo real se inyecta capturando el callback de subscribeRealtime, para
// simular un evento del backend (nueva reserva online, edición, cancelación…).
let realtimeCb = null;
vi.mock('@/lib/realtime', () => ({
  subscribeRealtime: (fn) => {
    realtimeCb = fn;
    return () => {
      realtimeCb = null;
    };
  },
}));
vi.mock('@/context/authContext', () => ({
  useAuth: () => ({ usuario: { role: 'SUPER_ADMIN', company: {} } }),
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...r }) => (
    <a href={typeof href === 'string' ? href : '#'} {...r}>
      {children}
    </a>
  ),
}));

const monthMock = vi.hoisted(() => ({
  getAppointmentsMonth: vi.fn(async () => ({ data: [] })),
  deleteAppointment: vi.fn(async () => ({ success: true })),
}));
vi.mock('@/lib/api/routes/appointments', () => monthMock);
vi.mock('@/lib/api/routes/restDays', () => ({
  getMyRestDays: vi.fn(async () => ({ data: null })),
  getRestDaysOverview: vi.fn(async () => ({ data: [] })),
}));

describe('Calendario de citas · tiempo real', () => {
  beforeEach(() => {
    realtimeCb = null;
    monthMock.getAppointmentsMonth.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('se recarga solo cuando llega un evento de tiempo real (como inventario)', async () => {
    await act(async () => {
      render(<AppointmentsCalendar />);
    });
    // Carga inicial del mes.
    await waitFor(() =>
      expect(monthMock.getAppointmentsMonth).toHaveBeenCalledTimes(1),
    );
    // Se suscribió al tiempo real.
    expect(typeof realtimeCb).toBe('function');
    // Llega un evento (p. ej. una reserva online nueva) → el calendario reconsulta.
    await act(async () => {
      realtimeCb({ resource: 'appointments', action: 'create' });
      // useLiveRefresh agrupa ráfagas con un debounce de 400 ms.
      await new Promise((r) => setTimeout(r, 500));
    });
    await waitFor(() =>
      expect(
        monthMock.getAppointmentsMonth.mock.calls.length,
      ).toBeGreaterThanOrEqual(2),
    );
  });

  it('al abrir un día muestra Editar y Eliminar (como en la lista) y elimina', async () => {
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-15`;
    const appt = {
      id: 77,
      date: `${iso}T10:00:00.000Z`,
      startTime: '10:00 a. m.',
      status: 'CONFIRMADA',
      customer: { name: 'Carla Vendedora' },
      service: { name: 'Corte' },
      barber: { name: 'Luis' },
      sales: [],
    };
    monthMock.getAppointmentsMonth.mockResolvedValue({ data: [appt] });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await act(async () => {
      render(<AppointmentsCalendar />);
    });
    await waitFor(() => expect(screen.getAllByText(/Carla/).length).toBeGreaterThan(0));
    // Abrir el día (la celda muestra la cita).
    const cell = screen.getAllByText(/Carla/)[0].closest('button');
    await act(async () => {
      fireEvent.click(cell);
    });
    // En el modal del día aparecen las mismas opciones que en la lista.
    const editar = await screen.findByRole('link', { name: /Editar/ });
    expect(editar).toHaveAttribute('href', '/dashboard/appointments/edit/77');
    const eliminar = screen.getByRole('button', { name: /Eliminar/ });
    await act(async () => {
      fireEvent.click(eliminar);
    });
    await waitFor(() => expect(monthMock.deleteAppointment).toHaveBeenCalledWith(77));
  });
});
