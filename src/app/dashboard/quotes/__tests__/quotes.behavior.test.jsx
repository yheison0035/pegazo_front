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
  button,
  placeholder,
  waitForCall,
  expectToast,
  router,
  money,
} from '@/test/behaviorHarness';
import QuotesPage from '../page';

vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));

const QUOTES = [
  { id: 1, code: 'COT-0001', customer: { id: 1, name: 'ANA PÉREZ' }, _count: { items: 1 }, total: 50000, status: 'PENDIENTE', createdAt: '2026-02-10T10:00:00.000Z' },
  { id: 2, code: 'COT-0002', customer: null, _count: { items: 2 }, total: 90000, status: 'CONVERTIDA', createdAt: '2026-02-11T10:00:00.000Z' },
];
const DETAIL = { id: 1, code: 'COT-0001', status: 'PENDIENTE', total: 50000, notes: 'Entrega en 3 días', customer: { name: 'ANA PÉREZ' }, items: [{ id: 1, name: 'CAMISETA BÁSICA', quantity: 2, price: 25000, subtotal: 50000 }] };
const SEARCH = [{ id: 5, type: 'product', name: 'CAMISETA BÁSICA', color: 'ÚNICO', stock: 12, price: 25000, unit: 'UNIDAD' }];

function quotesApi() {
  return installApi([
    on('GET', /^\/quotes$/, list(QUOTES, { total: 2 })),
    on('GET', /^\/quotes\/2$/, detail({ ...DETAIL, id: 2, code: 'COT-0002', status: 'CONVERTIDA' })),
    on('GET', /^\/quotes\/\d+$/, detail(DETAIL)),
    on('POST', /^\/quotes$/, ok({ id: 3, code: 'COT-0003' })),
    on('PATCH', /^\/quotes\/\d+\/accept$/, ok({ id: 1 })),
    on('PATCH', /^\/quotes\/\d+\/reject$/, ok({ id: 1 })),
    on('POST', /^\/quotes\/\d+\/convert$/, ok({ saleId: 77 })),
    on('DELETE', /^\/quotes\/\d+$/, ok()),
    on('GET', /^\/inventory\/search\//, ok(SEARCH)),
    on('GET', /^\/customers$/, list([{ id: 1, name: 'ANA PÉREZ', document: '1001', phone: '3001234567' }])),
    ...baseRoutes(),
  ]);
}

async function openDetail(api, code = 'COT-0001', index = 0) {
  await renderPage(<QuotesPage />);
  await waitForCall(api, 'GET', /^\/quotes$/);
  await click(screen.getAllByRole('button', { name: 'Ver' })[index]);
  const modal = (await screen.findByRole('heading', { name: code })).closest('.fixed');
  return modal;
}

describe('Cotizaciones', () => {
  let api;
  beforeEach(() => {
    resetBehavior();
    api = quotesApi();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista las cotizaciones con cliente, total y estado', async () => {
    await renderPage(<QuotesPage />);
    const call = await waitForCall(api, 'GET', /^\/quotes$/);
    expect(call.query).toMatchObject({ page: '1', limit: '10' });
    expect(screen.getByText('COT-0001')).toBeInTheDocument();
    expect(screen.getByText('COT-0002')).toBeInTheDocument();
    expect(screen.getByText('ANA PÉREZ')).toBeInTheDocument();
  });

  it('el detalle de una pendiente permite aceptar, rechazar, convertir y eliminar', async () => {
    const modal = await openDetail(api);
    expect(within(modal).getByText('CAMISETA BÁSICA')).toBeInTheDocument();
    await click(within(modal).getByRole('button', { name: /Aceptar/ }));
    await waitForCall(api, 'PATCH', /^\/quotes\/1\/accept$/);
    await expectToast('success', 'Cotización aceptada');
  });

  it('rechazar llama /reject y eliminar llama DELETE', async () => {
    let modal = await openDetail(api);
    await click(within(modal).getByRole('button', { name: /Rechazar/ }));
    await waitForCall(api, 'PATCH', /^\/quotes\/1\/reject$/);
    await expectToast('success', 'Cotización rechazada');
    await waitForCall(api, 'GET', /^\/quotes$/, { count: 2 });

    await click(screen.getAllByRole('button', { name: 'Ver' })[0]);
    modal = (await screen.findByRole('heading', { name: 'COT-0001' })).closest('.fixed');
    await click(within(modal).getByRole('button', { name: /Eliminar/ }));
    await waitForCall(api, 'DELETE', /^\/quotes\/1$/);
    await expectToast('success', 'Cotización eliminada');
  });

  it('convertir en venta crea la factura en efectivo', async () => {
    const modal = await openDetail(api);
    await click(within(modal).getByRole('button', { name: /Convertir en venta/ }));
    const call = await waitForCall(api, 'POST', /^\/quotes\/1\/convert$/);
    expect(call.body).toEqual({ paymentMethod: 'EFECTIVO' });
    await expectToast('success', 'convertida en venta');
  });

  it('una cotización ya convertida no ofrece acciones', async () => {
    const modal = await openDetail(api, 'COT-0002', 1);
    expect(within(modal).queryByRole('button', { name: /Aceptar/ })).toBeNull();
    expect(within(modal).queryByRole('button', { name: /Convertir/ })).toBeNull();
    expect(within(modal).queryByRole('button', { name: /Eliminar/ })).toBeNull();
  });

  it('crea una cotización con cliente, ítems (cantidad y precio), vigencia y notas', async () => {
    await renderPage(<QuotesPage />);
    await waitForCall(api, 'GET', /^\/quotes$/);
    await waitForCall(api, 'GET', /^\/locals$/);
    await click(button(/Nueva cotización/));
    expect(button('Crear cotización')).toBeDisabled();

    await typeInto(placeholder('Buscar cliente por nombre'), 'ana');
    await waitForCall(api, 'GET', /^\/customers$/);
    await click(await screen.findByRole('button', { name: /ANA PÉREZ/ }));

    await typeInto(placeholder('Busca por nombre o SKU (mín. 2 letras)'), 'cami');
    await waitForCall(api, 'GET', /^\/inventory\/search\/cami/);
    await click(await screen.findByRole('button', { name: /CAMISETA BÁSICA/ }));
    const row = screen.getByText('CAMISETA BÁSICA').closest('tr');
    await typeInto(within(row).getByDisplayValue('1'), '3');
    await typeInto(within(row).getByPlaceholderText('$ 0'), '24000');
    expect(within(row).getByText(money(72000))).toBeInTheDocument();

    const date = document.querySelector('input[type="date"]');
    await typeInto(date, '2026-03-15');
    await typeInto(placeholder('Notas (opcional)'), 'precio especial');
    await click(button('Crear cotización'));
    const call = await waitForCall(api, 'POST', /^\/quotes$/);
    expect(call.body).toEqual({
      localId: 1,
      customerId: 1,
      notes: 'precio especial',
      validUntil: '2026-03-15',
      items: [{ inventoryVariantId: 5, name: 'CAMISETA BÁSICA', quantity: 3, price: 24000 }],
    });
    await expectToast('success', 'Cotización creada');
    await waitForCall(api, 'GET', /^\/quotes$/, { count: 2 });
  });

  it('un error del backend al crear se avisa y la cotización sigue en pantalla', async () => {
    api.set('POST', /^\/quotes$/, fail(400, 'El cliente está inactivo'));
    await renderPage(<QuotesPage />);
    await waitForCall(api, 'GET', /^\/quotes$/);
    await click(button(/Nueva cotización/));
    await typeInto(placeholder('Busca por nombre o SKU (mín. 2 letras)'), 'cami');
    await click(await screen.findByRole('button', { name: /CAMISETA BÁSICA/ }));
    await click(button('Crear cotización'));
    await waitForCall(api, 'POST', /^\/quotes$/);
    await expectToast('error', 'cliente está inactivo');
    expect(screen.getByText('CAMISETA BÁSICA')).toBeInTheDocument();
  });

  it('el barbero no entra a cotizaciones', async () => {
    resetBehavior({ type: 'BARBERIA', role: 'BARBERO' });
    quotesApi();
    await renderPage(<QuotesPage />);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
