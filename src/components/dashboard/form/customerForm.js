'use client';

import { useEffect, useState } from 'react';
import useUsers from '@/lib/api/hooks/useUsers';

import DepartaCiudad from '@/components/dashboard/select/depart_ciud';
import CommentsHistory from '../comments/CommentsHistory';
import AddComment from '../comments/addComment';
import BtnReturn from '../buttons/return';
import BtnSave from '../buttons/save';
import useStates from '@/lib/api/hooks/useStates';
import usePermissions from '@/hooks/usePermissions';

export default function CustomerForm({
  formData,
  handleSubmit,
  setFormData,
  handleReset,
  isLocked = false,
  newComment,
  setNewComment,
  handleAddComment,
  loading,
  mode = 'edit',
}) {
  const [advisors, setAdvisors] = useState([]);
  const [states, setStates] = useState([]);

  const { getUsers } = useUsers();
  const { getStates } = useStates();

  const { canViewAll, canAssign } = usePermissions();

  useEffect(() => {
    canViewAll && fetchUsers();
    fetchStates();
  }, [formData]);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === 'plateNumber') {
      value = value.toUpperCase();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'department' ? { city: '' } : {}),
    }));
  };

  const fetchUsers = async () => {
    try {
      const { data } = await getUsers();
      setAdvisors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStates = async () => {
    try {
      const data = await getStates();
      setStates(data);
    } catch (err) {
      console.error(err);
    }
  };

  const shouldShowDeliveryState = Number(formData.stateId) === 18;
  const shouldShowPlateNumber =
    shouldShowDeliveryState && formData.deliveryState === 'ENTREGADO';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          ['name', 'Nombres y Apellidos', '', true],
          ['email', 'Correo Electronico', 'email', true],
          ['birthdate', 'Fecha de Nacimiento', 'date', true],
          ['phone', 'Teléfono', 'number', true],
          ['address', 'Dirección', 'text', true],
          ['document', 'Documento', 'number', true],
        ].map(([name, label, type = 'text', required = true]) => (
          <div key={name} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              type={type}
              name={name}
              value={formData[name] || ''}
              onChange={handleChange}
              disabled={isLocked}
              className={`w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none transition ${
                isLocked
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
              }`}
              required={required}
            />
          </div>
        ))}

        {canAssign && (
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Asignar Asesor
            </label>
            <select
              name="advisorId"
              value={formData.advisorId || ''}
              onChange={handleChange}
              disabled={isLocked}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            >
              <option value="">Seleccione un asesor</option>
              {advisors?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <DepartaCiudad
          formData={formData}
          handleChange={handleChange}
          isLocked={isLocked}
        />

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            name="stateId"
            value={formData.stateId || ''}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            required
          >
            <option value="">Seleccione un estado</option>
            {states.map((state, i) => (
              <option key={i} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        {shouldShowDeliveryState && (
          <>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Entregado
              </label>
              <select
                name="deliveryState"
                value={formData.deliveryState || ''}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                required
              >
                <option value="">Seleccione un estado</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="PENDIENTE_ENTREGA">Pendiente de Entrega</option>
              </select>
            </div>

            {shouldShowPlateNumber && (
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Número de Placa
                </label>
                <input
                  type="text"
                  name="plateNumber"
                  value={formData.plateNumber || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none transition focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
            )}
          </>
        )}
      </div>

      {mode === 'edit' && (
        <>
          <AddComment
            newComment={newComment}
            setNewComment={setNewComment}
            handleAddComment={handleAddComment}
          />
          <CommentsHistory formData={formData} />
        </>
      )}

      <div className="flex justify-end mt-6 gap-3">
        <BtnReturn route="/CRM/dashboard/customers" />
        {mode === 'new' && handleReset && (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm shadow-sm hover:bg-gray-50 transition cursor-pointer"
          >
            Limpiar
          </button>
        )}
        <BtnSave disabled={loading} />
      </div>
    </form>
  );
}
