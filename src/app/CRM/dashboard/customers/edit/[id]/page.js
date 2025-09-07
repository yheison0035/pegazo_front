"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import BtnReturn from "@/components/dashboard/buttons/return";
import BtnSave from "@/components/dashboard/buttons/save";
import { customers } from "@/api/customers";
import { stateCustomer } from "@/api/stateCustomer";
import CommentsHistory from "@/components/dashboard/comments/history";
import AlertModal from "@/components/dashboard/modals/alertModal";
import { stateDelivery } from "@/api/stateDelivery";
import { useAuth } from "@/context/authContext";
import { getRole } from "@/custom/roles";

export default function EditCustomer() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { usuario } = useAuth();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "", url: "" });

  useEffect(() => {
    if (id) {
      const clienteEncontrado = customers.find((c) => c.id === parseInt(id));
      if (clienteEncontrado) {
        setCustomer(clienteEncontrado);
      } else {
        setAlert({
          type: "warning",
          message: "Cliente no encontrado.",
          url: "/CRM/dashboard/customers",
        });
        router.push("/CRM/dashboard/customers");
      }
    }
  }, [id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const date = new Date().toLocaleString();
    setCustomer((prev) => ({
      ...prev,
      comments: [
        ...(prev.comments || []),
        { date, description: newComment.trim(), advisor: "Asesor Demo" },
      ],
    }));
    setNewComment("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    console.log("Datos enviados:", {
      ...customer,
    });

    setTimeout(() => {
      setLoading(false);
      setAlert({
        type: "success",
        message: "Cliente actualizado correctamente.",
        url: "/CRM/dashboard/customers",
      });
    }, 1000);
  };

  if (!customer)
    return (
      <p className="text-center mt-10 text-gray-600 animate-pulse">
        Cargando cliente...
      </p>
    );

  const isLocked =
    usuario.rol === getRole("ADVISOR") && customer.state !== "VENTA";

  return (
    <div className="w-full bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Editar Cliente</h2>
      <p className="text-sm text-gray-500 mb-6">
        Actualice la información del cliente y registre observaciones.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            ["name", "Nombres y Apellidos"],
            ["email", "Correo", "email"],
            ["birthdate", "Fecha de Nacimiento"],
            ["phone", "Teléfono"],
            ["address", "Dirección"],
            ["city", "Ciudad"],
            ["document", "Documento"],
          ].map(([name, label, type = "text"]) => (
            <div key={name}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {label}
              </label>
              <input
                type={type}
                name={name}
                value={customer[name] || ""}
                onChange={handleChange}
                disabled={isLocked}
                className={`mt-1 w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none transition ${
                  isLocked
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                }`}
                required={name === "name" || name === "email"}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Estado
            </label>
            <select
              name="state"
              value={customer.state}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
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

          {customer.state === "VENTA" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Entrega
              </label>
              <select
                name="delivered"
                value={customer.delivered || ""}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                required
              >
                <option value="">Seleccione estado de entrega</option>
                {stateDelivery.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          )}
          {customer.delivered === "ENTREGADO" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Número de Placa *
              </label>
              <input
                type="text"
                name="plateNumber"
                value={customer.plateNumber || ""}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Agregar comentario
          </label>
          <div className="flex gap-3 mt-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              rows="2"
              placeholder="Escriba un comentario..."
            />
            <button
              type="button"
              onClick={handleAddComment}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2 rounded-xl shadow-md hover:opacity-90 transition"
            >
              Agregar
            </button>
          </div>
        </div>

        <CommentsHistory customer={customer} />

        <div className="flex justify-end mt-6 gap-3">
          <BtnReturn route="/CRM/dashboard/customers" />
          <BtnSave disabled={loading} />
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
