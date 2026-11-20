// Arnés común de las pruebas de humo de pantallas: usuario falso por tipo de
// negocio, backend simulado por ruta (sobre `fetch`, así se ejercitan los
// helpers reales de `src/lib/api/routes`) y captura de errores de render.
import React from 'react';

export const BUSINESS_TYPES_SMOKE = [
  'COMERCIO',
  'BARBERIA',
  'RESTAURANTE',
  'PARQUEADERO',
  'PANADERIA',
  'ODONTOLOGIA',
  'TECNOLOGIA',
  'LAVADO_VEHICULOS',
  'FINANCIERA',
];

export function fakeUser(type = 'COMERCIO', role = 'SUPER_ADMIN') {
  return {
    id: 1,
    name: 'Dueño Prueba',
    email: 'dueno@prueba.test',
    role,
    localId: 1,
    planConfig: {},
    company: {
      id: 90,
      name: 'Negocio Prueba',
      nit: '901555444',
      type,
      plan: 'ORBITA',
      typeProductFields: null,
      typeModules: null,
      enabledModules: null,
      terminology: null,
      accountingEnabled: true,
      accountingBasis: 'DEVENGO',
      booksClosedUntil: null,
      hasAccountant: false,
      websiteEnabled: false,
      domain: null,
      einvoicingReleased: false,
      requireCashOpen: false,
      cycleStartDay: 1,
      crmTheme: null,
      crmFont: null,
      logo: null,
      bankNotifyEnabled: false,
      taxAlertsEnabled: true,
      taxAlertEmail: false,
    },
  };
}

// Estado mutable que leen los mocks de useAuth / useParams.
export const authState = { usuario: fakeUser(), params: { id: '1', companyId: '90' } };

const LIST = () => ({
  success: true,
  data: [],
  items: [],
  total: 0,
  meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
});
const DETAIL = () => ({
  success: true,
  data: { id: 1, name: 'Elemento', items: [], lines: [], products: [], services: [], status: 'ACTIVO', total: 0 },
});

const financials = {
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  incomeStatement: { income: [], costs: [], expenses: [], totalIncome: 0, totalCosts: 0, totalExpenses: 0, grossProfit: 0, netProfit: 0 },
  balanceSheet: { assets: [], liabilities: [], equity: [], retainedResult: 0, totalAssets: 0, totalLiabilities: 0, totalEquity: 0, balanced: true },
  cashFlow: { accounts: [], totalIn: 0, totalOut: 0, net: 0 },
};

