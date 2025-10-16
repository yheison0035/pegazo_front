'use client';

import { useCallback, useEffect, useState } from 'react';
import useMotivation from '@/lib/api/hooks/useMotivation';

export default function AlertMotivation({ onClose }) {
  const { getMotivationMessage } = useMotivation();
  const [motivationMessage, setMotivationMessage] = useState(null);

  const fetchMessage = useCallback(async () => {
    try {
      const { data } = await getMotivationMessage();
      if (!data || !data[0]) return;
      setMotivationMessage(data[0]);
    } catch (err) {
      console.error(err);
    }
  }, [getMotivationMessage]);

  useEffect(() => {
    fetchMessage();
  }, [fetchMessage]);

  if (!motivationMessage) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-fadeIn z-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          {motivationMessage?.title}
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {motivationMessage?.subtitle}
        </p>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 shadow-md">
          <ul className="list-disc list-inside text-sm space-y-1">
            {motivationMessage?.items?.map((e, i) => (
              <li key={i}>{e.description}</li>
            ))}
          </ul>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition cursor-pointer font-medium"
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  );
}
