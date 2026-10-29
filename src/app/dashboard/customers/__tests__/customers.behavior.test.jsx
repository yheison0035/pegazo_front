import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { within } from '@testing-library/react';
import {
  installApi,
  on,
  list,
  detail,
  ok,
  fail,
  baseRoutes,
  resetBehavior,
  renderPage,
  settle,
  screen,
  waitFor,
  click,
  typeInto,
  setField,
  button,
  buttons,
  rowButton,
  queryRowButton,
  waitForCall,
  expectToast,
  router,
  authState,
  navState,
  toast,
  pickDepartmentAndCity,
} from '@/test/behaviorHarness';
import CustomersPage from '../page';
import NewCustomerPage from '../new/page';
import EditCustomerPage from '../edit/[id]/page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const CUSTOMERS = [
  { id: 1, type_document: 'CC', document: '1001', name: 'ANA PÉREZ', email: 'ana@test.com', phone: '3001234567', city: 'Bogotá', status: 'ACTIVO', source: 'CRM', local: { id: 1, name: 'Sede Centro' }, localId: 1, createdAt: '2026-01-10T10:00:00.000Z' },
  { id: 2, type_document: 'NIT', document: '900123', name: 'EMPRESA SAS', email: 'empresa@test.com', phone: '3109876543', city: 'Cali', status: 'ACTIVO', source: 'ECOMMERCE', local: { id: 1, name: 'Sede Centro' }, localId: 1, createdAt: '2026-01-11T10:00:00.000Z' },
];

function customersApi(extra = []) {
  return installApi([
    ...extra,
    on('GET', /^\/customers$/, list(CUSTOMERS, { total: 25, limit: 10 })),
    on('GET', /^\/customers\/\d+$/, detail(CUSTOMERS[0])),
    on('DELETE', /^\/customers\/\d+$/, ok()),
    on('POST', /^\/customers$/, ok({ id: 9 })),
    on('PUT', /^\/customers\/\d+$/, ok({ id: 1 })),
    ...baseRoutes(),
  ]);
}

