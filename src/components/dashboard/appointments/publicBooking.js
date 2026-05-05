'use client';

import { motion } from 'framer-motion';
import useAppointments from '@/lib/api/hooks/useAppointments';
import useLocals from '@/lib/api/hooks/useLocals';
import useUsers from '@/lib/api/hooks/useUsers';
import useServices from '@/lib/api/hooks/useServices';
import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/api/utils/utils';
import {
  BuildingStorefrontIcon,
  ScissorsIcon,
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function PublicBooking() {
  const [locals, setLocals] = useState([]);
  const [local, setLocal] = useState(null);

  const [services, setServices] = useState([]);
  const [service, setService] = useState(null);

  const [barbers, setBarbers] = useState([]);
  const [barber, setBarber] = useState(null);

  const [success, setSuccess] = useState(false);

  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState('');

  const { getPublicLocals } = useLocals();
  const { getUsersByRole } = useUsers();
  const { getAvailability, availabilityLoading } = useAppointments();
  const { getPublicServices } = useServices();

  const currentStep = !local
    ? 1
    : !service
      ? 2
      : !barber
        ? 3
        : !date
          ? 4
          : !time
            ? 5
            : 6;

  useEffect(() => {
    loadLocals();
  }, []);

  const loadLocals = async () => {
    const res = await getPublicLocals({
      all: true,
      companyId: 2,
    });
    setLocals(res.data || []);
  };

  const loadServices = async () => {
    if (!local) return;

    const res = await getPublicServices({
      all: true,
      localId: local.id,
    });

    setServices(res.data || []);
  };

  useEffect(() => {
    if (!local) return;

    setService(null);
    setBarber(null);
    setDate('');
    setSlots([]);
    setTime('');

    loadServices();
  }, [local]);

  useEffect(() => {
    if (!service) return;

    setBarber(null);
    setDate('');
    setSlots([]);
    setTime('');

    loadBarbers();
  }, [service]);

  const loadBarbers = async () => {
    const data = await getUsersByRole({
      role: 'barbero',
      localId: local.id,
      serviceId: service.id,
    });

    setBarbers(data || []);
  };

  useEffect(() => {
    if (!barber || !date) return;
    loadSlots();
  }, [barber, date]);

  const loadSlots = async () => {
    setSlots([]);

    const data = await getAvailability({
      barberId: barber.id,
      date,
      serviceId: service.id,
    });

    setSlots(data);
  };

  const goToWhatsApp = () => {
    if (!local || !service || !barber || !date || !time) return;

    const message = `Hola, quiero agendar una cita:

📌 Local: ${local.name}
💇 Servicio: ${service.name}
👤 Barbero: ${barber.name}
📆 Fecha: ${date}
🕐 Hora: ${time}`;

    const url = `https://wa.me/573147337602?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');

    setSuccess(true);

    setTimeout(() => {
      resetFlow();
      setSuccess(false);
    }, 1000);
  };

  const resetFlow = () => {
    setLocal(null);
    setService(null);
    setBarber(null);
    setDate('');
    setSlots([]);
    setTime('');
  };

  return (
    <div className="min-h-screen flex bg-black text-white">
      <div className="hidden md:flex w-80 bg-[#0a0a0a] border-r border-gray-800 p-8 flex-col justify-between">
        <div>
          <img
            src="https://res.cloudinary.com/dl7g5sslz/image/upload/v1775236258/logo_ragnorbarber_coihnw.png"
            className="w-80 mb-10"
          />

          <div className="space-y-6 text-sm">
            {[
              'Sede',
              'Servicio',
              'Profesional',
              'Fecha',
              'Horario',
              'Confirmación',
            ].map((step, i) => {
              const stepNumber = i + 1;

              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`
                        w-7 h-7 flex items-center justify-center rounded-full text-xs border
                        ${
                          currentStep === stepNumber
                            ? 'border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                            : currentStep > stepNumber
                              ? 'border-green-500 text-green-500'
                              : 'border-gray-600 text-gray-500'
                        }
                      `}
                  >
                    {currentStep > stepNumber ? '✓' : stepNumber}
                  </div>

                  <span
                    className={`
                        ${
                          currentStep === stepNumber
                            ? 'text-white'
                            : currentStep > stepNumber
                              ? 'text-gray-300'
                              : 'text-gray-500'
                        }
                      `}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-gray-600">Ragnor Barber ©</p>
      </div>

      <div className="flex-1 p-6 md:p-12 relative">
        <div className="md:hidden flex justify-center mb-6">
          <img
            src="https://res.cloudinary.com/dl7g5sslz/image/upload/v1777311594/logo_ragnor_okgsb8.png"
            className="w-70 opacity-90"
          />
        </div>

        <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none">
          <img
            src="https://res.cloudinary.com/dl7g5sslz/image/upload/v1777311594/logo_ragnor_okgsb8.png"
            className="w-[600px]"
          />
        </div>

        <div className="max-w-5xl mx-auto space-y-12 relative z-10 pb-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-semibold">Agenda tu cita</h1>
            {success && (
              <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-xl text-center text-sm">
                Redirigiendo a WhatsApp...
              </div>
            )}
            <p className="text-gray-400 text-sm">Experiencia premium</p>
          </motion.div>

          <motion.div layout>
            <div className="flex items-center gap-2 mb-4">
              <BuildingStorefrontIcon className="w-5 h-5 text-yellow-500" />
              <h2 className="text-gray-400 text-xs tracking-widest uppercase">
                1. Selecciona la sede
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {locals.map((l) => (
                <motion.div
                  key={l.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setLocal(l)}
                  className={`cursor-pointer border rounded-xl p-5 ${
                    local?.id === l.id
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-800 hover:border-gray-600'
                  }`}
                >
                  {l.name}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {local && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-2 mb-4">
                <ScissorsIcon className="w-5 h-5 text-yellow-500" />
                <h2 className="text-gray-400 text-xs tracking-widest uppercase">
                  2. Selecciona el servicio
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {services.map((s) => (
                  <motion.div
                    key={s.id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setService(s)}
                    className={`cursor-pointer border rounded-xl p-4 ${
                      service?.id === s.id
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <p className="font-medium">
                      {s.name} -{' '}
                      {s.priceFrom
                        ? `$${formatPrice(s.priceFrom)}`
                        : 'Precio a convenir'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {s.duration} minutos
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {service && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-2 mb-4">
                <UserIcon className="w-5 h-5 text-yellow-500" />
                <h2 className="text-gray-400 text-xs tracking-widest uppercase">
                  3. Selecciona el profesional
                </h2>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                {barbers.map((b) => (
                  <motion.div
                    key={b.id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setBarber(b)}
                    className={`cursor-pointer border rounded-xl p-4 text-center ${
                      barber?.id === b.id
                        ? 'border-yellow-500 bg-yellow-500/5'
                        : 'border-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <img
                      src={
                        b.avatar || `https://ui-avatars.com/api/?name=${b.name}`
                      }
                      className="w-20 h-20 mx-auto rounded-lg mb-3"
                    />
                    {b.name}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {barber && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 w-full max-w-md"
            >
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-yellow-500" />
                <h2 className="text-gray-400 text-xs tracking-widest uppercase">
                  4. Selecciona la fecha
                </h2>
              </div>

              <div className="relative w-full">
                <input
                  type="date"
                  onChange={(e) => setDate(e.target.value)}
                  className="
                    w-full
                    min-w-0
                    bg-[#0b0b0b]
                    border border-gray-800
                    rounded-xl
                    px-4 py-3
                    text-white
                    text-sm
                    outline-none
                    transition-all
                    focus:border-yellow-500
                    focus:ring-2
                    focus:ring-yellow-500/20
                    hover:border-gray-600
                  "
                />

                <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-transparent focus-within:ring-yellow-500/30 transition" />
              </div>

              <p className="text-xs text-gray-500">
                Selecciona el día en el que deseas agendar la cita
              </p>
            </motion.div>
          )}

          {date && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-2 mb-4">
                <ClockIcon className="w-5 h-5 text-yellow-500" />
                <h2 className="text-gray-400 text-xs tracking-widest uppercase">
                  5. Selecciona la hora
                </h2>
              </div>

              {availabilityLoading ? (
                <p className="text-gray-500">Cargando...</p>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {slots.map((s, i) => (
                    <button
                      key={`${s}-${i}`}
                      onClick={() => setTime(s)}
                      className={`py-2 rounded-lg border cursor-pointer ${
                        time === s
                          ? 'bg-yellow-500 text-black border-yellow-500'
                          : 'border-gray-800 hover:border-gray-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {time && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button
                onClick={goToWhatsApp}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-4 rounded-xl font-semibold cursor-pointer transition duration-200 shadow-lg"
              >
                Confirmar por WhatsApp
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
