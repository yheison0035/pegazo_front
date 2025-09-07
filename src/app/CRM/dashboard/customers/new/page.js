"use client";

import AlertModal from "@/components/dashboard/modals/alertModal";
import BtnClean from "@/components/dashboard/buttons/clear";
import BtnReturn from "@/components/dashboard/buttons/return";
import BtnSave from "@/components/dashboard/buttons/save";
import DepartaCiudad from "@/components/dashboard/select/depart_ciud";
import { useState } from "react";
import { stateCustomer } from "@/api/stateCustomer";
import { advisors } from "@/api/advisors";
import { useAuth } from "@/context/authContext";
import { getRole } from "@/custom/roles";

export default function NewCostumer() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    direction: "",
    departament: "",
    city: "",
    state: "",
    birthdate: "",
  });
  const [alert, setAlert] = useState({ type: "", message: "", url: "" });
  const { usuario } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "departament" ? { city: "" } : {}),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos del cliente:", formData);

    setAlert({
      type: "success",
      message: "Cliente creado correctamente.",
      url: "/CRM/dashboard/customers",
    });
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      direction: "",
      departament: "",
      city: "",
      state: "",
      birthdate: "",
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Crear Cliente Nuevo
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Ingrese la información personal y de contacto para registrar un nuevo
        cliente.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex flex-col">
            <label
              htmlFor="name"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Nombre
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              required
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Correo
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              required
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="birthdate"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              id="birthdate"
              name="birthdate"
              value={formData.birthdate}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              required
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              required
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="direction"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Dirección
            </label>
            <input
              type="text"
              id="direction"
              name="direction"
              value={formData.direction}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              required
            />
          </div>

          {usuario.rol === getRole("ADMIN") && (
            <div className="flex flex-col">
              <label
                htmlFor="advisor"
                className="text-sm font-medium text-gray-700 mb-1"
              >
                Asignar Asesor
              </label>
              <select
                id="advisor"
                name="advisor"
                value={formData.advisor}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                required
              >
                <option value="">Seleccione un estado</option>
                {advisors.map((e, i) => (
                  <option key={i} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col">
            <label
              htmlFor="state"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Estado
            </label>
            <select
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              required
            >
              <option value="">Seleccione un estado</option>
              {stateCustomer.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <DepartaCiudad formData={formData} setFormData={setFormData} />
        </div>

        <div className="flex justify-end mt-6 gap-3">
          <BtnReturn route="/CRM/dashboard/customers" />
          <BtnClean handleReset={handleReset} />
          <BtnSave />
        </div>
      </form>

      <AlertModal
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: "", message: "" })}
        url={alert.url}
      />
    </div>
  );
}
