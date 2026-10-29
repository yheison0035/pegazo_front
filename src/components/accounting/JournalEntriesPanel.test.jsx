import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JournalEntriesPanel from './JournalEntriesPanel';

vi.mock('@/lib/accounting/xlsxIO', () => ({
  downloadWorkbook: vi.fn(),
  readAllSheets: vi.fn(),
}));

const accounts = [
  { id: 1, code: '1105', name: 'CAJA', type: 'ASSET', nature: 'DEBIT' },
  { id: 2, code: '3115', name: 'CAPITAL', type: 'EQUITY', nature: 'CREDIT' },
  { id: 3, code: '4135', name: 'VENTAS', type: 'INCOME', nature: 'CREDIT' },
];
const entry = {
  id: 10,
  date: '2026-02-10T00:00:00.000Z',
  description: 'Aporte socio',
  reference: 'R-1',
  lines: [
    { id: 1, accountCode: '1105', accountName: 'CAJA', debit: 500000, credit: 0 },
    { id: 2, accountCode: '3115', accountName: 'CAPITAL', debit: 0, credit: 500000 },
  ],
};

function makeApi(overrides = {}) {
  return {
    listEntries: vi.fn().mockResolvedValue({ data: [entry] }),
    getAccounts: vi.fn().mockResolvedValue({ data: accounts }),
    createEntry: vi.fn().mockResolvedValue({ success: true }),
    updateEntry: vi.fn().mockResolvedValue({ success: true }),
    deleteEntry: vi.fn().mockResolvedValue({ success: true }),
    importEntries: vi.fn().mockResolvedValue({ data: { total: 1, created: 1, errors: [] } }),
    uploadDoc: vi.fn(),
    ...overrides,
  };
}

describe('JournalEntriesPanel', () => {
  it('lista los asientos y muestra las acciones principales', async () => {
    render(<JournalEntriesPanel api={makeApi()} companyName="Mi Tienda" />);
    expect(await screen.findByText('Aporte socio')).toBeInTheDocument();
    expect(screen.getByText('Plantilla')).toBeInTheDocument();
    expect(screen.getByText('Importar Excel')).toBeInTheDocument();
    expect(screen.getByText('Saldos iniciales')).toBeInTheDocument();
    expect(screen.getByText('Nuevo asiento')).toBeInTheDocument();
    // Sin setClose no se muestra el cierre de periodo.
    expect(screen.queryByText('Cierre de periodo:')).not.toBeInTheDocument();
  });

  it('editar abre el modal con las líneas del asiento y guarda por updateEntry', async () => {
    const api = makeApi();
    render(<JournalEntriesPanel api={api} />);
    await screen.findByText('Aporte socio');
    fireEvent.click(screen.getByTitle('Editar'));
    expect(screen.getByText('Editar asiento')).toBeInTheDocument();
    const desc = screen.getByPlaceholderText('Ej: Compra de mercancía');
    expect(desc.value).toBe('Aporte socio');
    fireEvent.change(desc, { target: { value: 'Aporte socio (corregido)' } });
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() => expect(api.updateEntry).toHaveBeenCalledTimes(1));
    const [id, payload] = api.updateEntry.mock.calls[0];
    expect(id).toBe(10);
    expect(payload.description).toBe('Aporte socio (corregido)');
    expect(payload.lines).toEqual([
      { accountCode: '1105', accountName: 'CAJA', debit: 500000, credit: 0 },
      { accountCode: '3115', accountName: 'CAPITAL', debit: 0, credit: 500000 },
    ]);
  });

  it('un asiento en periodo cerrado no se puede editar ni eliminar', async () => {
    render(<JournalEntriesPanel api={makeApi()} booksClosedUntil="2026-03-31T00:00:00.000Z" />);
    await screen.findByText('Aporte socio');
    expect(screen.getByText('Periodo cerrado')).toBeInTheDocument();
    expect(screen.queryByTitle('Editar')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Eliminar')).not.toBeInTheDocument();
  });

  it('eliminar pide confirmación antes de llamar a la API', async () => {
    const api = makeApi();
    render(<JournalEntriesPanel api={api} />);
    await screen.findByText('Aporte socio');
    fireEvent.click(screen.getByTitle('Eliminar'));
    expect(api.deleteEntry).not.toHaveBeenCalled();
    // El modal de confirmación tiene su propio botón "Eliminar" (el último).
    const buttons = screen.getAllByRole('button', { name: 'Eliminar' });
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(api.deleteEntry).toHaveBeenCalledWith(10));
  });

  it('muestra el cierre de periodo cuando la API lo soporta', async () => {
    const api = makeApi({ setClose: vi.fn().mockResolvedValue({ data: { booksClosedUntil: '2026-01-31T00:00:00.000Z' } }) });
    const onCloseChange = vi.fn();
    render(<JournalEntriesPanel api={api} onCloseChange={onCloseChange} />);
    await screen.findByText('Aporte socio');
    expect(screen.getByText('Cierre de periodo:')).toBeInTheDocument();
  });
});
