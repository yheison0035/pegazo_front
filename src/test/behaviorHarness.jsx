// Arnés de las pruebas de COMPORTAMIENTO por módulo (Testing Library).
//
// A diferencia de las pruebas de humo (que solo comprueban que la pantalla
// carga), aquí se ejercita cada acción: buscar, filtrar, paginar, abrir el
// detalle, crear, editar, eliminar, exportar, importar… y se verifica la
// petición exacta que sale al backend (método, ruta, query y cuerpo).
//
// Uso típico en un test:
//   vi.mock('@/context/authContext', async () => (await import('@/test/behaviorHarness')).mocks.authContext());
//   vi.mock('@/context/toastContext', async () => (await import('@/test/behaviorHarness')).mocks.toastContext());
//   vi.mock('next/navigation', async () => (await import('@/test/behaviorHarness')).mocks.navigation());
//   vi.mock('next/link', async () => (await import('@/test/behaviorHarness')).mocks.link());
//   vi.mock('@/hooks/useLiveRefresh', () => ({ default: () => {} }));
//   vi.mock('@/lib/realtime', () => ({ subscribeRealtime: () => () => {} }));
//
//   const api = installApi([on('GET', /^\/customers$/, list([...]))]);
//   await renderPage(<Page />);
//   expect(api.last('GET', /^\/customers$/).query).toMatchObject({ page: '1' });
import React from 'react';
import { vi, expect } from 'vitest';
import { render, act, fireEvent, screen, waitFor } from '@testing-library/react';
import { authState, fakeUser, fixtureFor, installBrowserStubs } from './pageHarness';

export { authState, fakeUser, screen, waitFor, fireEvent, act };
// Formato de dinero real del CRM (usa espacio duro): para comparar textos.
import { formatCOP } from '@/lib/api/utils/utils';
export { formatCOP };
// Para getByText / toHaveTextContent (Testing Library normaliza el espacio duro
// a espacio normal). Para valores de inputs y mensajes usa formatCOP.
export const money = (n) => formatCOP(n).replace(/\u00a0/g, ' ');

// ---------------------------------------------------------------------------
// Mocks estables (mismo objeto en cada render, como los providers reales).
// ---------------------------------------------------------------------------
export const toast = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

// Estado de navegación que leen los mocks de next/navigation.
export const navState = { pathname: '/dashboard', search: '' };

export const authActions = { setUsuario: vi.fn(), logout: vi.fn() };

// useSearchParams debe devolver el MISMO objeto mientras la URL no cambie
// (como en Next): varias páginas lo usan como dependencia de un useEffect.
let spCache = { key: null, value: null };
function stableSearchParams() {
  if (spCache.key !== navState.search) spCache = { key: navState.search, value: new URLSearchParams(navState.search) };
  return spCache.value;
}

export const mocks = {
  authContext: () => ({
    useAuth: () => ({
      usuario: authState.usuario,
      loading: false,
      setUsuario: authActions.setUsuario,
      logout: authActions.logout,
    }),
    AuthProvider: ({ children }) => children,
  }),
  toastContext: () => ({
    useToast: () => toast,
    ToastProvider: ({ children }) => children,
  }),
  navigation: () => ({
    useRouter: () => router,
    useParams: () => authState.params,
    usePathname: () => navState.pathname,
    useSearchParams: stableSearchParams,
    redirect: vi.fn(),
  }),
  link: () => ({
    default: ({ href, children, ...rest }) => (
      <a href={typeof href === 'string' ? href : '#'} {...rest}>
        {children}
      </a>
    ),
  }),
};

// ---------------------------------------------------------------------------
// Backend simulado con registro de peticiones.
// ---------------------------------------------------------------------------

