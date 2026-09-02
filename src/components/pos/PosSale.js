'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  CheckIcon,
  MinusIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon,
  GiftIcon,
  ShoppingBagIcon,
  WrenchScrewdriverIcon,
  CalculatorIcon,
  LockClosedIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { getCurrentCash, CASH_CHANGED_EVENT } from '@/lib/api/routes/cash';
import { dayStateFromRegister } from '@/lib/dayStatus';
import RoleGuard from '@/auth/roleGuard';
import { Roles } from '@/config/roles';
import { useAuth } from '@/context/authContext';
import useTerms from '@/hooks/useTerms';
import useSales from '@/lib/api/hooks/useSales';
import useUsers from '@/lib/api/hooks/useUsers';
import useLocals from '@/lib/api/hooks/useLocals';
import { getCustomers, getCustomerSummary } from '@/lib/api/routes/customers';
import { getPaymentMethodCatalog } from '@/lib/api/routes/paymentMethods';
import { getFiscalConfig } from '@/lib/api/routes/company';
import { getFiscalStatus, emitFiscalInvoice } from '@/lib/api/routes/fiscal';
import { printFiscalInvoice } from '@/utils/printFiscalInvoice';
import { getProductFields } from '@/config/verticalProfiles';
import { isServicesBusiness } from '@/lib/appointmentsAccess';
import { formatCOP } from '@/lib/api/utils/utils';
import AlertModal from '@/components/dashboard/modals/alertModal';
import NewCustomerModal from '@/components/dashboard/modals/newCustomerModal';

// Fecha/hora actual en formato datetime-local (YYYY-MM-DDTHH:mm), hora local.
export function nowLocalDatetime() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const PAYMENT_METHODS = [
  { id: 'EFECTIVO', name: 'Efectivo' },
  { id: 'BANCOLOMBIA', name: 'Bancolombia' },
  { id: 'TRANSFERENCIA', name: 'Transferencia' },
  { id: 'DATAFONO', name: 'Datáfono' },
  { id: 'ADDI', name: 'Addi' },
  { id: 'CREDITO', name: 'Crédito / Fiado' },
];

const keyOf = (r) => (r.type === 'service' ? `s${r.id}` : `p${r.id}`);

/**
 * POS reutilizable para crear o editar una factura.
 * @param {'new'|'edit'} mode
 * @param {object} initial  valores iniciales (para editar)
 * @param {(payload)=>Promise} onSubmit  crea o actualiza la venta
 * @param {string} title
 * @param {string} successMessage
 * @param {string} successUrl
 */
