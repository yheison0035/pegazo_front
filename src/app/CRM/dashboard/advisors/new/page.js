'use client';

import { useState } from 'react';

import BtnClean from '@/components/dashboard/buttons/clear';
import BtnSave from '@/components/dashboard/buttons/save';
import BtnReturn from '@/components/dashboard/buttons/return';
import DepartaCiudad from '@/components/dashboard/select/depart_ciud';
import AlertModal from '@/components/dashboard/modals/alertModal';

export default function NewAdvisor() {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    direccion: '',
    departamento: '',
    ciudad: '',
    rol: '',
    estado: '',
  });
  const [alert, setAlert] = useState({ type: '', message: '', url: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'departamento' ? { ciudad: '' } : {}),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Datos del asesor:', formData);

    setTimeout(() => {
      setAlert({
        type: 'success',
        message: 'Asesor creado correctamente.',
        url: '/CRM/dashboard/advisors',
      });
    }, 1000);
  };

  const handleReset = () => {
    setFormData({
      nombre: '',
      correo: '',
      telefono: '',
      direccion: '',
      departamento: '',
      ciudad: '',
      rol: '',
      estado: '',
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Crear Asesor Nuevo
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Ingrese la información personal y de contacto para registrar un nuevo
        asesor.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Nombre */}
          <div className="flex flex-col">
            <label
              htmlFor="nombre"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              required
            />
          </div>

          {/* Correo */}
          <div className="flex flex-col">
            <label
              htmlFor="correo"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Correo
            </label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              required
            />
          </div>

          {/* Teléfono */}
          <div className="flex flex-col">
            <label
              htmlFor="telefono"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Teléfono
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              required
            />
          </div>

          {/* Dirección */}
          <div className="flex flex-col">
            <label
              htmlFor="direccion"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Dirección
            </label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              required
            />
          </div>

          {/* Rol */}
          <div className="flex flex-col">
            <label
              htmlFor="rol"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Rol
            </label>
            <select
              id="rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              required
            >
              <option value="">Selecciona un rol</option>
              <option value="Administrador">Administrador</option>
              <option value="Asesor">Asesor</option>
            </select>
          </div>

          {/* Estado */}
          <div className="flex flex-col">
            <label
              htmlFor="estado"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              required
            >
              <option value="">Selecciona un estado</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          {/* Departamento / Ciudad */}
          <DepartaCiudad formData={formData} setFormData={setFormData} />
        </div>

        {/* Botones */}
        <div className="flex justify-end mt-6 gap-3">
          <BtnReturn route="/CRM/dashboard/advisors" />
          <BtnClean handleReset={handleReset} />
          <BtnSave />
        </div>
      </form>

      {/* Alerta */}
      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '', url: '' })}
        url={alert.url}
      />
    </div>
  );
}