// Forma estándar de lista paginada del backend.
export function list(items = [], meta = {}) {
  const limit = meta.limit ?? 10;
  const total = meta.total ?? items.length;
  return {
    success: true,
    data: items,
    meta: {
      total,
      page: meta.page ?? 1,
      limit,
      totalPages: meta.totalPages ?? Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export const detail = (data) => ({ success: true, data });
export const ok = (data = { id: 1 }) => ({ success: true, data });
export const fail = (status, message) => ({ __status: status, body: { success: false, message } });

// Define una respuesta: on('POST', /^\/customers$/, ok({ id: 5 })) o con función
// que recibe la petición ({ method, path, query, body }).
export const on = (method, path, reply) => ({ method: method.toUpperCase(), path, reply });

export function installApi(routes = []) {
  const calls = [];
  globalThis.fetch = async (url, opts = {}) => {
    const u = String(url);
    const noHost = u.replace(/^https?:\/\/[^/]+/, '');
    const [path, qs = ''] = noHost.split('?');
    const method = (opts.method || 'GET').toUpperCase();
    let body = null;
    if (opts.body instanceof FormData) {
      body = opts.body;
    } else if (opts.body != null) {
      try {
        body = JSON.parse(opts.body);
      } catch {
        body = opts.body;
      }
    }
    const query = Object.fromEntries(new URLSearchParams(qs));
    const call = { method, path, query, body, headers: opts.headers || {} };
    calls.push(call);

    let status = 200;
    let resBody;
    const route = routes.find(
      (r) => (r.method === '*' || r.method === method) && r.path.test(path),
    );
    if (route) {
      const out = typeof route.reply === 'function' ? await route.reply(call) : route.reply;
      if (out && out.__status) {
        status = out.__status;
        resBody = out.body;
      } else {
        resBody = out;
      }
    } else {
      resBody = fixtureFor(path, method);
    }
    return {
      ok: status < 400,
      status,
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify(resBody),
      json: async () => resBody,
      blob: async () => new Blob([]),
    };
  };

  const api = {
    calls,
    routes,
    find: (method, re) => calls.filter((c) => c.method === method.toUpperCase() && re.test(c.path)),
    last: (method, re) => {
      const l = api.find(method, re);
      return l[l.length - 1];
    },
    count: (method, re) => api.find(method, re).length,
    reset: () => calls.splice(0, calls.length),
    // Permite cambiar una respuesta a mitad de prueba (p. ej. tras crear).
    set: (method, path, reply) => {
      const i = routes.findIndex((r) => r.method === method.toUpperCase() && String(r.path) === String(path));
      const route = on(method, path, reply);
      if (i >= 0) routes[i] = route;
      else routes.unshift(route);
    },
  };
  return api;
}

// ---------------------------------------------------------------------------
// Preparación de cada prueba.
// ---------------------------------------------------------------------------
export function setupUser(type = 'COMERCIO', role = 'SUPER_ADMIN', overrides = {}) {
  const u = fakeUser(type, role);
  authState.usuario = { ...u, ...overrides, company: { ...u.company, ...(overrides.company || {}) } };
  try {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('usuario', JSON.stringify(authState.usuario));
  } catch {
    /* noop */
  }
  return authState.usuario;
}

export function resetBehavior({ type = 'COMERCIO', role = 'SUPER_ADMIN', company } = {}) {
  installBrowserStubs();
  for (const fn of Object.values(toast)) fn.mockReset?.();
  for (const fn of Object.values(router)) fn.mockReset?.();
  for (const fn of Object.values(authActions)) fn.mockReset?.();
  navState.pathname = '/dashboard';
  navState.search = '';
  authState.params = { id: '1', companyId: '90' };
  setupUser(type, role, company ? { company } : {});
}

// ---------------------------------------------------------------------------
// Interacción.
// ---------------------------------------------------------------------------
export async function settle(ms = 30) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

export async function renderPage(ui) {
  let result;
  await act(async () => {
    result = render(ui);
  });
  await settle();
  return result;
}

export const field = (name, root = document) => root.querySelector(`[name="${name}"]`);

export function setField(name, value, root = document) {
  const el = field(name, root);
  if (!el) throw new Error(`No existe el campo "${name}" en pantalla`);
  fireEvent.change(el, { target: { value } });
  return el;
}

export function setChecked(name, checked, root = document) {
  const el = field(name, root);
  if (!el) throw new Error(`No existe el checkbox "${name}" en pantalla`);
  fireEvent.click(el);
  if (el.checked !== checked) fireEvent.click(el);
  return el;
}

export async function click(el) {
  await act(async () => {
    fireEvent.click(el);
  });
}

export async function typeInto(el, value) {
  await act(async () => {
    fireEvent.change(el, { target: { value } });
  });
}

export function button(name) {
  return screen.getByRole('button', { name });
}

export function buttons(name) {
  return screen.getAllByRole('button', { name });
}

export function queryButton(name) {
  return screen.queryByRole('button', { name });
}

export function placeholder(text) {
  return screen.getByPlaceholderText(text);
}

// Espera a que exista una petición concreta y la devuelve.
export async function waitForCall(api, method, re, { count = 1, timeout = 2500 } = {}) {
  await waitFor(() => expect(api.count(method, re)).toBeGreaterThanOrEqual(count), { timeout });
  return api.last(method, re);
}

export async function expectToast(type, match) {
  await waitFor(() => {
    const hit = toast.show.mock.calls.find(
      ([a]) => a && a.type === type && (match == null || (match instanceof RegExp ? match.test(a.message) : String(a.message).includes(match))),
    );
    expect(hit, `toast ${type} ${match || ''} no apareció. Recibidos: ${JSON.stringify(toast.show.mock.calls.map((c) => c[0]))}`).toBeTruthy();
  });
  return toast.show.mock.calls.find(([a]) => a?.type === type)[0];
}

// Último mensaje mostrado al usuario (toast) de cualquier tipo.
export function lastToast() {
  const c = toast.show.mock.calls;
  return c.length ? c[c.length - 1][0] : null;
}

// Fila de la tabla genérica que contiene el texto dado.
export function rowWith(text) {
  const cell = screen.getAllByText(text).find((n) => n.closest('tr'));
  if (!cell) throw new Error(`No hay fila con "${text}"`);
  return cell.closest('tr');
}

export function rowButton(text, label) {
  const row = rowWith(text);
  const btn = row.querySelector(`[aria-label="${label}"]`);
  if (!btn) throw new Error(`La fila "${text}" no tiene la acción "${label}"`);
  return btn;
}

export function queryRowButton(text, label) {
  return rowWith(text).querySelector(`[aria-label="${label}"]`);
}

// Datos base que casi todos los formularios necesitan en sus desplegables.
export const BASE_LOCALS = [
  { id: 1, name: 'Sede Centro', status: 'ACTIVO' },
  { id: 2, name: 'Sede Norte', status: 'ACTIVO' },
];
export const BASE_PROVIDERS = [{ id: 7, name: 'Proveedor Uno' }];
export const BASE_CATEGORIES = [{ id: 3, name: 'General' }];
export const BASE_BRANDS = [{ id: 4, name: 'Marca X' }];
export const BASE_EXPENSE_CATEGORIES = [
  { id: 11, name: 'Servicios públicos', type: 'OPERATIVO' },
  { id: 12, name: 'Arriendo', type: 'OPERATIVO' },
];
export const BASE_PAYMENT_METHODS = [
  { id: 1, code: 'EFECTIVO', name: 'Efectivo', active: true },
  { id: 2, code: 'TRANSFERENCIA', name: 'Transferencia', active: true },
  { id: 3, code: 'CREDITO', name: 'Crédito (fiado)', active: true },
];

export const baseRoutes = () => [
  on('GET', /^\/locals$/, list(BASE_LOCALS)),
  on('GET', /^\/providers$/, list(BASE_PROVIDERS)),
  on('GET', /^\/categories$/, list(BASE_CATEGORIES)),
  on('GET', /^\/brands$/, list(BASE_BRANDS)),
  on('GET', /^\/expense-categories$/, list(BASE_EXPENSE_CATEGORIES)),
  on('GET', /^\/enums\/payment-methods$/, ok(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CREDITO'].map((id) => ({ id, name: id })))),
  on('GET', /^\/enums\/status$/, ok([{ id: 'ACTIVO', name: 'ACTIVO' }, { id: 'INACTIVO', name: 'INACTIVO' }])),
  on('GET', /^\/payment-methods$/, ok(BASE_PAYMENT_METHODS)),
  on('GET', /^\/customer-segments$/, list([])),
  on('GET', /^\/units-of-measure$/, list([{ id: 1, name: 'Unidad', code: 'UNIDAD' }])),
  on('GET', /^\/users$/, list([{ id: 1, name: 'Dueño Prueba', role: 'SUPER_ADMIN', status: 'ACTIVO' }])),
  on('GET', /^\/company\/fiscal/, ok({ responsableIVA: false, defaultTaxRate: 19 })),
  on('GET', /^\/fiscal\/status/, ok({ ready: false })),
];

// Elige una opción real de un <select> (por índice, saltando la vacía) y
// devuelve el valor elegido. Útil para Departamento/Ciudad, sedes, etc.
export function pickOption(name, index = 1, root = document) {
  const el = field(name, root);
  if (!el) throw new Error(`No existe el select "${name}" en pantalla`);
  const opt = el.options[index];
  if (!opt) throw new Error(`El select "${name}" no tiene la opción ${index}`);
  fireEvent.change(el, { target: { value: opt.value } });
  return opt.value;
}

// Departamento + ciudad (selects nativos obligatorios en los formularios).
export function pickDepartmentAndCity() {
  const dep = pickOption('department', 1);
  const city = pickOption('city', 1);
  return { dep, city };
}

// Campos del formulario que el navegador marcaría como inválidos (required,
// email, etc.). Sirve para explicar por qué un submit no salió.
export function invalidFields(root = document) {
  const form = root.querySelector('form');
  if (!form) return [];
  return [...form.elements].filter((e) => !e.checkValidity()).map((e) => `${e.name || e.id || e.tagName}: ${e.validationMessage}`);
}

export async function submitForm(root = document) {
  const bad = invalidFields(root);
  if (bad.length) throw new Error(`El formulario tiene campos inválidos: ${bad.join(' | ')}`);
  const btn = [...root.querySelectorAll('button[type="submit"]')].pop();
  await click(btn);
}