describe('Clientes · listado', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = customersApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga la primera página y muestra las filas', async () => {
    await renderPage(<CustomersPage />);
    const call = await waitForCall(api, 'GET', /^\/customers$/);
    expect(call.query).toMatchObject({ page: '1', limit: '10' });
    expect(call.headers.Authorization).toBe('Bearer test-token');
    expect(screen.getByText('ANA PÉREZ')).toBeInTheDocument();
    expect(screen.getByText('EMPRESA SAS')).toBeInTheDocument();
    expect(screen.getByText('Listado de Clientes')).toBeInTheDocument();
  });

  it('el buscador por columna manda el filtro al backend (con debounce)', async () => {
    await renderPage(<CustomersPage />);
    await waitForCall(api, 'GET', /^\/customers$/);
    const input = screen.getAllByPlaceholderText('Filtrar Nombre Completo')[0];
    await typeInto(input, 'ANA');
    const call = await waitForCall(api, 'GET', /^\/customers$/, { count: 2 });
    expect(call.query).toMatchObject({ name: 'ANA', page: '1' });
  });

  it('un filtro de selección (documento) también viaja en la query', async () => {
    await renderPage(<CustomersPage />);
    await waitForCall(api, 'GET', /^\/customers$/);
    await typeInto(screen.getAllByPlaceholderText('Filtrar Documento')[0], '900');
    const call = await waitForCall(api, 'GET', /^\/customers$/, { count: 2 });
    expect(call.query.document).toBe('900');
  });

  it('paginación: siguiente página y filas por página', async () => {
    await renderPage(<CustomersPage />);
    await waitForCall(api, 'GET', /^\/customers$/);
    await click(buttons('→')[0]);
    let call = await waitForCall(api, 'GET', /^\/customers$/, { count: 2 });
    expect(call.query.page).toBe('2');

    const select = screen.getAllByDisplayValue('10')[0];
    await typeInto(select, '20');
    call = await waitForCall(api, 'GET', /^\/customers$/, { count: 3 });
    expect(call.query).toMatchObject({ limit: '20', page: '1' });
  });

  it('ver detalle abre la ficha y se puede cerrar', async () => {
    await renderPage(<CustomersPage />);
    await waitForCall(api, 'GET', /^\/customers$/);
    await click(rowButton('ANA PÉREZ', 'Ver detalle'));
    const modal = screen.getByText('Detalles del Cliente').closest('.fixed');
    expect(within(modal).getByText('ana@test.com')).toBeInTheDocument();
    expect(within(modal).getByText('Bogotá')).toBeInTheDocument();
    await click(within(modal).getAllByRole('button')[0]);
    expect(screen.queryByText('Detalles del Cliente')).not.toBeInTheDocument();
  });

  it('eliminar pide confirmación, llama DELETE y recarga la lista', async () => {
    await renderPage(<CustomersPage />);
    await waitForCall(api, 'GET', /^\/customers$/);
    await click(rowButton('EMPRESA SAS', 'Eliminar'));
    const modal = screen.getByText('Confirmar eliminación').parentElement;
    expect(within(modal).getByText('EMPRESA SAS')).toBeInTheDocument();
    expect(api.count('DELETE', /^\/customers/)).toBe(0);
    await click(within(modal).getByRole('button', { name: 'Eliminar' }));
    const del = await waitForCall(api, 'DELETE', /^\/customers\/2$/);
    expect(del).toBeTruthy();
    await waitForCall(api, 'GET', /^\/customers$/, { count: 2 });
    expect(screen.queryByText('Confirmar eliminación')).not.toBeInTheDocument();
  });

  it('cancelar la eliminación no llama al backend', async () => {
    await renderPage(<CustomersPage />);
    await waitForCall(api, 'GET', /^\/customers$/);
    await click(rowButton('ANA PÉREZ', 'Eliminar'));
    const modal = screen.getByText('Confirmar eliminación').parentElement;
    await click(within(modal).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('Confirmar eliminación')).not.toBeInTheDocument();
    expect(api.count('DELETE', /^\/customers/)).toBe(0);
  });

  it('el enlace "Agregar" lleva al formulario de creación y "Editar" al de edición', async () => {
    await renderPage(<CustomersPage />);
    await waitForCall(api, 'GET', /^\/customers$/);
    expect(screen.getByText('Agregar cliente').closest('a')).toHaveAttribute('href', '/dashboard/customers/new');
    expect(rowButton('ANA PÉREZ', 'Editar')).toHaveAttribute('href', '/dashboard/customers/edit/1');
  });

  it('deep link ?open=<id> abre la ficha directamente y limpia la URL', async () => {
    navState.search = 'open=2';
    api.set('GET', /^\/customers\/\d+$/, detail(CUSTOMERS[1]));
    await renderPage(<CustomersPage />);
    await waitForCall(api, 'GET', /^\/customers\/2$/);
    expect(await screen.findByText('Detalles del Cliente')).toBeInTheDocument();
    expect(router.replace).toHaveBeenCalledWith('/dashboard/customers');
  });

  it('si el backend falla al borrar, el error llega como aviso', async () => {
    api.set('DELETE', /^\/customers\/\d+$/, fail(400, 'El cliente tiene ventas asociadas'));
    await renderPage(<CustomersPage />);
    await waitForCall(api, 'GET', /^\/customers$/);
    await click(rowButton('ANA PÉREZ', 'Eliminar'));
    const modal = screen.getByText('Confirmar eliminación').parentElement;
    await click(within(modal).getByRole('button', { name: 'Eliminar' }));
    await waitForCall(api, 'DELETE', /^\/customers\/1$/);
    await expectToast('error', 'ventas asociadas');
    expect(screen.queryByText('Confirmar eliminación')).not.toBeInTheDocument();
    expect(screen.getByText('ANA PÉREZ')).toBeInTheDocument();
  });
});

describe('Clientes · permisos por rol', () => {
  afterEach(() => vi.restoreAllMocks());

  it('el barbero no entra: se redirige al dashboard y no ve la tabla', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    customersApi();
    await renderPage(<CustomersPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
    expect(screen.queryByText(/Listado de/)).not.toBeInTheDocument();
  });

  it('el asesor ve y edita pero no puede eliminar', async () => {
    resetBehavior({ role: 'ASESOR' });
    const api = customersApi();
    await renderPage(<CustomersPage />);
    await waitForCall(api, 'GET', /^\/customers$/);
    expect(rowButton('ANA PÉREZ', 'Ver detalle')).toBeTruthy();
    expect(rowButton('ANA PÉREZ', 'Editar')).toBeTruthy();
    expect(queryRowButton('ANA PÉREZ', 'Eliminar')).toBeNull();
  });

  it('el administrador sí puede eliminar clientes', async () => {
    resetBehavior({ role: 'ADMIN' });
    const api = customersApi();
    await renderPage(<CustomersPage />);
    await waitForCall(api, 'GET', /^\/customers$/);
    expect(rowButton('ANA PÉREZ', 'Eliminar')).toBeTruthy();
  });
});

