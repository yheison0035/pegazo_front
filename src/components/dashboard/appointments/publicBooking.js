'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import useAppointments from '@/lib/api/hooks/useAppointments';
import useLocals from '@/lib/api/hooks/useLocals';
import useServices from '@/lib/api/hooks/useServices';
import { getPublicProfessionals } from '@/lib/api/routes/users';
import { formatPrice } from '@/lib/api/utils/utils';
import {
  BuildingStorefrontIcon,
  ScissorsIcon,
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckIcon,
  ChevronLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const WHATSAPP = '573218263404';
const COMPANY_ID = 2; // RAGNOR BARBER
const LOGO =
  'https://res.cloudinary.com/dl7g5sslz/image/upload/v1777311594/logo_ragnor_okgsb8.png';

const STEPS = [
  { key: 'sede', label: 'Sede', icon: BuildingStorefrontIcon },
  { key: 'servicio', label: 'Servicio', icon: ScissorsIcon },
  { key: 'profesional', label: 'Profesional', icon: UserIcon },
  { key: 'fecha', label: 'Fecha', icon: CalendarDaysIcon },
  { key: 'horario', label: 'Hora', icon: ClockIcon },
  { key: 'confirmar', label: 'Confirmar', icon: CheckIcon },
];

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

// Próximos N días como opciones (fecha local, formato YYYY-MM-DD).
function buildDays(n = 21) {
  const out = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    out.push({
      value,
      dow: DIAS[d.getDay()],
      day: d.getDate(),
      month: MESES[d.getMonth()],
      isToday: i === 0,
      isTomorrow: i === 1,
    });
  }
  return out;
}

