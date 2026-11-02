import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// El negocio maneja horarios distintos de lunes a domingo (y puede cerrar un
// día). De este horario dependen las citas: lo que se guarda aquí alimenta la
// disponibilidad. Por eso se prueba que se inicializa, se edita por día y se
// envía como weekHours (clave 0=Dom..6=Sáb).
const companyMock = vi.hoisted(() => ({
  updateCompanyHours: vi.fn(async () => ({ success: true })),
}));
vi.mock('@/lib/api/routes/company', () => companyMock);

import { HoursCard } from '../page';

describe('HoursCard · horario por día', () => {
  beforeEach(() => {
    companyMock.updateCompanyHours.mockClear();
  });

  it('muestra los 7 días de la semana', () => {
    render(<HoursCard initial={{ openHour: 9, closeHour: 20 }} />);
    for (const d of ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']) {
      expect(screen.getByText(d)).toBeInTheDocument();
    }
  });

  it('inicializa cada día desde weekHours si existe', () => {
    render(
      <HoursCard
        initial={{
          openHour: 9,
          closeHour: 20,
          weekHours: { 1: { open: 10, close: 14, closed: false } },
        }}
      />,
    );
    // Lunes abre a las 10:00 y cierra a las 14:00.
    expect(screen.getByLabelText('Lunes abre')).toHaveValue('10');
    expect(screen.getByLabelText('Lunes cierra')).toHaveValue('14');
  });

  it('al marcar "Cerrado" deshabilita las horas de ese día', () => {
    render(<HoursCard initial={{ openHour: 9, closeHour: 20 }} />);
    const row = screen.getByText('Domingo').closest('div');
    const cerrado = row.querySelector('input[type="checkbox"]');
    fireEvent.click(cerrado);
    expect(screen.getByLabelText('Domingo abre')).toBeDisabled();
  });

  it('guarda enviando weekHours con el día cerrado marcado', async () => {
    render(<HoursCard initial={{ openHour: 9, closeHour: 20 }} />);
    // Cerrar el domingo (clave 0).
    const row = screen.getByText('Domingo').closest('div');
    fireEvent.click(row.querySelector('input[type="checkbox"]'));
    // Cambiar la apertura del lunes (clave 1) a las 11:00.
    fireEvent.change(screen.getByLabelText('Lunes abre'), { target: { value: '11' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    });

    await waitFor(() => expect(companyMock.updateCompanyHours).toHaveBeenCalledTimes(1));
    const payload = companyMock.updateCompanyHours.mock.calls[0][0];
    expect(payload.weekHours[0].closed).toBe(true); // domingo cerrado
    expect(payload.weekHours[1].open).toBe(11); // lunes abre a las 11
  });
});
