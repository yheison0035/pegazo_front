'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { X } from 'lucide-react';

const fakeData = {
  'FERIA 1 Mall Plaza 77': {
    daily: [
      { name: '21/08/2025', ventas: 200 },
      { name: '22/08/2025', ventas: 260 },
      { name: '23/08/2025', ventas: 310 },
      { name: '24/08/2025', ventas: 280 },
      { name: '25/08/2025', ventas: 340 },
    ],
    monthly: [
      { name: 'Enero', ventas: 4500 },
      { name: 'Febrero', ventas: 5200 },
      { name: 'Marzo', ventas: 6100 },
      { name: 'Abril', ventas: 7200 },
      { name: 'Mayo', ventas: 7600 },
      { name: 'Junio', ventas: 8200 },
      { name: 'Julio', ventas: 9100 },
      { name: 'Agosto', ventas: 9700 },
      { name: 'Septiembre', ventas: 9000 },
    ],
    yearly: [
      { name: '2021', ventas: 36000 },
      { name: '2022', ventas: 42000 },
      { name: '2023', ventas: 48000 },
      { name: '2024', ventas: 56000 },
      { name: '2025', ventas: 62000 },
    ],
  },
  'FERIA 2 La Gran Manzana': {
    daily: [
      { name: '21/08/2025', ventas: 180 },
      { name: '22/08/2025', ventas: 230 },
      { name: '23/08/2025', ventas: 290 },
      { name: '24/08/2025', ventas: 250 },
      { name: '25/08/2025', ventas: 310 },
    ],
    monthly: [
      { name: 'Enero', ventas: 4100 },
      { name: 'Febrero', ventas: 4800 },
      { name: 'Marzo', ventas: 5900 },
      { name: 'Abril', ventas: 6500 },
      { name: 'Mayo', ventas: 7000 },
      { name: 'Junio', ventas: 7700 },
      { name: 'Julio', ventas: 8300 },
      { name: 'Agosto', ventas: 9000 },
      { name: 'Septiembre', ventas: 9000 },
    ],
    yearly: [
      { name: '2021', ventas: 30000 },
      { name: '2022', ventas: 35000 },
      { name: '2023', ventas: 41000 },
      { name: '2024', ventas: 49000 },
      { name: '2025', ventas: 55000 },
    ],
  },
  'Burbuja Mall Plaza 77': {
    daily: [
      { name: '21/08/2025', ventas: 240 },
      { name: '22/08/2025', ventas: 280 },
      { name: '23/08/2025', ventas: 360 },
      { name: '24/08/2025', ventas: 330 },
      { name: '25/08/2025', ventas: 400 },
    ],
    monthly: [
      { name: 'Enero', ventas: 4800 },
      { name: 'Febrero', ventas: 5400 },
      { name: 'Marzo', ventas: 6100 },
      { name: 'Abril', ventas: 6800 },
      { name: 'Mayo', ventas: 7500 },
      { name: 'Junio', ventas: 8300 },
      { name: 'Julio', ventas: 9100 },
      { name: 'Agosto', ventas: 9800 },
      { name: 'Septiembre', ventas: 9000 },
    ],
    yearly: [
      { name: '2021', ventas: 34000 },
      { name: '2022', ventas: 39000 },
      { name: '2023', ventas: 46000 },
      { name: '2024', ventas: 52000 },
      { name: '2025', ventas: 60000 },
    ],
  },
};

export default function Statistics() {
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [timeRange, setTimeRange] = useState('daily');

  const handleSelect = (business) => {
    setSelectedBusiness(business);
  };

  const closeDetail = () => setSelectedBusiness(null);

  return (
    <div className="w-full p-4">
      <h1 className="text-xl md:text-2xl font-semibold text-gray-800 mb-5">
        Estadísticas de Ventas
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.keys(fakeData).map((business) => {
          const totalDia = fakeData[business].daily.slice(-1)[0].ventas;
          const totalMes = fakeData[business].monthly.slice(-1)[0].ventas;
          const totalAnual = fakeData[business].yearly.slice(-1)[0].ventas;

          return (
            <motion.div
              key={business}
              whileHover={{ scale: 1.03 }}
              className="cursor-pointer bg-white text-blue-950 p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              onClick={() => handleSelect(business)}
            >
              <h3 className="text-lg font-semibold cursor-pointer">
                {business}
              </h3>
              <p className="text-sm mt-3">
                Último día: <span className="font-semibold">${totalDia}</span>
              </p>
              <p className="text-sm">
                Último mes: <span className="font-semibold">${totalMes}</span>
              </p>
              <p className="text-sm">
                Total año actual:{' '}
                <span className="font-semibold text-green-600">
                  ${totalAnual}
                </span>
              </p>
              <div className="mt-4 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fakeData[business].daily}>
                    <Line
                      type="monotone"
                      dataKey="ventas"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedBusiness && (
          <motion.div
            className="fixed inset-0 bg-blue-950/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              onClick={closeDetail}
              className="absolute top-6 right-6 text-white hover:text-gray-300"
            >
              <X size={32} />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white text-blue-950 p-6 rounded-2xl shadow-2xl w-full max-w-5xl"
            >
              <h2 className="text-2xl font-semibold mb-2">
                Detalle de {selectedBusiness}
              </h2>
              <div className="flex gap-2 mb-4">
                {['daily', 'monthly', 'yearly'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-md font-semibold text-sm transition ${
                      timeRange === range
                        ? 'bg-blue-950 text-white'
                        : 'bg-gray-200 text-blue-950 hover:bg-gray-300'
                    }`}
                  >
                    {range === 'daily'
                      ? 'Días'
                      : range === 'monthly'
                      ? 'Meses'
                      : 'Años'}
                  </button>
                ))}
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fakeData[selectedBusiness][timeRange]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#1e3a8a" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="ventas"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
