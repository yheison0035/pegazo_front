"use client";

import { useState } from "react";
import { EyeIcon, EyeSlashIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function EditProfile() {
  const [perfil, setPerfil] = useState({
    nombre: "Yeison Suarez",
    correo: "administrador@gmail.com",
    telefono: "3101234567",
    avatar: null,
  });

  const [avatarPreview, setAvatarPreview] = useState("/images/logo.png");
  const [mostrarCambioClave, setMostrarCambioClave] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPerfil({ ...perfil, avatar: file });
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPerfil({ ...perfil, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Perfil actualizado:", perfil);
    console.log("Nueva contraseña:", password);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        Editar Perfil
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white shadow-md rounded-lg p-6"
      >
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-gray-500 text-sm">
                Sin avatar
              </span>
            )}
          </div>
          <label className="cursor-pointer bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 transition">
            Cambiar avatar
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              value={perfil.nombre}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo
            </label>
            <input
              type="email"
              name="correo"
              value={perfil.correo}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              name="telefono"
              value={perfil.telefono}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setMostrarCambioClave(!mostrarCambioClave)}
            className="text-orange-600 hover:underline text-sm font-medium"
          >
            {mostrarCambioClave
              ? "Ocultar cambio de contraseña"
              : "Cambiar contraseña"}
          </button>

          {mostrarCambioClave && (
            <div className="mt-4 space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva contraseña
                </label>
                <input
                  type={verPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  className="absolute top-9 right-3 text-gray-500"
                  onClick={() => setVerPassword(!verPassword)}
                >
                  {verPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  type={verConfirmar ? "text" : "password"}
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  className="absolute top-9 right-3 text-gray-500"
                  onClick={() => setVerConfirmar(!verConfirmar)}
                >
                  {verConfirmar ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-right">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