export default function PublicBooking() {
  const [step, setStep] = useState(0); // índice 0..5

  const [locals, setLocals] = useState([]);
  const [local, setLocal] = useState(null);
  const [services, setServices] = useState([]);
  const [service, setService] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [barber, setBarber] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState('');
  const [success, setSuccess] = useState(false);

  const { getPublicLocals } = useLocals();
  const { getAvailability, availabilityLoading } = useAppointments();
  const { getPublicServices } = useServices();

  const days = useMemo(() => buildDays(21), []);

  // ---- Carga de datos ----
  useEffect(() => {
    getPublicLocals({ all: true, companyId: COMPANY_ID })
      .then((res) => {
        const list = res?.data || [];
        setLocals(list);
        // Si solo hay una sede, se elige sola y arrancamos en "Servicio".
        if (list.length === 1) {
          setLocal(list[0]);
          setStep(1);
        }
      })
      .catch(() => setLocals([]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!local) return;
    getPublicServices({ all: true, localId: local.id })
      .then((res) => setServices(res?.data || []))
      .catch(() => setServices([]));
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!service || !local) return;
    getPublicProfessionals({ localId: local.id, serviceId: service.id })
      .then((data) => setBarbers(data || []))
      .catch(() => setBarbers([]));
  }, [service]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!barber || !date) return;
    setSlots([]);
    getAvailability({ barberId: barber.id, date, serviceId: service.id })
      .then((data) => setSlots(data || []))
      .catch(() => setSlots([]));
  }, [barber, date]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Selección (avanza al siguiente paso) ----
  const pickLocal = (l) => {
    setLocal(l);
    setService(null); setBarber(null); setDate(''); setTime(''); setSlots([]);
    setStep(1);
  };
  const pickService = (s) => {
    setService(s);
    setBarber(null); setDate(''); setTime(''); setSlots([]);
    setStep(2);
  };
  const pickBarber = (b) => {
    setBarber(b);
    setDate(''); setTime(''); setSlots([]);
    setStep(3);
  };
  const pickDate = (d) => {
    setDate(d);
    setTime('');
    setStep(4);
  };
  const pickTime = (t) => {
    setTime(t);
    setStep(5);
  };

  const back = () => {
    const min = locals.length === 1 ? 1 : 0;
    const target = Math.max(min, step - 1);
    // Al volver atrás se limpia la selección de ese paso (y las siguientes),
    // así el chip desaparece y el usuario la elige de nuevo.
    if (target <= 0 && locals.length > 1) setLocal(null);
    if (target <= 1) setService(null);
    if (target <= 2) setBarber(null);
    if (target <= 3) setDate('');
    if (target <= 4) setTime('');
    setSlots([]);
    setStep(target);
  };

  const reset = () => {
    setLocal(locals.length === 1 ? locals[0] : null);
    setService(null); setBarber(null); setDate(''); setTime(''); setSlots([]);
    setStep(locals.length === 1 ? 1 : 0);
    setSuccess(false);
  };

  const confirmar = () => {
    if (!local || !service || !barber || !date || !time) return;
    const [y, m, d] = date.split('-');
    const fechaTxt = `${d}/${m}/${y}`;
    const msg = `Hola, quiero agendar una cita en RAGNOR BARBER:\n\n📍 Sede: ${local.name}\n💈 Servicio: ${service.name}\n👤 Profesional: ${barber.name}\n📅 Fecha: ${fechaTxt}\n🕐 Hora: ${time}`;
    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener,noreferrer',
    );
    setSuccess(true);
  };

  const selectedDay = days.find((d) => d.value === date);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-black text-white">
      {/* Marca de agua */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-[0.03]">
        <img src={LOGO} alt="" className="w-[560px] max-w-[90%]" />
      </div>

      {/* Encabezado */}
      <header className="relative z-10 px-4 pt-6 text-center sm:pt-8">
        <img src={LOGO} alt="RAGNOR BARBER" className="mx-auto h-12 w-auto sm:h-16" />
        <h1 className="mt-3 text-xl font-bold tracking-tight sm:text-3xl">
          Agenda tu cita
        </h1>
        <p className="mt-0.5 text-xs text-amber-400/80 sm:text-sm">
          Experiencia premium
        </p>
      </header>

      {/* Stepper */}
      <div className="relative z-10 mx-auto mt-4 w-full max-w-2xl px-4 sm:mt-6 sm:px-5">
        <Stepper step={step} />
      </div>

      {/* Contexto de la selección (incluye la sede aunque sea única) */}
      {(local || service || barber) && !success && (
        <div className="relative z-10 mx-auto mt-4 flex w-full max-w-2xl flex-wrap gap-1.5 px-4 sm:px-5">
          {local && (
            <Chip icon={BuildingStorefrontIcon} text={local.name} />
          )}
          {service && <Chip icon={ScissorsIcon} text={service.name} />}
          {barber && <Chip icon={UserIcon} text={barber.name} />}
        </div>
      )}

      {/* Contenido */}
      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-4 pb-32 pt-5 sm:px-5">
        {step > (locals.length === 1 ? 1 : 0) && !success && (
          <button
            type="button"
            onClick={back}
            className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
          >
            <ChevronLeftIcon className="h-4 w-4" /> Atrás
          </button>
        )}

        <AnimatePresence mode="wait">
          {success ? (
            <SuccessScreen
              key="success"
              onReset={reset}
              summary={{ local, service, barber, date: selectedDay, time }}
            />
          ) : (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <StepTitle index={step} />

              {/* 1. SEDE */}
              {step === 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {locals.length === 0 && <Skeletons n={2} />}
                  {locals.map((l) => (
                    <OptionCard
                      key={l.id}
                      active={local?.id === l.id}
                      onClick={() => pickLocal(l)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                          <BuildingStorefrontIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{l.name}</p>
                          {l.address && (
                            <p className="truncate text-xs text-gray-400">
                              {l.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </OptionCard>
                  ))}
                </div>
              )}

              {/* 2. SERVICIO */}
              {step === 1 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {services.length === 0 && <Skeletons n={4} />}
                  {services.map((s) => (
                    <OptionCard
                      key={s.id}
                      active={service?.id === s.id}
                      onClick={() => pickService(s)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold leading-tight">
                            {s.name}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {s.duration} min
                          </p>
                        </div>
                        <span className="flex-none rounded-lg bg-amber-500/10 px-2 py-1 text-sm font-bold text-amber-400">
                          {s.priceFrom
                            ? `$${formatPrice(s.priceFrom)}`
                            : 'A convenir'}
                        </span>
                      </div>
                    </OptionCard>
                  ))}
                </div>
              )}

              {/* 3. PROFESIONAL */}
              {step === 2 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {barbers.length === 0 && <Skeletons n={3} tall />}
                  {barbers.map((b) => (
                    <OptionCard
                      key={b.id}
                      active={barber?.id === b.id}
                      onClick={() => pickBarber(b)}
                      className="text-center"
                    >
                      <img
                        src={
                          b.avatar ||
                          `https://ui-avatars.com/api/?background=1a1a1a&color=f59e0b&name=${encodeURIComponent(
                            b.name || 'B',
                          )}`
                        }
                        alt={b.name}
                        className="mx-auto mb-2 h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20"
                      />
                      <p className="truncate text-sm font-semibold">{b.name}</p>
                    </OptionCard>
                  ))}
                </div>
              )}

              {/* 4. FECHA */}
              {step === 3 && (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {days.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => pickDate(d.value)}
                      className={`flex flex-col items-center rounded-xl border px-2 py-2 transition ${
                        date === d.value
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-gray-800 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <span className="text-[10px] uppercase text-gray-400">
                        {d.isToday ? 'Hoy' : d.isTomorrow ? 'Mañana' : d.dow}
                      </span>
                      <span className="text-lg font-bold leading-tight sm:text-xl">
                        {d.day}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {d.month}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 5. HORARIO */}
              {step === 4 && (
                <>
                  {availabilityLoading ? (
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                      <Skeletons n={8} small />
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="rounded-2xl border border-gray-800 bg-white/[0.02] p-8 text-center">
                      <ClockIcon className="mx-auto mb-2 h-8 w-8 text-gray-600" />
                      <p className="text-sm text-gray-400">
                        No hay horarios disponibles ese día.
                      </p>
                      <button
                        onClick={back}
                        className="mt-3 text-sm font-medium text-amber-400 hover:underline"
                      >
                        Elegir otra fecha
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                      {slots.map((s, i) => (
                        <button
                          key={`${s}-${i}`}
                          type="button"
                          onClick={() => pickTime(s)}
                          className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                            time === s
                              ? 'border-amber-500 bg-amber-500 text-black'
                              : 'border-gray-800 text-gray-200 hover:border-amber-500/60'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* 6. CONFIRMAR */}
              {step === 5 && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
                    <Row icon={BuildingStorefrontIcon} label="Sede" value={local?.name} />
                    <Row icon={ScissorsIcon} label="Servicio" value={service?.name} sub={`${service?.duration} min · ${service?.priceFrom ? `$${formatPrice(service.priceFrom)}` : 'A convenir'}`} />
                    <Row icon={UserIcon} label="Profesional" value={barber?.name} />
                    <Row
                      icon={CalendarDaysIcon}
                      label="Fecha"
                      value={
                        selectedDay
                          ? `${selectedDay.dow} ${selectedDay.day} ${selectedDay.month}`
                          : date
                      }
                    />
                    <Row icon={ClockIcon} label="Hora" value={time} last />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Botón fijo de reservar (solo en confirmación) */}
      {step === 5 && !success && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-800 bg-black/90 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <button
              onClick={confirmar}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-4 text-base font-bold text-black shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
            >
              Reservar por WhatsApp
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Subcomponentes ---------------- */

function Stepper({ step }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition sm:h-9 sm:w-9 ${
                  active
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.35)]'
                    : done
                      ? 'border-amber-500 bg-amber-500 text-black'
                      : 'border-gray-700 text-gray-600'
                }`}
              >
                {done ? (
                  <CheckIcon className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`mt-1 hidden text-[10px] sm:block ${
                  active ? 'text-amber-400' : done ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 rounded ${
                  i < step ? 'bg-amber-500' : 'bg-gray-800'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepTitle({ index }) {
  const s = STEPS[index];
  const titles = [
    'Elige la sede',
    'Elige el servicio',
    'Elige el profesional',
    'Elige la fecha',
    'Elige la hora',
    'Confirma tu cita',
  ];
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
        Paso {index + 1} de {STEPS.length}
      </span>
      <span className="h-1 w-1 rounded-full bg-gray-700" />
      <h2 className="text-lg font-bold">{titles[index]}</h2>
    </div>
  );
}

function Chip({ icon: Icon, text }) {
  return (
    <span className="inline-flex max-w-[47%] items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 sm:max-w-none">
      <Icon className="h-3 w-3 flex-none" />
      <span className="truncate">{text}</span>
    </span>
  );
}

function OptionCard({ active, onClick, children, className = '' }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full rounded-xl border p-3 text-left transition sm:rounded-2xl sm:p-3.5 ${
        active
          ? 'border-amber-500 bg-amber-500/10'
          : 'border-gray-800 bg-white/[0.02] hover:border-gray-600'
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}

function Row({ icon: Icon, label, value, sub, last }) {
  return (
    <div
      className={`flex items-center gap-3 py-2.5 ${
        last ? '' : 'border-b border-white/10'
      }`}
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className="truncate font-semibold">{value || '—'}</p>
        {sub && <p className="truncate text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function SuccessScreen({ onReset, summary }) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-green-500/30 bg-green-500/[0.06] p-8 text-center"
    >
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 text-green-400">
        <CheckIcon className="h-8 w-8" strokeWidth={2.5} />
      </div>
      <h2 className="text-xl font-bold">¡Casi listo!</h2>
      <p className="mt-1 text-sm text-gray-300">
        Te llevamos a WhatsApp para confirmar tu cita con{' '}
        <span className="text-amber-400">{summary.barber?.name}</span>
        {summary.date ? ` el ${summary.date.dow} ${summary.date.day} ${summary.date.month}` : ''}
        {summary.time ? ` a las ${summary.time}` : ''}.
      </p>
      <button
        onClick={onReset}
        className="mt-6 rounded-xl border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-amber-500 hover:text-amber-400"
      >
        Agendar otra cita
      </button>
    </motion.div>
  );
}

function Skeletons({ n = 3, tall, small }) {
  return Array.from({ length: n }).map((_, i) => (
    <div
      key={i}
      className={`animate-pulse rounded-2xl border border-gray-800 bg-white/[0.03] ${
        small ? 'h-10' : tall ? 'h-32' : 'h-16'
      }`}
    />
  ));
}
