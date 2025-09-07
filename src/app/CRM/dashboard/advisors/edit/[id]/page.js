'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import BtnReturn from '@/components/dashboard/buttons/return';
import BtnSave from '@/components/dashboard/buttons/save';
import { advisors } from '@/api/advisors';
import AlertModal from '@/components/dashboard/modals/alertModal';

export default function EditAdvisor() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [advisor, setAdvisor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  useEffect(() => {
    if (id) {
      const advisorSuccefull = advisors.find((c) => c.id === parseInt(id));
      if (advisorSuccefull) {
        setAdvisor(advisorSuccefull);
      } else {
        setAlert({
          type: 'warning',
          message: 'Asesor no encontrado.',
          url: '/CRM/dashboard/advisors',
        });
      }
    }
  }, [id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdvisor((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('Datos actualizados:', advisor);

    setTimeout(() => {
      setLoading(false);
      setAlert({
        type: 'success',
        message: 'Asesor actualizado correctamente.',
        url: '/CRM/dashboard/advisors',
      });
    }, 1000);
  };

  if (!advisor)
    return (
      <p className="text-center mt-10 text-gray-600 animate-pulse">
        Cargando asesor...
      </p>
    );

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Editar Asesor</h2>
      <p className="text-sm text-gray-500 mb-6">
        Actualice la información personal y de contacto del asesor.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            ['name', 'Nombre'],
            ['email', 'Correo', 'email'],
            ['phone', 'Teléfono'],
            ['address', 'Dirección'],
            ['city', 'Ciudad'],
            ['document', 'Documento'],
          ].map(([name, label, type = 'text']) => (
            <div key={name}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {label}
              </label>
              <input
                type={type}
                name={name}
                value={advisor[name] || ''}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                required={name === 'name' || name === 'email'}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6 gap-3">
          <BtnReturn route="/CRM/dashboard/advisors" />
          <BtnSave disabled={loading} />
        </div>
      </form>

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
        url={alert.url}
      />
    </div>
  );
}