// Fixtures específicos (regex de la ruta → cuerpo). Lo que no esté aquí
// recibe la forma genérica de lista o de detalle.
export const FIXTURES = [
  // Préstamos (tipo FINANCIERA): formas reales de /loans para la prueba de humo.
  [/^\/loans\/settings/, { success: true, data: { defaultInterestRate: 3, defaultMoraRate: null, graceDays: 0, defaultFrequency: 'MENSUAL', defaultAmortization: 'SIMPLE', rateConversion: 'PROPORCIONAL', roundTo: 1, requireApproval: false, excludeWeekdays: [], allocationOrder: ['MORA', 'INTERES', 'CAPITAL'], usuryRateMonthly: null, collectorCanRegisterPayments: true, requireCashForDisbursement: false, maxTerm: null, minAmount: null, maxAmount: null } }],
  [/^\/loans\/summary/, { success: true, data: { portfolio: 0, pendingCapital: 0, pendingInterest: 0, moraAccrued: 0, activeLoans: 0, pendingApproval: 0, approvedNotDisbursed: 0, overdueLoans: 0, overdueAmount: 0, moraIndex: 0, aging: { d0_30: 0, d31_60: 0, d61_90: 0, d90p: 0 }, placedMonth: { amount: 0, count: 0 }, collectedToday: { amount: 0, count: 0, capital: 0, interest: 0, mora: 0 }, collectedMonth: { amount: 0, count: 0, capital: 0, interest: 0, mora: 0 }, upcoming7: { count: 0, amount: 0 }, byCollector: [], topOverdue: [] } }],
  [/^\/loans\/collector\/route/, { success: true, data: { date: '2026-01-01', collectorId: 1, dueToday: [], overdue: [], upcoming: [], totals: { loans: 0, toCollectToday: 0, overdueAmount: 0, collectedToday: 0, collectedCashToday: 0, collectedCount: 0, portfolio: 0 } } }],
  [/^\/loans\/payments\/history/, { success: true, data: { items: [], totals: { amount: 0, capital: 0, interest: 0, mora: 0, count: 0 } } }],
  [/^\/loans\/products/, { success: true, data: [] }],
  [/^\/loans\/customers\/\d+\/profile/, { success: true, data: { customer: { id: 1, name: 'Cliente Prueba' }, profile: null, outstandingCapital: 0, availableCredit: null, effectiveRate: { rate: 3, source: 'COMPANY' } } }],
  [/^\/loans\/simulate/, { success: true, data: { terms: { principal: 0, termCount: 1, interestRate: 3, rateSource: 'COMPANY', moraRate: 3, graceDays: 0, frequency: 'MENSUAL', amortization: 'SIMPLE', roundTo: 1 }, plan: { principal: 0, totalInterest: 0, totalAmount: 0, installmentAmount: 0, installments: [], firstDueDate: '2026-01-01', lastDueDate: '2026-01-01', periodicRatePercent: 3, effectiveAnnualRatePercent: 42.58 }, warnings: [], availableCredit: null, product: null, effectiveAnnualRatePercent: 42.58 } }],
  [/^\/loans\/\d+$/, { success: true, data: { id: 1, code: 'PR-000001', status: 'DESEMBOLSADO', principal: 0, interestRate: 0, moraRate: 0, graceDays: 0, frequency: 'MENSUAL', amortization: 'SIMPLE', termCount: 1, totalInterest: 0, totalAmount: 0, customer: { id: 1, name: 'Cliente Prueba' }, collector: null, product: null, local: null, installments: [], payments: [], summary: { pendingCapital: 0, pendingInterest: 0, moraAccrued: 0, pendingTotal: 0, paidTotal: 0, paidCapital: 0, paidInterest: 0, paidMora: 0, overdueDays: 0, overdueAmount: 0, overdueInstallments: 0, nextDueDate: null, nextInstallmentAmount: 0, progressPercent: 0, status: 'AL_DIA', principal: 0, totalInterest: 0, totalAmount: 0 } } }],
  [/^\/loans(\?|$)/, { success: true, data: { items: [], kpis: { count: 0, activeCount: 0, portfolio: 0, pendingCapital: 0, pendingInterest: 0, moraAccrued: 0, overdueCount: 0, overdueAmount: 0, pendingTotal: 0 } } }],
  [/^\/accounting\/financials/, { success: true, data: financials }],
  [/^\/accounting\/journal/, { success: true, data: { entries: [], totals: { debit: 0, credit: 0 } } }],
  [/^\/accounting\/ledger/, { success: true, data: { accounts: [] } }],
  [/^\/accounting\/auxiliary/, { success: true, data: { account: null, movements: [], totals: { debit: 0, credit: 0 } } }],
  [/^\/accounting\/tax-summary/, { success: true, data: { income: 0, iva: { code: '2408', name: 'IVA', debit: 0, credit: 0, balance: 0 }, retefuente: { code: '2365', name: 'RTE', debit: 0, credit: 0, balance: 0 }, ica: { code: '2412', name: 'ICA', debit: 0, credit: 0, balance: 0 } } }],
  [/^\/tax\/calendar/, { success: true, data: { year: 2026, uvt: 0, regime: 'ORDINARIO', nitDigit: '4', deadlines: [] } }],
  [/^\/tax\/obligations/, { success: true, data: { engineAvailable: false, profile: {}, magnitudes: {}, evaluation: null } }],
  [/^\/tax\/renta/, { success: true, data: { year: 2026, engineAvailable: false, consolidado: {}, retencionesAFavor: 0, anticipoRenta: 0 } }],
  [/^\/tax\/alert-prefs/, { success: true, data: { taxAlertsEnabled: true, taxAlertEmail: false } }],
  [/^\/tax\/(profile|tax-year)/, { success: true, data: {} }],
  [/^\/assets(\?|$)/, { success: true, data: [], summary: { count: 0, activeCount: 0, totalCost: 0, totalAccumulated: 0, totalBookValue: 0, monthlyDepreciation: 0 } }],
  [/^\/customers\/\d+\/summary/, { success: true, data: { customer: { id: 1, name: 'Cliente Prueba', phone: '', email: '', local: { name: 'Sede' } }, loyalty: { enabled: false }, metrics: { ltv: 0, visits: 0, avgTicket: 0, firstVisit: null, lastVisit: null, pendingFiado: 0, segment: 'NUEVO' }, topItems: [], sales: [], appointments: [] } }],
  [/^\/sales\/receivables\/list/, { success: true, data: { totalSaldo: 0, count: 0, rows: [] } }],
  [/^\/statistics\/home/, { success: true, data: { today: { total: 0, count: 0, byMethod: [] }, setup: { locals: 1, products: 0, services: 0, sales: 0 }, weekSales: [], month: { sales: 0, expenses: 0, profit: 0 }, iva: null, overdue: { total: 0, count: 0 }, winbackCount: 0, birthdays: [], teamBirthdays: [], nextAppointments: [] } }],
  [/^\/statistics\/tax-report/, { success: true, data: { ivaGenerado: 0, ivaDescontable: 0, neto: 0, ventas: [], compras: [] } }],
];

