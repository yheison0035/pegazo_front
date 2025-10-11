'use client';

import { useEffect, useState } from 'react';
import BtnSave from '../buttons/save';
import useMotivation from '@/lib/api/hooks/useMotivation';
import AlertModal from './alertModal';

export default function MessageEditorModal({ onClose }) {
  const {
    getMotivationMessage,
    createMotivation,
    updateMotivation,
    loading,
    error,
  } = useMotivation();
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });
  const [message, setMessage] = useState({
    title: '',
    subtitle: '',
    items: [],
  });

  useEffect(() => {
    fetchMessage();
  }, []);

  const fetchMessage = async () => {
    try {
      const { data } = await getMotivationMessage();
      if (!data || !data[0]) return;
      const { id = '', title = '', subtitle = '', items = [] } = data[0];
      setMessage({
        id,
        title,
        subtitle,
        items,
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error cargando motivación.',
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMessage((prev) => ({ ...prev, [name]: value }));
  };

  const handleListChange = (index, value) => {
    const updated = [...message.items];
    updated[index] = { description: value };
    setMessage((prev) => ({ ...prev, items: updated }));
  };

  const addItem = () => {
    setMessage((prev) => ({
      ...prev,
      items: [...prev.items, { description: '' }],
    }));
  };

  const removeItem = (index) => {
    setMessage((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (message.id) {
        await updateMotivation(message.id, message);
        setAlert({
          type: 'success',
          message: 'Se actualizo correctamente.',
        });
      } else {
        await createMotivation(message);
        setAlert({
          type: 'success',
          message: 'Se creo correctamente.',
        });
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Error guardando datos.',
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 z-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          {message.id
            ? 'Editar Mensaje Motivacional'
            : 'Crear Mensaje Motivacional'}
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="title"
              value={message.title}
              onChange={handleChange}
              placeholder="Título principal"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="text"
              name="subtitle"
              value={message.subtitle}
              onChange={handleChange}
              placeholder="Subtítulo"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
            />

            <div className="space-y-2">
              <p className="font-medium text-gray-700">Lista de beneficios:</p>
              {message?.items?.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleListChange(index, e.target.value)}
                    placeholder="Escribe un beneficio..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    ✖
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 cursor-pointer"
              >
                + Agregar ítem
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 cursor-pointer"
              >
                Cerrar
              </button>
              <BtnSave disabled={loading} />
            </div>
          </form>
        )}
      </div>
      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '', url: '' })}
        url={alert.url}
      />
    </div>
  );
}
