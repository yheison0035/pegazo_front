'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import useAppointments from '@/lib/api/hooks/useAppointments';
import useLocals from '@/lib/api/hooks/useLocals';
import useServices from '@/lib/api/hooks/useServices';
import { getPublicProfessionals } from '@/lib/api/routes/users';
import { getBookingConfig } from '@/lib/api/routes/appointments';
import { formatPrice } from '@/lib/api/utils/utils';
import { resolveSkin } from './bookingSkins';
import {
  WARRIOR_CSS,
  Corners,
  RuneDivider,
  AngleBrackets,
  Embers,
  MountainsBackdrop,
  CrossedAxes,
  groupServices,
} from './bookingWarrior';
import {
  BuildingStorefrontIcon,
  ScissorsIcon,
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckIcon,
  ChevronLeftIcon,
  ArrowRightIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/outline';

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

export default function PublicBooking({ slug = '' }) {
  // ---- Config de la empresa (marca + skin) ----
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [step, setStep] = useState(0); // índice 0..5

  const [locals, setLocals] = useState([]);
  const [local, setLocal] = useState(null);
  const [services, setServices] = useState([]);
  const [service, setService] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [barber, setBarber] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [restOff, setRestOff] = useState(false);
  const [restReason, setRestReason] = useState('');
  const [time, setTime] = useState('');
  const [success, setSuccess] = useState(false);
  const [started, setStarted] = useState(false); // portada (intro) del skin oscuro

  const { getPublicLocals } = useLocals();
  const { getAvailability, availabilityLoading } = useAppointments();
  const { getPublicServices } = useServices();

  const days = useMemo(() => buildDays(21), []);
  const skin = useMemo(
    () => resolveSkin(config?.skin, config?.accent),
    [config?.skin, config?.accent],
  );
  const companyId = config?.companyId;
  const displayStyle = skin.display
    ? { fontFamily: 'var(--bk-font-display, inherit)' }
    : undefined;

  // ---- Carga de la config por slug ----
  useEffect(() => {
    let alive = true;
    setLoadingConfig(true);
    getBookingConfig(slug)
      .then((cfg) => {
        if (alive) setConfig(cfg);
      })
      .finally(() => alive && setLoadingConfig(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  // ---- Carga de sedes (cuando ya conocemos la empresa) ----
  useEffect(() => {
    if (!companyId) return;
    getPublicLocals({ all: true, companyId })
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
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setRestOff(false);
    setRestReason('');
    getAvailability({ barberId: barber.id, date, serviceId: service.id })
      .then((res) => {
        setRestOff(!!res?.off);
        setRestReason(res?.reason || '');
        setSlots(res?.slots || []);
      })
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
    const negocio = config?.name || 'la barbería';
    const msg = `Hola, quiero agendar una cita en ${negocio}:\n\n📍 Sede: ${local.name}\n💈 Servicio: ${service.name}\n👤 Profesional: ${barber.name}\n📅 Fecha: ${fechaTxt}\n🕐 Hora: ${time}`;
    const wa = config?.whatsapp;
    if (wa) {
      window.open(
        `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`,
        '_blank',
        'noopener,noreferrer',
      );
    }
    setSuccess(true);
  };

  const selectedDay = days.find((d) => d.value === date);

  // ---- Estados de carga / no encontrado ----
  if (loadingConfig) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black text-gray-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-amber-500" />
      </div>
    );
  }
  if (!config) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-2 bg-black px-6 text-center text-gray-300">
        <BuildingStorefrontIcon className="h-10 w-10 text-gray-600" />
        <h1 className="text-lg font-bold">Negocio no encontrado</h1>
        <p className="text-sm text-gray-500">
          Revisa el enlace de tu página de citas.
        </p>
      </div>
    );
  }

  const ornate = skin.ornaments;
  const showHero = ornate && !started && !success;
  // Servicios agrupados en categorías (estilo menú) si el negocio define reglas.
  const grouped = groupServices(services, config?.serviceGroups);
  // Panel del paso: se omite en Servicio cuando hay categorías (cada categoría
  // es su propio panel, como el menú).
  const stepPanel = ornate && !(step === 1 && grouped);

  return (
    <div
      style={skin.style}
      data-skin={config.skin}
      className={`relative flex w-full flex-col overflow-x-hidden bg-[var(--bk-bg)] text-[var(--bk-text)] ${
        ornate ? 'bk-stone' : ''
      } ${showHero ? 'h-[100svh] overflow-hidden' : 'min-h-screen'}`}
    >
      {ornate && <style>{WARRIOR_CSS}</style>}
      {config.musicUrl && <SoundToggle src={config.musicUrl} />}
      {/* Guerrero SIEMPRE de fondo (todo el flujo) */}
      {ornate && config.heroImage && (
        <div
          className="bk-fixed-bg"
          style={{ backgroundImage: `url("${config.heroImage}")` }}
        />
      )}
      {ornate && <Embers />}
      {/* Sin imagen de fondo: textura de piedra + marca de agua */}
      {ornate && !config.heroImage && <WarriorBackdrop logo={config.logo} />}

      {showHero ? (
        <Hero
          config={config}
          displayStyle={displayStyle}
          onEnter={() => setStarted(true)}
        />
      ) : (
      <>
      {/* Encabezado */}
      <header className="relative z-10 px-4 pt-6 text-center sm:pt-8">
        {config.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={config.logo}
            alt={config.name}
            className="mx-auto h-14 w-auto sm:h-20"
          />
        ) : (
          <div
            style={displayStyle}
            className="text-2xl font-black uppercase tracking-wide text-[var(--bk-accent)] sm:text-3xl"
          >
            {config.name}
          </div>
        )}
        <h1
          style={displayStyle}
          className={`mt-3 text-2xl font-bold tracking-tight sm:text-4xl ${
            ornate ? 'bk-gold uppercase' : ''
          }`}
        >
          {ornate ? (
            <AngleBrackets>{config.tagline || 'Agenda tu cita'}</AngleBrackets>
          ) : (
            config.tagline || 'Agenda tu cita'
          )}
        </h1>
        <p
          className={`mt-1 text-xs sm:text-sm ${
            ornate
              ? 'uppercase tracking-[0.25em] text-[var(--bk-text-muted)]'
              : 'text-[var(--bk-accent)]/90'
          }`}
        >
          {config.subtitle || 'Reserva en segundos'}
        </p>
        {ornate && <RuneDivider />}
      </header>

      {/* Stepper */}
      <div className="relative z-10 mx-auto mt-4 w-full max-w-2xl px-4 sm:mt-6 sm:px-5">
        <Stepper step={step} />
      </div>

      {/* Contexto de la selección */}
      {(local || service || barber) && !success && (
        <div className="relative z-10 mx-auto mt-4 flex w-full max-w-2xl flex-wrap gap-1.5 px-4 sm:px-5">
          {local && <Chip icon={BuildingStorefrontIcon} text={local.name} />}
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
            className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--bk-text-muted)] transition hover:text-[var(--bk-text)]"
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
              <div className={stepPanel ? 'bk-panel relative p-5 sm:p-6' : ''}>
                {stepPanel && <Corners />}
                <StepTitle index={step} displayStyle={displayStyle} ornate={ornate} />

              {/* 1. SEDE */}
              {step === 0 && (
                <div className="bk-grid grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {locals.length === 0 && <Skeletons n={2} />}
                  {locals.map((l) => (
                    <OptionCard
                      key={l.id}
                      active={local?.id === l.id}
                      onClick={() => pickLocal(l)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[var(--bk-accent-soft)] text-[var(--bk-accent)]">
                          <BuildingStorefrontIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{l.name}</p>
                          {l.address && (
                            <p className="truncate text-xs text-[var(--bk-text-muted)]">
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
              {step === 1 && grouped && (
                <div className="mt-4 space-y-4">
                  {grouped.map((g) => (
                    <section key={g.title} className="bk-cat">
                      <div className="bk-cathead">
                        <span className="bk-badge flex h-9 w-9 flex-none items-center justify-center rounded-full text-[var(--bk-accent)]">
                          <ScissorsIcon className="h-4 w-4" />
                        </span>
                        <h3
                          style={displayStyle}
                          className="bk-gold text-base font-bold uppercase tracking-wide"
                        >
                          {g.title}
                        </h3>
                      </div>
                      <div className="bk-panel relative p-3 sm:p-4">
                        <Corners />
                        {g.items.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => pickService(s)}
                            className="bk-svc w-full text-left"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold">
                                {s.name}
                              </span>
                              <span className="block text-xs text-[var(--bk-text-muted)]">
                                {s.duration} min
                              </span>
                            </span>
                            <span
                              style={displayStyle}
                              className="flex-none font-bold text-[var(--bk-accent)]"
                            >
                              {s.priceFrom
                                ? `$${formatPrice(s.priceFrom)}`
                                : 'A convenir'}
                            </span>
                            <span className="go flex-none text-lg font-bold">›</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
              {step === 1 && !grouped && (
                <div className="bk-grid grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {services.length === 0 && <Skeletons n={4} />}
                  {services.map((s) => (
                    <OptionCard
                      key={s.id}
                      active={service?.id === s.id}
                      onClick={() => pickService(s)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold leading-tight">{s.name}</p>
                          <p className="mt-0.5 text-xs text-[var(--bk-text-muted)]">
                            {s.duration} min
                          </p>
                        </div>
                        <span className="flex-none rounded-lg bg-[var(--bk-accent-soft)] px-2 py-1 text-sm font-bold text-[var(--bk-accent)]">
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
                <div className="bk-grid grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {barbers.length === 0 && <Skeletons n={3} tall />}
                  {barbers.map((b) => (
                    <OptionCard
                      key={b.id}
                      active={barber?.id === b.id}
                      onClick={() => pickBarber(b)}
                      className="text-center"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
                          ? 'border-[var(--bk-accent)] bg-[var(--bk-accent-soft)] text-[var(--bk-text)]'
                          : 'border-[var(--bk-border)] text-[var(--bk-text-muted)] hover:border-[var(--bk-border-strong)]'
                      }`}
                    >
                      <span className="text-[10px] uppercase text-[var(--bk-text-muted)]">
                        {d.isToday ? 'Hoy' : d.isTomorrow ? 'Mañana' : d.dow}
                      </span>
                      <span className="text-lg font-bold leading-tight sm:text-xl">
                        {d.day}
                      </span>
                      <span className="text-[11px] text-[var(--bk-text-muted)]">
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
                  ) : restOff ? (
                    <div className="rounded-2xl border border-[var(--bk-border-strong)] bg-[var(--bk-accent-soft)] p-8 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bk-accent-soft)] text-3xl">
                        🌙
                      </div>
                      <p className="text-base font-semibold text-[var(--bk-accent)]">
                        {(barber?.name || 'El profesional').split(' ')[0]} descansa
                        este día
                      </p>
                      <p className="mt-1 text-sm text-[var(--bk-text-muted)]">
                        {restReason ? `${restReason}. ` : ''}Elige otra fecha para
                        agendar tu cita.
                      </p>
                      <button
                        onClick={back}
                        className="mt-4 rounded-xl border border-[var(--bk-border-strong)] px-4 py-2 text-sm font-semibold text-[var(--bk-accent)] transition hover:bg-[var(--bk-accent-soft)]"
                      >
                        Elegir otra fecha
                      </button>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="rounded-2xl border border-[var(--bk-border)] bg-[var(--bk-surface)] p-8 text-center">
                      <ClockIcon className="mx-auto mb-2 h-8 w-8 text-[var(--bk-text-muted)]" />
                      <p className="text-sm text-[var(--bk-text-muted)]">
                        No hay horarios disponibles ese día.
                      </p>
                      <button
                        onClick={back}
                        className="mt-3 text-sm font-medium text-[var(--bk-accent)] hover:underline"
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
                              ? 'border-[var(--bk-accent)] bg-[var(--bk-accent)] text-[var(--bk-accent-contrast)]'
                              : 'border-[var(--bk-border)] text-[var(--bk-text)] hover:border-[var(--bk-border-strong)]'
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
                  <div className="rounded-2xl border border-[var(--bk-border-strong)] bg-[var(--bk-accent-soft)] p-5">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </>
      )}

      {/* Botón fijo de reservar (solo en confirmación) */}
      {step === 5 && !success && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--bk-border)] bg-[var(--bk-bg)]/90 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <button
              onClick={confirmar}
              className="bk-cta flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--bk-accent)] px-6 py-4 text-base font-bold uppercase tracking-wide text-[var(--bk-accent-contrast)] shadow-lg transition hover:brightness-110"
            >
              {config.whatsapp ? 'Reservar por WhatsApp' : 'Reservar cita'}
              {config.ravenImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.ravenImage} alt="" className="bk-btn-raven" />
              ) : (
                <ArrowRightIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Subcomponentes ---------------- */

// Botón de sonido opcional: APAGADO por defecto. La música (ambientación en
// loop, volumen moderado) solo suena cuando el visitante toca el botón (gesto
// que los navegadores exigen). Se recuerda la preferencia.
function SoundToggle({ src }) {
  const audioRef = useRef(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0.32;
    if (on) a.play().catch(() => {});
    else a.pause();
    try {
      localStorage.setItem('bk-sound', on ? '1' : '0');
    } catch {
      /* almacenamiento no disponible */
    }
  }, [on]);

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="none" />
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        aria-label={on ? 'Silenciar música' : 'Activar música'}
        title={on ? 'Silenciar' : 'Activar sonido'}
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--bk-accent)]/40 bg-black/55 text-[var(--bk-accent)] backdrop-blur transition hover:border-[var(--bk-accent)]"
      >
        {on ? (
          <SpeakerWaveIcon className="h-5 w-5" />
        ) : (
          <SpeakerXMarkIcon className="h-5 w-5" />
        )}
      </button>
    </>
  );
}

function Hero({ config, displayStyle, onEnter }) {
  const intro = config.intro || {};
  return (
    <div className="bk-hero relative z-10 px-4">
      {/* Sin imagen: montañas + hachas. Con imagen: el guerrero va de fondo fijo. */}
      {!config.heroImage && (
        <>
          <div className="bk-mts">
            <MountainsBackdrop />
          </div>
          <CrossedAxes />
        </>
      )}
      {config.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={config.logo} alt={config.name} className="bk-hero-logo" />
      ) : (
        <div
          style={displayStyle}
          className="bk-gold text-4xl font-black uppercase sm:text-5xl"
        >
          {config.name}
        </div>
      )}
      <p
        style={displayStyle}
        className="bk-gold mt-3 text-sm italic sm:text-base"
      >
        {config.subtitle || 'Más que un corte, es actitud'}
      </p>
      <h1
        style={displayStyle}
        className="bk-gold mt-2 text-4xl font-black uppercase leading-none sm:text-6xl"
      >
        {config.name}
      </h1>
      <div className="bk-legible mt-3 text-[11px] uppercase tracking-[0.4em] text-[var(--bk-text-muted)]">
        {intro.pills || 'Disciplina · Estilo · Actitud'}
      </div>
      <RuneDivider />
      <button className="bk-enter mt-4" onClick={onEnter}>
        {intro.cta || 'Comienza tu leyenda'}
        {config.ravenImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.ravenImage} alt="" className="bk-btn-raven ml-2" />
        ) : (
          ' ⚔'
        )}
      </button>
      <div className="bk-legible mt-5 text-[11px] uppercase tracking-[0.25em] text-[var(--bk-text-muted)]/80">
        Reserva en 60 segundos
      </div>
    </div>
  );
}

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
                    ? 'bk-step-active border-[var(--bk-accent)] bg-[var(--bk-accent-soft)] text-[var(--bk-accent)]'
                    : done
                      ? 'border-[var(--bk-accent)] bg-[var(--bk-accent)] text-[var(--bk-accent-contrast)]'
                      : 'border-[var(--bk-border)] text-[var(--bk-text-muted)]'
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
                  active
                    ? 'text-[var(--bk-accent)]'
                    : 'text-[var(--bk-text-muted)]'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 rounded ${
                  i < step ? 'bg-[var(--bk-accent)]' : 'bg-[var(--bk-border)]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepTitle({ index, displayStyle, ornate }) {
  const titles = [
    'Elige la sede',
    'Elige el servicio',
    'Elige el profesional',
    'Elige la fecha',
    'Elige la hora',
    'Confirma tu cita',
  ];
  const Icon = STEPS[index].icon;
  return (
    <div className="mb-4 flex items-center gap-3">
      {ornate && (
        <span className="bk-badge flex h-11 w-11 flex-none items-center justify-center rounded-full text-[var(--bk-accent)]">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--bk-accent)]">
          Paso {index + 1} de {STEPS.length}
        </p>
        <h2
          style={displayStyle}
          className={`text-lg font-bold sm:text-xl ${
            ornate ? 'bk-gold uppercase tracking-wide' : ''
          }`}
        >
          {titles[index]}
        </h2>
      </div>
    </div>
  );
}

function Chip({ icon: Icon, text }) {
  return (
    <span className="inline-flex max-w-[47%] items-center gap-1 rounded-full border border-[var(--bk-border-strong)] bg-[var(--bk-accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--bk-accent)] sm:max-w-none">
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
      className={`bk-card w-full rounded-xl border p-3 text-left transition sm:rounded-2xl sm:p-3.5 ${
        active
          ? 'is-active border-[var(--bk-accent)] bg-[var(--bk-accent-soft)]'
          : 'border-[var(--bk-border)] bg-[var(--bk-surface)] hover:border-[var(--bk-border-strong)] hover:bg-[var(--bk-surface-2)]'
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
        last ? '' : 'border-b border-[var(--bk-border)]'
      }`}
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[var(--bk-accent-soft)] text-[var(--bk-accent)]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-[var(--bk-text-muted)]">
          {label}
        </p>
        <p className="truncate font-semibold">{value || '—'}</p>
        {sub && <p className="truncate text-xs text-[var(--bk-text-muted)]">{sub}</p>}
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
      <p className="mt-1 text-sm text-[var(--bk-text-muted)]">
        Te llevamos a WhatsApp para confirmar tu cita con{' '}
        <span className="text-[var(--bk-accent)]">{summary.barber?.name}</span>
        {summary.date ? ` el ${summary.date.dow} ${summary.date.day} ${summary.date.month}` : ''}
        {summary.time ? ` a las ${summary.time}` : ''}.
      </p>
      <button
        onClick={onReset}
        className="mt-6 rounded-xl border border-[var(--bk-border)] px-5 py-2.5 text-sm font-semibold text-[var(--bk-text)] transition hover:border-[var(--bk-accent)] hover:text-[var(--bk-accent)]"
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
      className={`animate-pulse rounded-2xl border border-[var(--bk-border)] bg-[var(--bk-surface)] ${
        small ? 'h-10' : tall ? 'h-32' : 'h-16'
      }`}
    />
  ));
}

/* ---------------- Ornamentos del skin oscuro (guerrero) ---------------- */

function WarriorBackdrop({ logo }) {
  return (
    <>
      {/* Textura + viñeta */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -10%, var(--bk-bg-2) 0%, var(--bk-bg) 60%), radial-gradient(90% 60% at 50% 120%, rgba(0,0,0,0.6), transparent)',
        }}
      />
      {/* Marca de agua del logo */}
      {logo && (
        <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center opacity-[0.035]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" className="w-[560px] max-w-[90%]" />
        </div>
      )}
    </>
  );
}
