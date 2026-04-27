'use client';

import { motion } from 'framer-motion';
import useAppointments from '@/lib/api/hooks/useAppointments';
import useLocals from '@/lib/api/hooks/useLocals';
import useUsers from '@/lib/api/hooks/useUsers';
import useServices from '@/lib/api/hooks/useServices';
import { useEffect, useState } from 'react';
import { formatHour } from '@/lib/api/utils/utils';

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

  const { getLocals } = useLocals();
  const { getUsersByRole } = useUsers();
  const { getAvailability, availabilityLoading } = useAppointments();
  const { getServices } = useServices();

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
    const res = await getLocals({ all: true });
    setLocals(res.data || []);
  };

  const loadServices = async () => {
    const res = await getServices({ all: true });
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

        <div className="max-w-5xl mx-auto space-y-12 relative z-10">
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
            <h2 className="text-gray-500 text-sm mb-4 uppercase">1. Sede</h2>
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
              <h2 className="text-gray-500 text-sm mb-4 uppercase">
                2. Servicio
              </h2>
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
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.duration} min</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {service && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-gray-500 text-sm mb-4 uppercase">
                3. Profesional
              </h2>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-gray-500 text-sm mb-4 uppercase">4. Fecha</h2>
              <input
                type="date"
                className="bg-[#111] border border-gray-800 rounded-lg px-4 py-2"
                onChange={(e) => setDate(e.target.value)}
              />
            </motion.div>
          )}

          {date && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-gray-500 text-sm mb-4 uppercase">
                5. Horario
              </h2>

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