export default function PosSale({
  mode = 'new',
  initial = null,
  onSubmit,
  title = 'Realizar Factura',
  successMessage = 'Factura registrada correctamente.',
  successUrl = '/dashboard/delivered_sales',
}) {
  const { usuario } = useAuth();
  const t = useTerms();
  const showColor =
    getProductFields(usuario?.company?.type, usuario?.company?.typeProductFields).variantType === 'color';
  // Verticales que venden por peso (fruver, carnicería, supermercado): el POS
  // debe aceptar cantidades decimales (1,5 kg) en vez de solo enteros.
  const isWeightVertical =
    getProductFields(usuario?.company?.type, usuario?.company?.typeProductFields).variantType === 'weight';
  // Un ítem se cobra por peso si su producto es de unidad PESO; si el producto
  // no trae `unit`, se usa el default del vertical.
  const isByWeight = (i) => (i.unit ? i.unit === 'PESO' : isWeightVertical);
  const { searchProducts } = useSales();
  const { getUsers } = useUsers();
  const { getLocals } = useLocals();

  // Catálogo / búsqueda
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  // Estado de la factura (inicializado desde `initial` al editar)
  const [cart, setCart] = useState(initial?.cart || []);
  const [customer, setCustomer] = useState(initial?.customer || null);
  const [custSearch, setCustSearch] = useState('');
  const [custResults, setCustResults] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(
    initial?.paymentMethod || 'EFECTIVO'
  );
  // Métodos de pago del catálogo administrable de la empresa. Cada uno tiene un
  // `code` (comportamiento base) que alimenta a `paymentMethod`.
  const [methods, setMethods] = useState([]);
  const [paymentMethodCatalogId, setPaymentMethodCatalogId] = useState(
    initial?.paymentMethodCatalogId || null
  );
  useEffect(() => {
    getPaymentMethodCatalog()
      .then((r) => {
        const list = r?.data || [];
        setMethods(list);
        // Selección inicial: el ya elegido, o el que coincida con el code
        // inicial, o Efectivo, o el primero.
        setPaymentMethodCatalogId((prev) => {
          if (prev) return prev;
          const pick =
            list.find((m) => m.code === (initial?.paymentMethod || 'EFECTIVO')) ||
            list.find((m) => m.code === 'EFECTIVO') ||
            list[0];
          if (pick) setPaymentMethod(pick.code);
          return pick ? pick.id : null;
        });
      })
      .catch(() => setMethods([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [notes, setNotes] = useState(initial?.notes || '');
  // Tipo de comprobante: tiquete POS (normal) o factura electrónica DIAN.
  const [docType, setDocType] = useState('POS');
  const [fiscalReady, setFiscalReady] = useState(false);
  // Muestra/oculta los campos secundarios (fecha y observaciones) para dar más
  // espacio a los ítems de la factura.
  const [showMore, setShowMore] = useState(false);
  // Vencimiento del fiado (solo cuando el pago es a crédito).
  const [dueDate, setDueDate] = useState(initial?.dueDate || '');
  // Efectivo recibido (para calcular el vuelto). Solo ayuda al cajero.
  const [cashReceived, setCashReceived] = useState('');
  const [saleDate, setSaleDate] = useState(
    initial?.saleDate || nowLocalDatetime()
  );
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [locals, setLocals] = useState([]);
  const [localId, setLocalId] = useState(
    initial?.localId ?? usuario?.localId ?? ''
  );
  const [sellers, setSellers] = useState([]);
  // En negocios de servicios (barbería, spa, odontología) hay dos grupos de
  // "atendido por": quien PRESTA el servicio (barbero/profesional) y el resto
  // (recepción/caja/admin). Se elige SOLO uno. Por defecto se exige elegir al
  // barbero para que la recepcionista no se auto-asigne el corte por error.
  const isServiceVertical = isServicesBusiness(usuario);
  const [sellerGroup, setSellerGroup] = useState('attendant'); // 'attendant' | 'other'
  const [sellerId, setSellerId] = useState(
    initial?.sellerId ?? (isServiceVertical ? '' : usuario?.id) ?? ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  // Roles que PRESTAN el servicio (el "atiende"): barbero / profesional.
  const ATTENDANT_ROLES = ['BARBERO', 'PROFESIONAL'];
  const barbers = sellers.filter((s) => ATTENDANT_ROLES.includes(s.role));
  const others = sellers.filter((s) => !ATTENDANT_ROLES.includes(s.role));
  const sellerOptions = !isServiceVertical
    ? sellers
    : sellerGroup === 'attendant'
      ? barbers
      : others;

  // Config fiscal de la empresa (IVA). El POS la necesita para mostrar el IVA y
  // el total REAL a cobrar, igual que lo calcula el backend al guardar la venta.
  const [fiscal, setFiscal] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await getFiscalConfig();
        setFiscal(res?.data || res || null);
      } catch (_) {
        setFiscal(null);
      }
    })();
  }, []);

  // ¿La empresa ya tiene facturación electrónica DIAN activa? Solo entonces se
  // ofrece el selector "Tiquete POS / Factura electrónica" al vender.
  useEffect(() => {
    (async () => {
      try {
        const res = await getFiscalStatus();
        setFiscalReady(!!res?.data?.linked);
      } catch (_) {
        setFiscalReady(false);
      }
    })();
  }, []);

  // Política "abrir el día": si la empresa lo exige, se bloquea el POS hasta
  // que haya una caja abierta de hoy en la sede.
  const requireCashOpen = !!usuario?.company?.requireCashOpen;
  const [dayState, setDayState] = useState(
    requireCashOpen ? 'loading' : 'ok'
  );

  useEffect(() => {
    if (!requireCashOpen || !localId) return;
    const check = async () => {
      try {
        const res = await getCurrentCash(localId);
        setDayState(dayStateFromRegister(res?.data));
      } catch (_) {
        setDayState('not_open');
      }
    };
    setDayState('loading');
    check();
    // Se desbloquea/rebloquea en tiempo real al abrir/cerrar caja (evento) o al
    // volver a la pestaña, sin recargar.
    const onChange = () => check();
    window.addEventListener(CASH_CHANGED_EVENT, onChange);
    window.addEventListener('focus', onChange);
    return () => {
      window.removeEventListener(CASH_CHANGED_EVENT, onChange);
      window.removeEventListener('focus', onChange);
    };
  }, [requireCashOpen, localId]);

  useEffect(() => {
    (async () => {
      try {
        const l = await getLocals({ all: true });
        const list = l?.data || [];
        setLocals(list);
        if (!localId && list.length) setLocalId(String(list[0].id));
      } catch (_) {}
      try {
        const u = await getUsers({ status: 'ACTIVO', limit: 1000 });
        setSellers(u?.data || []);
      } catch (_) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Buscador de productos/servicios (debounced).
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const to = setTimeout(async () => {
      try {
        const res = await searchProducts(term);
        setResults(res?.data || res || []);
      } catch (_) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(to);
  }, [query, searchProducts]);

  // Buscador de clientes.
  useEffect(() => {
    const term = custSearch.trim();
    if (term.length < 2 || customer) {
      setCustResults([]);
      return;
    }
    const to = setTimeout(async () => {
      try {
        const res = await getCustomers({ name: term, limit: 6 });
        setCustResults(res?.data || []);
      } catch (_) {
        setCustResults([]);
      }
    }, 250);
    return () => clearTimeout(to);
  }, [custSearch, customer]);

  // Tope de cantidad: servicios y elaborados (sin control de stock) son
  // ilimitados; el resto no puede pasar de las existencias. Al EDITAR, la
  // cantidad que ya tenía la venta (originalQuantity) sigue disponible, porque
  // al guardar se devuelve el stock viejo y se descuenta el nuevo.
  const maxQty = (i) =>
    i.type === 'service' || i.trackStock === false
      ? Infinity
      : (Number(i.stock) || 0) + (Number(i.originalQuantity) || 0);

  const addToCart = useCallback((r) => {
    const key = keyOf(r);
    setCart((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) {
        return prev.map((i) =>
          i.key === key
            ? { ...i, quantity: Math.min(Number(i.quantity) + 1, maxQty(i)) }
            : i
        );
      }
      return [
        ...prev,
        {
          key,
          type: r.type === 'service' ? 'service' : 'product',
          refId: r.id,
          name: r.name,
          color: r.color,
          size: r.size,
          stock: r.stock,
          trackStock: r.trackStock, // false = elaborado sin stock (ilimitado)
          price: r.price || 0,
          taxRate: r.taxRate, // IVA propio del ítem (si lo tiene); si no, usa el de la empresa
          unit: r.unit, // 'UNIDAD' | 'PESO' → habilita cantidades decimales
          quantity: 1,
          discount: 0,
        },
      ];
    });
  }, []);

  // Ajuste numérico (botones + / −). Peso: permite decimales y baja hasta 0;
  // unidad: entero con mínimo 1.
  const setQty = (key, q) =>
    setCart((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i;
        const w = isByWeight(i);
        let val = Number(q);
        if (Number.isNaN(val)) val = w ? 0 : 1;
        val = w
          ? Math.max(0, Math.round(val * 1000) / 1000)
          : Math.max(1, Math.round(val));
        // No dejar pasar de las existencias (servicios/elaborados: ilimitado).
        val = Math.min(val, maxQty(i));
        return { ...i, quantity: val };
      })
    );

  // Entrada de texto de la cantidad. En peso deja escribir decimales (coma o
  // punto) guardando el texto crudo; en unidad solo dígitos. No permite superar
  // las existencias del producto.
  const onQtyInput = (key, text, byWeight) => {
    const clean = byWeight
      ? String(text)
          .replace(',', '.')
          .replace(/[^\d.]/g, '')
          .replace(/(\..*)\./g, '$1') // un solo punto
      : String(text).replace(/[^\d]/g, '');
    setCart((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i;
        const num = Number(clean);
        const max = maxQty(i);
        // Si ya es un número completo y supera el stock, se topa al stock.
        const capped =
          clean !== '' && Number.isFinite(num) && num > max
            ? String(max)
            : clean;
        return { ...i, quantity: capped };
      })
    );
  };

  // Paso de los botones + / − según el tipo (0,5 kg vs 1 unidad).
  const qtyStep = (i) => (isByWeight(i) ? 0.5 : 1);
  const setDiscount = (key, d) =>
    setCart((prev) =>
      prev.map((i) => (i.key === key ? { ...i, discount: Math.max(0, d) } : i))
    );
  const removeItem = (key) =>
    setCart((prev) => prev.filter((i) => i.key !== key));

  const pickCustomer = async (c) => {
    setCustomer(c);
    setCustResults([]);
    setCustSearch('');
    try {
      const res = await getCustomerSummary(c.id);
      const loyalty = res?.data?.loyalty;
      if (loyalty?.enabled) setCustomer({ ...c, loyalty });
    } catch (_) {}
  };

  // Fidelización AUTOMÁTICA: si el cliente tiene descuento de recompensa, se
  // aplica solo a los servicios (sin que el cajero tenga que dar clic, así no se
  // puede olvidar ni quemar la recompensa). Preserva descuentos manuales de
  // ítems que no son de fidelización, y lo retira si se quita el cliente.
  useEffect(() => {
    const pct = customer?.loyalty?.nextDiscount || 0;
    setCart((prev) => {
      let changed = false;
      const next = prev.map((i) => {
        if (i.type !== 'service') return i;
        if (pct > 0) {
          const want = Math.round(i.price * i.quantity * (pct / 100));
          if (!i.loyaltyApplied || i.discount !== want) {
            changed = true;
            return { ...i, discount: want, loyaltyApplied: true };
          }
          return i;
        }
        if (i.loyaltyApplied) {
          changed = true;
          return { ...i, discount: 0, loyaltyApplied: false };
        }
        return i;
      });
      return changed ? next : prev;
    });
  }, [customer?.loyalty?.nextDiscount, cart]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountTotal = cart.reduce(
    (s, i) => s + Math.min(i.discount, i.price * i.quantity),
    0
  );
  // Neto de líneas (con IVA dentro si los precios ya lo incluyen).
  const netTotal = subtotal - discountTotal;

  // IVA: misma lógica exacta que el backend (taxParts + itemTaxRate) para que el
  // total mostrado al cajero coincida al centavo con el que se guarda.
  const r2 = (n) => Math.round(n * 100) / 100;
  const responsableIVA = !!fiscal?.responsableIVA;
  const includeIva = fiscal?.preciosIncluyenIVA ?? true;
  const defRate = Number(fiscal?.defaultTaxRate) || 0;
  let baseTotal = 0;
  let taxTotal = 0;
  for (const i of cart) {
    const gross = Math.max(
      0,
      i.price * i.quantity - Math.min(i.discount, i.price * i.quantity)
    );
    const rate = responsableIVA
      ? Number(i.taxRate) > 0
        ? Number(i.taxRate)
        : defRate
      : 0;
    if (rate <= 0) {
      baseTotal += gross;
      continue;
    }
    if (includeIva) {
      const base = r2(gross / (1 + rate / 100));
      baseTotal += base;
      taxTotal += r2(gross - base);
    } else {
      baseTotal += gross;
      taxTotal += r2((gross * rate) / 100);
    }
  }
  baseTotal = r2(baseTotal);
  taxTotal = r2(taxTotal);
  const showTax = responsableIVA && taxTotal > 0;
  // Total a cobrar: si el precio ya incluye IVA no cambia; si no, se le suma.
  const total = includeIva ? netTotal : r2(netTotal + taxTotal);
  const itemCount = cart.reduce((s, i) => s + Number(i.quantity || 0), 0);

  // Vuelto (solo pago en efectivo): efectivo recibido − total a cobrar.
  const cashReceivedNum =
    Number(String(cashReceived).replace(/[^\d]/g, '')) || 0;
  const change = cashReceivedNum - total;

  const clearAll = () => {
    setCart([]);
    setCustomer(null);
    setNotes('');
    {
      // Reinicia al método por defecto (Efectivo del catálogo si existe).
      const def =
        methods.find((m) => m.code === 'EFECTIVO') || methods[0] || null;
      setPaymentMethod(def ? def.code : 'EFECTIVO');
      setPaymentMethodCatalogId(def ? def.id : null);
    }
    setSaleDate(nowLocalDatetime());
    setDueDate('');
    setCashReceived('');
  };

  const submit = async () => {
    if (cart.length === 0) {
      setAlert({ type: 'error', message: 'Agrega al menos un ítem.' });
      return;
    }
    if (!localId) {
      setAlert({ type: 'error', message: 'Selecciona la sede.' });
      return;
    }
    // En servicios se debe elegir explícitamente quién atendió (evita que la
    // recepcionista se asigne el corte por error).
    if (isServiceVertical && !sellerId) {
      setAlert({
        type: 'warning',
        message: `Selecciona quién atendió (${(t.attendant || 'barbero').toLowerCase()} u otro).`,
      });
      return;
    }
    // La factura electrónica necesita un cliente con datos (no Consumidor Final).
    if (docType === 'ELECTRONIC' && fiscalReady && !customer?.id) {
      setAlert({
        type: 'warning',
        message:
          'La factura electrónica requiere seleccionar un cliente con sus datos DIAN.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const created = await onSubmit({
        paymentMethod,
        paymentMethodCatalogId: paymentMethodCatalogId || undefined,
        paymentStatus: paymentMethod === 'CREDITO' ? 'FIADO' : 'PAGADA',
        dueDate: paymentMethod === 'CREDITO' && dueDate ? dueDate : null,
        localId: Number(localId),
        userId: Number(sellerId) || usuario?.id,
        customerId: customer?.id,
        saleDate,
        notes,
        // Efectivo recibido (para el cambio/vuelto en la factura impresa).
        cashReceived:
          paymentMethod === 'EFECTIVO' && cashReceivedNum > 0
            ? cashReceivedNum
            : null,
        items: cart.map((i) =>
          i.type === 'service'
            ? {
                serviceId: i.refId,
                quantity: Number(i.quantity) || 0,
                discount: Math.round(i.discount) || 0,
              }
            : {
                inventoryVariantId: i.refId,
                quantity: Number(i.quantity) || 0,
                discount: Math.round(i.discount) || 0,
              }
        ),
      });

      // Si se eligió factura electrónica, se emite contra la DIAN y se imprime
      // el térmico con CUFE + QR. Si falla, la venta YA quedó guardada: se avisa
      // y se puede reintentar desde "Ventas realizadas".
      const saleId = created?.data?.id;
      if (docType === 'ELECTRONIC' && fiscalReady && saleId) {
        try {
          const doc = await emitFiscalInvoice(saleId);
          setAlert({
            type: 'success',
            message: `Factura electrónica ${doc?.number || ''} emitida.`,
          });
          printFiscalInvoice(created.data, doc, usuario);
        } catch (e) {
          setAlert({
            type: 'warning',
            message: `La venta se guardó, pero la factura electrónica no se emitió: ${e.message}. Puedes emitirla desde Ventas realizadas.`,
          });
        }
      } else {
        setAlert({ type: 'success', message: successMessage, url: successUrl });
      }

      if (mode === 'new') clearAll();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error al guardar' });
    } finally {
      setSubmitting(false);
    }
  };

  // Solo se muestran productos/servicios de la SEDE seleccionada arriba (para
  // no vender por error el stock de otro local). Cada resultado trae su localId.
  const shownResults = results.filter(
    (r) => !r.localId || String(r.localId) === String(localId)
  );
  // Si el negocio tiene fotos de sus productos, mostramos tarjetas con imagen;
  // si ninguno tiene foto (p.ej. barbería de solo servicios), diseño compacto.
  const resultsHaveImages = shownResults.some((r) => r.image);

  const variantLabel = (i) =>
    !showColor
      ? ''
      : [i.color && i.color !== 'ÚNICO' ? i.color : null, i.size]
          .filter(Boolean)
          .join(' · ');

  const submitText =
    mode === 'edit'
      ? submitting
        ? 'Guardando...'
        : `Guardar cambios · ${formatCOP(total)}`
      : submitting
        ? 'Procesando...'
        : `Cobrar ${formatCOP(total)}${itemCount ? ` · ${itemCount} ít.` : ''}`;

  // Bloqueo por política de caja (solo al crear; editar no se bloquea).
  if (mode === 'new' && requireCashOpen && dayState !== 'ok') {
    const prev = dayState === 'prev_day';
    return (
      <RoleGuard allowedRoles={Object.values(Roles)}>
        <div className="w-full p-4 flex items-center justify-center min-h-[70vh]">
          {dayState === 'loading' ? (
            <p className="text-sm text-gray-400">Verificando el estado del día…</p>
          ) : (
            <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <div
                className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
                  prev
                    ? 'bg-red-50 text-red-500'
                    : 'bg-orange-50 text-orange-500'
                }`}
              >
                {prev ? (
                  <LockClosedIcon className="h-7 w-7" />
                ) : (
                  <CalculatorIcon className="h-7 w-7" />
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-800">
                {prev
                  ? 'El día de ayer no se ha cerrado'
                  : 'Debes abrir el día para vender'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {prev
                  ? 'Quedó una caja abierta de un día anterior. Ciérrala (haz el arqueo) para poder facturar hoy.'
                  : 'Abre la caja del día en esta sede para empezar a facturar. Así el efectivo del día queda controlado.'}
              </p>
              <Link
                href="/dashboard/cash"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
              >
                <CalculatorIcon className="h-5 w-5" />
                {prev ? 'Cerrar el día' : 'Abrir el día'}
              </Link>
            </div>
          )}
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-3 sm:p-4 pb-24 lg:pb-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            {title}
          </h1>
          {locals.length > 1 && (
            <select
              value={localId}
              onChange={(e) => setLocalId(e.target.value)}
              disabled={mode === 'edit'}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
            >
              {locals.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* ================= IZQUIERDA: BUSCADOR ================= */}
          <div className="lg:flex-1 min-w-0">
            <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              {/* En móvil el buscador queda fijo arriba: siempre visible aunque
                  haya muchos productos o el carrito sea largo (para re-buscar). */}
              <div className="sticky top-0 z-20 -mx-3 -mt-3 rounded-t-2xl border-b border-gray-100 bg-white px-3 pb-2 pt-3 lg:static lg:z-auto lg:mx-0 lg:mt-0 lg:rounded-none lg:border-0 lg:p-0 lg:pb-0">
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 focus-within:ring-2 focus-within:ring-orange-500">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                <input
                  ref={searchRef}
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    // Si ya hay resultados, añade el primero.
                    if (shownResults[0]) {
                      addToCart(shownResults[0]);
                      setQuery('');
                      return;
                    }
                    // Lector de código de barras: teclea rápido + Enter antes de
                    // que cargue la búsqueda → se busca al vuelo y se añade.
                    const term = query.trim();
                    if (term.length >= 2) {
                      try {
                        const res = await searchProducts(term);
                        const list = (res?.data || res || []).filter(
                          (r) => !r.localId || String(r.localId) === String(localId)
                        );
                        if (list[0]) {
                          addToCart(list[0]);
                          setQuery('');
                        }
                      } catch (_) {}
                    }
                  }}
                  placeholder={`Buscar ${
                    t.productPlural?.toLowerCase() || 'productos'
                  } o ${
                    t.servicePlural?.toLowerCase() || 'servicios'
                  } (nombre o código)`}
                  className="flex-1 text-base focus:outline-none sm:text-sm"
                />
                {query && (
                  <button onClick={() => setQuery('')}>
                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                )}
                </div>
              </div>

              <div className="mt-3">
                {query.trim().length < 2 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    <ShoppingBagIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    Escribe para buscar y toca un ítem para agregarlo a la
                    factura.
                  </div>
                ) : searching && shownResults.length === 0 ? (
                  <p className="py-8 text-center text-gray-400 text-sm">
                    Buscando...
                  </p>
                ) : shownResults.length === 0 ? (
                  <p className="py-8 text-center text-gray-400 text-sm">
                    Sin resultados para “{query}”.
                  </p>
                ) : (
                  <div
                    className={`grid gap-2 ${
                      resultsHaveImages
                        ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                        : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                    }`}
                  >
                    {shownResults.map((r) => {
                      const isService = r.type === 'service';
                      // Los elaborados sin control de stock (platos) se venden
                      // siempre, como un servicio: no muestran "Sin stock".
                      const isPrepared = r.trackStock === false;
                      const noStock =
                        !isService && !isPrepared && r.stock <= 0;
                      const inCart = cart.find((i) => i.key === keyOf(r));
                      const TypeIcon = isService
                        ? WrenchScrewdriverIcon
                        : ShoppingBagIcon;
                      return (
                        <button
                          key={`${r.type}-${r.id}`}
                          onClick={() => addToCart(r)}
                          disabled={noStock}
                          className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition ${
                            noStock
                              ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                              : inCart
                                ? 'border-orange-400 bg-orange-50/40 shadow-sm ring-1 ring-orange-200'
                                : 'border-gray-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md'
                          }`}
                        >
                          {resultsHaveImages && (
                            <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                              {r.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={r.image}
                                  alt={r.name}
                                  loading="lazy"
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <TypeIcon className="h-9 w-9 text-gray-300" />
                                </div>
                              )}
                              <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-white/85 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 shadow-sm backdrop-blur">
                                <TypeIcon className="h-3 w-3" />
                                {isService ? t.service : t.product}
                              </span>
                              {inCart && (
                                <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                                  <CheckIcon className="h-3 w-3" />
                                  {inCart.quantity}
                                </span>
                              )}
                              {noStock && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                                  <span className="rounded-full bg-red-500/90 px-2 py-0.5 text-[11px] font-semibold text-white">
                                    Sin stock
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex flex-1 flex-col p-2.5">
                            {!resultsHaveImages && (
                              <div className="flex items-start justify-between gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400">
                                  <TypeIcon className="h-3.5 w-3.5" />
                                  {isService ? t.service : t.product}
                                </span>
                                {inCart ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                    <CheckIcon className="h-3 w-3" />
                                    {inCart.quantity}
                                  </span>
                                ) : (
                                  <PlusIcon className="h-4 w-4 text-orange-500 opacity-0 group-hover:opacity-100" />
                                )}
                              </div>
                            )}
                            <span
                              className={`line-clamp-2 text-sm font-medium text-gray-800 ${
                                resultsHaveImages ? '' : 'mt-1'
                              }`}
                            >
                              {r.name}
                              {variantLabel(r) ? (
                                <span className="text-gray-400">
                                  {' '}
                                  · {variantLabel(r)}
                                </span>
                              ) : null}
                            </span>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-900">
                                {formatCOP(r.price)}
                              </span>
                              {!isService && !isPrepared && (
                                <span
                                  className={`text-[11px] ${
                                    noStock ? 'text-red-500' : 'text-gray-400'
                                  }`}
                                >
                                  {noStock ? 'Sin stock' : `Stock: ${r.stock}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= DERECHA: FACTURA ================= */}
          <div className="w-full min-w-0 lg:w-[400px] lg:flex-none">
            <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm lg:sticky lg:top-4">
              {/* Cliente */}
              <div className="p-3 border-b border-gray-100">
                {customer ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 text-sm font-medium text-gray-800 truncate">
                        <UserIcon className="w-4 h-4 flex-none text-gray-400" />
                        {customer.name}
                      </p>
                      {customer.phone && (
                        <p className="text-xs text-gray-400">{customer.phone}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setCustomer(null)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <input
                        value={custSearch}
                        onChange={(e) => setCustSearch(e.target.value)}
                        placeholder="Cliente (opcional) — Consumidor Final"
                        className="flex-1 text-sm focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewCustomer(true)}
                        className="flex-none inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-100"
                      >
                        <PlusIcon className="w-3.5 h-3.5" /> Crear
                      </button>
                    </div>
                    {custResults.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto">
                        {custResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => pickCustomer(c)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50"
                          >
                            {c.name}{' '}
                            <span className="text-gray-400">
                              {c.phone || ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {customer?.loyalty?.nextDiscount > 0 && (
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <GiftIcon className="h-4 w-4 flex-none text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-800">
                      Fidelización: <b>{customer.loyalty.nextDiscount}%</b> en{' '}
                      {t.servicePlural?.toLowerCase() || 'servicios'} —{' '}
                      <b>aplicado automáticamente</b>
                    </span>
                  </div>
                )}
              </div>

              {/* Ítems: alto natural (se ven completos, sin scroll diminuto).
                  La factura crece y la página hace scroll, como en Alegra/Siigo. */}
              <div className="space-y-2 p-3">
                {cart.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gray-400">
                    La factura está vacía. Agrega ítems desde la izquierda.
                  </p>
                ) : (
                  cart.map((i) => {
                    const line =
                      i.price * i.quantity -
                      Math.min(i.discount, i.price * i.quantity);
                    return (
                      <div
                        key={i.key}
                        className="rounded-xl border border-gray-100 p-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-800">
                            {i.name}
                            {variantLabel(i) ? (
                              <span className="text-gray-400">
                                {' '}
                                · {variantLabel(i)}
                              </span>
                            ) : null}
                          </p>
                          <button
                            onClick={() => removeItem(i.key)}
                            className="text-gray-300 hover:text-red-500"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center rounded-lg border border-gray-200">
                            <button
                              onClick={() =>
                                setQty(
                                  i.key,
                                  Number(i.quantity || 0) - qtyStep(i)
                                )
                              }
                              className="px-2 py-1 text-gray-500 hover:bg-gray-50"
                            >
                              <MinusIcon className="w-4 h-4" />
                            </button>
                            <input
                              value={i.quantity}
                              inputMode={isByWeight(i) ? 'decimal' : 'numeric'}
                              onChange={(e) =>
                                onQtyInput(i.key, e.target.value, isByWeight(i))
                              }
                              className={`text-center text-sm focus:outline-none ${
                                isByWeight(i) ? 'w-14' : 'w-10'
                              }`}
                            />
                            <button
                              onClick={() =>
                                setQty(
                                  i.key,
                                  Number(i.quantity || 0) + qtyStep(i)
                                )
                              }
                              className="px-2 py-1 text-gray-500 hover:bg-gray-50"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                          {isByWeight(i) && (
                            <span className="text-[10px] font-medium text-gray-400">
                              por peso
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatCOP(i.price)} c/u
                          </span>
                          <span className="text-sm font-semibold text-gray-800">
                            {formatCOP(line)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[11px] text-gray-400">
                            Descuento $
                          </span>
                          <input
                            value={i.discount ? formatCOP(i.discount) : ''}
                            onChange={(e) =>
                              setDiscount(
                                i.key,
                                Number(e.target.value.replace(/[^\d]/g, '')) || 0
                              )
                            }
                            placeholder="0"
                            className="w-24 rounded border border-gray-200 px-2 py-0.5 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Totales + pago */}
              <div className="border-t border-gray-100 p-3 space-y-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCOP(subtotal)}</span>
                  </div>
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Descuentos</span>
                      <span>− {formatCOP(discountTotal)}</span>
                    </div>
                  )}
                  {showTax && (
                    <>
                      <div className="flex justify-between text-gray-500">
                        <span>Base gravable</span>
                        <span>{formatCOP(baseTotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>
                          {includeIva
                            ? `IVA incluido (${defRate}%)`
                            : `IVA (${defRate}%)`}
                        </span>
                        <span>
                          {includeIva ? '' : '+ '}
                          {formatCOP(taxTotal)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total</span>
                    <span>{formatCOP(total)}</span>
                  </div>
                </div>

                {sellers.length > 0 && !isServiceVertical && (
                  <div>
                    <label className="text-[11px] font-medium text-gray-500">
                      {t.attendant || 'Atendido por'}
                    </label>
                    <select
                      value={sellerId}
                      onChange={(e) => setSellerId(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {sellers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Servicios (barbería/spa/odontología): elegir SOLO uno —
                    quien prestó el servicio (barbero) u otro (recepción). */}
                {sellers.length > 0 && isServiceVertical && (
                  <div>
                    <label className="text-[11px] font-medium text-gray-500">
                      ¿Quién atendió?
                    </label>
                    <div className="mt-0.5 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSellerGroup('attendant');
                          setSellerId('');
                        }}
                        className={`rounded-md px-2 py-1.5 text-sm font-medium transition ${
                          sellerGroup === 'attendant'
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {t.attendant || 'Barbero'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSellerGroup('other');
                          setSellerId('');
                        }}
                        className={`rounded-md px-2 py-1.5 text-sm font-medium transition ${
                          sellerGroup === 'other'
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Otro
                      </button>
                    </div>
                    <select
                      value={sellerId}
                      onChange={(e) => setSellerId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">
                        {sellerGroup === 'attendant'
                          ? `Selecciona el ${(t.attendant || 'barbero').toLowerCase()}…`
                          : 'Selecciona quién atendió…'}
                      </option>
                      {sellerOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {sellerGroup === 'attendant' && barbers.length === 0 && (
                      <p className="mt-1 text-[11px] text-amber-600">
                        No hay {(t.attendantPlural || 'barberos').toLowerCase()}{' '}
                        registrados. Créalos en Usuarios o usa “Otro”.
                      </p>
                    )}
                  </div>
                )}

                {/* Secundarios: fecha y observaciones (colapsados para dar más
                    espacio a los ítems, como en Alegra/Siigo). */}
                <div className="rounded-lg border border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowMore((v) => !v)}
                    className="flex w-full items-center justify-between px-2.5 py-2 text-[12px] font-medium text-gray-600"
                  >
                    <span>Fecha y observaciones</span>
                    <ChevronDownIcon
                      className={`h-4 w-4 text-gray-400 transition ${
                        showMore ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {showMore && (
                    <div className="space-y-3 px-2.5 pb-2.5">
                      <div>
                        <label className="text-[11px] font-medium text-gray-500">
                          Fecha y hora
                        </label>
                        <input
                          type="datetime-local"
                          value={saleDate}
                          onChange={(e) => setSaleDate(e.target.value)}
                          className="mt-0.5 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-gray-500">
                          Observaciones (salen en la factura)
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                          placeholder="Nota para esta factura (opcional)"
                          className="mt-0.5 w-full resize-y rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {(methods.length ? methods : PAYMENT_METHODS).map((pm) => {
                    // Con catálogo: id = id del método, code = comportamiento.
                    // Fallback (sin catálogo): id === code (enum).
                    const isCatalog = methods.length > 0;
                    const selected = isCatalog
                      ? paymentMethodCatalogId === pm.id
                      : paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        onClick={() => {
                          if (isCatalog) {
                            setPaymentMethodCatalogId(pm.id);
                            setPaymentMethod(pm.code);
                          } else {
                            setPaymentMethod(pm.id);
                          }
                        }}
                        className={`rounded-lg px-2 py-1.5 text-xs font-medium border transition ${
                          selected
                            ? 'border-orange-400 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pm.name}
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === 'EFECTIVO' && total > 0 && (
                  <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-2">
                    <label className="text-[11px] font-medium text-gray-500">
                      Efectivo recibido (para el vuelto)
                    </label>
                    <input
                      inputMode="numeric"
                      value={
                        cashReceivedNum ? formatCOP(cashReceivedNum) : ''
                      }
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="$ 0"
                      className="mt-0.5 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setCashReceived(String(total))}
                        className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-200"
                      >
                        Exacto
                      </button>
                      {[20000, 50000, 100000].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setCashReceived(String(v))}
                          className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-200"
                        >
                          {formatCOP(v)}
                        </button>
                      ))}
                    </div>
                    {cashReceivedNum > 0 && (
                      <div
                        className={`mt-1.5 flex justify-between text-sm font-semibold ${
                          change >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        <span>{change >= 0 ? 'Vuelto' : 'Faltan'}</span>
                        <span>{formatCOP(Math.abs(change))}</span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'CREDITO' && (
                  <div>
                    <label className="text-[11px] font-medium text-gray-500">
                      Fecha de vencimiento (opcional)
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}

                {/* Tipo de comprobante: solo si la empresa tiene facturación
                    electrónica DIAN activa. */}
                {fiscalReady && mode === 'new' && (
                  <div className="mb-2">
                    <p className="mb-1 text-xs font-medium text-gray-500">
                      Tipo de comprobante
                    </p>
                    <div className="inline-flex w-full rounded-xl border border-gray-200 bg-gray-50 p-0.5">
                      <button
                        type="button"
                        onClick={() => setDocType('POS')}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          docType === 'POS'
                            ? 'bg-white text-gray-800 shadow-sm'
                            : 'text-gray-500'
                        }`}
                      >
                        Tiquete POS
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocType('ELECTRONIC')}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          docType === 'ELECTRONIC'
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow'
                            : 'text-gray-500'
                        }`}
                      >
                        Factura electrónica
                      </button>
                    </div>
                    {docType === 'ELECTRONIC' && (
                      <p className="mt-1 text-[11px] text-orange-600">
                        Se emitirá ante la DIAN y se imprimirá con CUFE + QR.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {mode === 'new' && cart.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Limpiar
                    </button>
                  )}
                  <button
                    onClick={submit}
                    disabled={submitting || cart.length === 0}
                    className="flex-1 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {docType === 'ELECTRONIC' && fiscalReady
                      ? 'Facturar electrónicamente'
                      : submitText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showNewCustomer && (
          <NewCustomerModal
            localId={localId}
            onClose={() => setShowNewCustomer(false)}
            onCreated={(c) => {
              setShowNewCustomer(false);
              if (c) pickCustomer(c);
            }}
          />
        )}

        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '', url: '' })}
          url={alert.url}
        />
      </div>
    </RoleGuard>
  );
}