describe('Clientes · crear', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = customersApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('carga los desplegables (sedes) desde el backend', async () => {
    await renderPage(<NewCustomerPage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await waitFor(() => expect(screen.getByText('Sede Centro')).toBeInTheDocument());
  });

  it('guarda con POST /customers y el cuerpo normalizado', async () => {
    await renderPage(<NewCustomerPage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    await settle();
    setField('type_document', 'CC');
    setField('document', '1002');
    setField('name', 'carlos ruiz');
    setField('email', 'carlos@test.com');
    setField('phone', '3005551234');
    setField('localId', '1');
    const { dep, city } = pickDepartmentAndCity();
    await click(button('Guardar'));
    const call = await waitForCall(api, 'POST', /^\/customers$/);
    expect(call.body.department).toBe(dep);
    expect(call.body.city).toBe(city);
    expect(call.body).toMatchObject({
      type_document: 'CC',
      document: '1002',
      name: 'CARLOS RUIZ',
      email: 'carlos@test.com',
      phone: '3005551234',
      localId: 1,
    });
    expect(call.body.birthday).toBeUndefined();
    const t = await expectToast('success', 'Cliente creado');
    expect(t.url).toBe('/dashboard/customers');
  });

  it('no envía nada si el correo o el celular son inválidos', async () => {
    await renderPage(<NewCustomerPage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    setField('name', 'Alguien');
    setField('email', 'correo-malo');
    setField('phone', '123');
    pickDepartmentAndCity();
    await click(button('Guardar'));
    await settle();
    expect(screen.getByText('Ingresa un correo válido')).toBeInTheDocument();
    expect(screen.getByText(/Ingresa un celular válido/)).toBeInTheDocument();
    expect(api.count('POST', /^\/customers$/)).toBe(0);
  });

  it('departamento y ciudad son opcionales: se guarda sin ellos', async () => {
    await renderPage(<NewCustomerPage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    setField('name', 'Carlos');
    setField('email', 'carlos@test.com');
    setField('phone', '3005551234');
    expect(document.querySelector('form').checkValidity()).toBe(true);
    await click(button('Guardar'));
    const call = await waitForCall(api, 'POST', /^\/customers$/);
    expect(call.body.department).toBe('');
  });

  it('"Limpiar" vacía el formulario', async () => {
    await renderPage(<NewCustomerPage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    setField('name', 'Alguien');
    expect(document.querySelector('[name="name"]').value).toBe('ALGUIEN');
    await click(button('Limpiar'));
    expect(document.querySelector('[name="name"]').value).toBe('');
  });

  it('un error del backend se muestra como aviso y no navega', async () => {
    api.set('POST', /^\/customers$/, fail(400, 'Ya existe un cliente con ese documento'));
    await renderPage(<NewCustomerPage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    setField('name', 'Carlos');
    setField('email', 'carlos@test.com');
    setField('phone', '3005551234');
    pickDepartmentAndCity();
    await click(button('Guardar'));
    await waitForCall(api, 'POST', /^\/customers$/);
    const t = await expectToast('error', 'Ya existe un cliente');
    expect(t.url).toBeFalsy();
  });

  it('al marcar factura electrónica aparecen los campos DIAN', async () => {
    await renderPage(<NewCustomerPage />);
    await waitForCall(api, 'GET', /^\/locals$/);
    expect(document.querySelector('[name="personType"]')).toBeNull();
    await click(screen.getByText('Recibe factura electrónica (DIAN)'));
    expect(document.querySelector('[name="personType"]')).not.toBeNull();
    expect(document.querySelector('[name="taxResponsibility"]')).not.toBeNull();
  });
});

describe('Clientes · editar', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    authState.params = { id: '1' };
    api = customersApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('precarga el cliente y guarda con PUT sin campos de solo lectura', async () => {
    await renderPage(<EditCustomerPage />);
    await waitForCall(api, 'GET', /^\/customers\/1$/);
    await waitFor(() => expect(document.querySelector('[name="name"]').value).toBe('ANA PÉREZ'));
    setField('phone', '3010000000');
    await click(button('Guardar'));
    const call = await waitForCall(api, 'PUT', /^\/customers\/1$/);
    expect(call.body.phone).toBe('3010000000');
    expect(call.body.name).toBe('ANA PÉREZ');
    expect(call.body.id).toBeUndefined();
    expect(call.body.createdAt).toBeUndefined();
    expect(call.body.local).toBeUndefined();
    const t = await expectToast('success', 'Cliente actualizado');
    expect(t.url).toBe('/dashboard/customers');
  });

  it('si el cliente no existe se avisa y se vuelve al listado', async () => {
    api.set('GET', /^\/customers\/\d+$/, fail(404, 'Cliente no encontrado'));
    await renderPage(<EditCustomerPage />);
    await waitForCall(api, 'GET', /^\/customers\/1$/);
    const t = await expectToast('warning', 'Cliente no encontrado');
    expect(t.url).toBe('/dashboard/customers');
    expect(toast.show).toHaveBeenCalledTimes(1);
  });

  it('en edición no hay botón Limpiar pero sí Volver', async () => {
    await renderPage(<EditCustomerPage />);
    await waitForCall(api, 'GET', /^\/customers\/1$/);
    expect(screen.queryByRole('button', { name: 'Limpiar' })).toBeNull();
    expect(screen.getByText('Volver')).toBeInTheDocument();
  });
});