export function fixtureFor(path, method = 'GET') {
  for (const [re, body] of FIXTURES) if (re.test(path)) return body;
  if (method !== 'GET') return { success: true, data: { id: 1 } };
  return /\/\d+(\?|$)/.test(path) ? DETAIL() : LIST();
}

export function installFetchMock(log = []) {
  const impl = async (url, opts = {}) => {
    const u = String(url);
    const path = u.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '');
    const method = (opts.method || 'GET').toUpperCase();
    log.push(`${method} ${path}`);
    const body = fixtureFor(path, method);
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify(body),
      json: async () => body,
      blob: async () => new Blob([]),
    };
  };
  globalThis.fetch = impl;
  return impl;
}

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
    key: (i) => Array.from(m.keys())[i] ?? null,
    get length() {
      return m.size;
    },
  };
}

export function installBrowserStubs() {
  // Node 22+ expone un `localStorage` global experimental que queda undefined
  // sin --localstorage-file y tapa al de jsdom: forzamos el del navegador.
  let ls = null;
  try {
    ls = window.localStorage && typeof window.localStorage.setItem === 'function' ? window.localStorage : null;
  } catch {
    ls = null;
  }
  if (!ls) ls = memoryStorage();
  for (const target of [globalThis, window]) {
    try {
      Object.defineProperty(target, 'localStorage', { value: ls, configurable: true, writable: true });
    } catch {
      /* noop */
    }
  }
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
  if (!globalThis.IntersectionObserver) {
    globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
  if (!globalThis.EventSource) {
    globalThis.EventSource = class { constructor() {} close() {} addEventListener() {} };
  }
  if (!window.matchMedia) {
    window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  }
  if (!window.scrollTo) window.scrollTo = () => {};
  if (!HTMLElement.prototype.scrollIntoView) HTMLElement.prototype.scrollIntoView = () => {};
  if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:x';
  if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};
}

export class RenderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    this.props.onError?.(error);
  }
  render() {
    if (this.state.error) return <div data-testid="render-error">{String(this.state.error?.message || this.state.error)}</div>;
    return this.props.children;
  }
}

// Errores que sí indican una pantalla rota (no warnings de estilo/props).
export const BREAKING = /Cannot read|is not a function|is not defined|is not iterable|Objects are not valid as a React child|Maximum update depth|Rendered (more|fewer) hooks|Invalid hook call|Element type is invalid|Unhandled|TypeError|ReferenceError|RangeError/;
